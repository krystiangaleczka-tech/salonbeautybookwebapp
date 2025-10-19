import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { google } from "googleapis";

// ============================================
// HELPER: Get Google Calendar Client
// ============================================
/** Gets Google Calendar client */
async function getGoogleCalendarClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    // Get refresh token from Firestore
    const settingsDoc = await admin.firestore().collection("settings").doc("google-calendar").get();
    const refreshToken = settingsDoc.data()?.refreshToken;

    if (!refreshToken) {
        throw new Error("No refresh token found in Firestore");
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.calendar({ version: "v3", auth: oauth2Client });
}

// ============================================
// HELPER: Retry Logic
// ============================================
/** Retry function
 * @param {() => Promise<T>} fn
 * @param {number} maxRetries
 * @param {number} baseDelay
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            const delay = baseDelay * Math.pow(2, i);
            logger.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw new Error("Max retries exceeded");
}

// ============================================
// TRIGGER 1: onCreate - Auto-sync nowych wizyt
// ============================================
export const onAppointmentCreated = onDocumentCreated({
    document: "appointments/{appointmentId}",
    region: "europe-central2",
    memory: "256MiB",
}, async (event) => {
    const appointmentId = event.params.appointmentId;
    const appointment = event.data?.data();

    if (!appointment) {
        logger.error("No appointment data found");
        return;
    }

    logger.info(`🔄 Auto-syncing new appointment: ${appointmentId}`);

    try {
        // Get customer and service details
        const [customerDoc, serviceDoc] = await Promise.all([
            admin.firestore().collection("customers").doc(appointment.clientId).get(),
            admin.firestore().collection("services").doc(appointment.serviceId).get(),
        ]);

        const customer = customerDoc.data();
        const service = serviceDoc.data();

        if (!customer || !service) {
            logger.error("Customer or service not found");
            return;
        }

        // Create Google Calendar event with retry
        const calendar = await getGoogleCalendarClient();
        
        const result = await retryWithBackoff(async () => {
            return await calendar.events.insert({
                calendarId: "primary",
                requestBody: {
                    summary: `${service.name} - ${customer.fullName}`,
                    description: appointment.notes || "",
                    start: {
                        dateTime: appointment.start.toDate().toISOString(),
                        timeZone: "Europe/Warsaw",
                    },
                    end: {
                        dateTime: appointment.end.toDate().toISOString(),
                        timeZone: "Europe/Warsaw",
                    },
                    attendees: customer.email ? [{ email: customer.email }] : [],
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: "email", minutes: 24 * 60 },
                            { method: "popup", minutes: 30 },
                        ],
                    },
                },
            });
        });

        // Save Google Event ID to Firestore
        if (result.data.id) {
            await admin.firestore().collection("appointments").doc(appointmentId).update({
                googleCalendarEventId: result.data.id,
                syncedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info(`✅ Synced ${appointmentId} -> Google Event: ${result.data.id}`);
        }
    } catch (error) {
        logger.error(`❌ Failed to sync appointment ${appointmentId}:`, error);
        
        // Mark as failed in Firestore
        await admin.firestore().collection("appointments").doc(appointmentId).update({
            syncError: (error as Error).message,
            syncFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});

// ============================================
// TRIGGER 2: onUpdate - Auto-update edytowanych wizyt
// ============================================
export const onAppointmentUpdated = onDocumentUpdated({
    document: "appointments/{appointmentId}",
    region: "europe-central2",
    memory: "256MiB",
}, async (event) => {
    const appointmentId = event.params.appointmentId;
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!after) {
        logger.error("No appointment data found");
        return;
    }

    // Skip if no changes to relevant fields
    const relevantFields = ["start", "end", "serviceId", "clientId", "staffName", "notes", "status"];
    const hasRelevantChanges = relevantFields.some((field) => {
        const beforeVal = before?.[field];
        const afterVal = after[field];
        
        // Handle Timestamp comparison
        if (beforeVal?.toDate && afterVal?.toDate) {
            return beforeVal.toDate().getTime() !== afterVal.toDate().getTime();
        }
        
        return beforeVal !== afterVal;
    });

    if (!hasRelevantChanges) {
        logger.info(`⏭️ No relevant changes for ${appointmentId}, skipping sync`);
        return;
    }

    logger.info(`🔄 Auto-updating appointment: ${appointmentId}`);

    try {
        const googleEventId = after.googleCalendarEventId;

        if (!googleEventId) {
            logger.warn(`⚠️ No googleEventId for ${appointmentId}, triggering first-time sync`);
            // Trigger onCreate logic
            return;
        }

        // Get customer and service details
        const [customerDoc, serviceDoc] = await Promise.all([
            admin.firestore().collection("customers").doc(after.clientId).get(),
            admin.firestore().collection("services").doc(after.serviceId).get(),
        ]);

        const customer = customerDoc.data();
        const service = serviceDoc.data();

        if (!customer || !service) {
            logger.error("Customer or service not found");
            return;
        }

        // Update Google Calendar event with retry
        const calendar = await getGoogleCalendarClient();
        
        await retryWithBackoff(async () => {
            await calendar.events.patch({
                calendarId: "primary",
                eventId: googleEventId,
                requestBody: {
                    summary: `${service.name} - ${customer.fullName}`,
                    description: after.notes || "",
                    start: {
                        dateTime: after.start.toDate().toISOString(),
                        timeZone: "Europe/Warsaw",
                    },
                    end: {
                        dateTime: after.end.toDate().toISOString(),
                        timeZone: "Europe/Warsaw",
                    },
                    attendees: customer.email ? [{ email: customer.email }] : [],
                },
            });
        });

        // Update sync timestamp
        await admin.firestore().collection("appointments").doc(appointmentId).update({
            syncedAt: admin.firestore.FieldValue.serverTimestamp(),
            syncError: admin.firestore.FieldValue.delete(), // Clear previous errors
        });

        logger.info(`✅ Updated Google Event: ${googleEventId}`);
    } catch (error) {
        logger.error(`❌ Failed to update appointment ${appointmentId}:`, error);
        
        await admin.firestore().collection("appointments").doc(appointmentId).update({
            syncError: (error as Error).message,
            syncFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});


// ============================================
// TRIGGER 3: onDelete - Auto-delete z Google Calendar
// ============================================
export const onAppointmentDeleted = onDocumentDeleted({
    document: "appointments/{appointmentId}",
    region: "europe-central2",
    memory: "256MiB",
}, async (event) => {
    const appointmentId = event.params.appointmentId;
    const appointment = event.data?.data();

    if (!appointment?.googleCalendarEventId) {
        logger.info(`⏭️ No googleEventId for ${appointmentId}, skipping delete`);
        return;
    }

    const googleEventId = appointment.googleCalendarEventId;
    logger.info(`🗑️ Auto-deleting Google Event: ${googleEventId}`);

    try {
        const calendar = await getGoogleCalendarClient();
        
        await retryWithBackoff(async () => {
            await calendar.events.delete({
                calendarId: "primary",
                eventId: googleEventId,
            });
        });

        logger.info(`✅ Deleted Google Event: ${googleEventId}`);
    } catch (error) {
        logger.error(`❌ Failed to delete Google Event ${googleEventId}:`, error);
        // Don't throw - appointment is already deleted from Firestore
    }
});

