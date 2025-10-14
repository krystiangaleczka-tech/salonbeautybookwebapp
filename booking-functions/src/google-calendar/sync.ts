import { https } from "firebase-functions/v2";
import { CallableRequest } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { getFirestore } from "firebase-admin/firestore";
import { getGoogleAuthClient } from "./auth";
import {
    GoogleCalendarEvent,
    CalendarSync,
    AppointmentData,
    ServiceData,
    CustomerData,
} from "./types";

interface SyncAppointmentData {
    appointmentId: string;
}

interface DeleteAppointmentData {
    appointmentId: string;
}

interface BatchSyncData {
    appointmentIds: string[];
}

const syncAppointmentLogic = async (appointmentId: string, userId: string): Promise<{
    success: boolean;
    googleEventId?: string;
    eventLink?: string;
}> => {
    try {
        const db = getFirestore();
        
        // Get Google auth tokens
        const tokens = await getGoogleAuthClient(userId);
        
        // Set up OAuth client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: tokens?.accessToken,
            refresh_token: tokens?.refreshToken,
        });

        // Get appointment data
        const appointmentDoc = await db.collection("appointments").doc(appointmentId).get();
        if (!appointmentDoc.exists) {
            throw new Error("Appointment not found");
        }
        
        const appointment = appointmentDoc.data() as AppointmentData;
        if (!appointment) {
            throw new Error("Appointment data is missing");
        }
        
        // Get related data
        const [serviceDoc, customerDoc] = await Promise.all([
            db.collection("services").doc(appointment.serviceId).get(),
            db.collection("customers").doc(appointment.clientId).get(),
        ]);
        
        if (!serviceDoc.exists || !customerDoc.exists) {
            throw new Error("Service or customer not found");
        }
        
        const service = serviceDoc.data() as ServiceData;
        const customer = customerDoc.data() as CustomerData;
        
        if (!service || !customer) {
            throw new Error("Service or customer data is missing");
        }

        // Create Google Calendar event
        const calendarEvent: GoogleCalendarEvent = {
            summary: `${service.name} - ${customer.fullName}`,
            description: `Usługa: ${service.name}\nKlient: ${customer.fullName}\n${appointment.notes || ""}`,
            start: {
                dateTime: appointment.start.toDate().toISOString(),
                timeZone: "Europe/Warsaw",
            },
            end: {
                dateTime: appointment.end.toDate().toISOString(),
                timeZone: "Europe/Warsaw",
            },
            extendedProperties: {
                private: {
                    appointmentId: appointmentId,
                    salonId: process.env.GCLOUD_PROJECT || "salonbeautymario-x1",
                    serviceId: appointment.serviceId,
                },
            },
        };

        // Add attendee if customer has email
        if (customer?.email) {
            calendarEvent.attendees = [{
                email: customer.email,
                displayName: customer.fullName,
            }];
        }

        // Create calendar API client
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        
        // Check if event already exists
        const syncDoc = await db.collection("calendarSync").doc(appointmentId).get();
        let response;
        
        if (syncDoc.exists && syncDoc.data()?.googleEventId) {
            // Update existing event
            response = await calendar.events.update({
                calendarId: "primary",
                eventId: syncDoc.data()?.googleEventId,
                requestBody: calendarEvent,
            });
        } else {
            // Create new event
            response = await calendar.events.insert({
                calendarId: "primary",
                requestBody: calendarEvent,
            });
        }

        // Save sync record
        const syncData: CalendarSync = {
            appointmentId,
            googleEventId: response.data.id || "",
            userId,
            lastSyncAt: new Date(),
            syncDirection: "to_google",
            status: "synced",
        };

        await db.collection("calendarSync").doc(appointmentId).set(syncData);

        return {
            success: true,
            googleEventId: response.data.id || undefined,
            eventLink: response.data.htmlLink || undefined,
        };
    } catch (error) {
        console.error("Error syncing appointment to Google:", error);
        throw error;
    }
};

export const syncAppointmentToGoogle = https.onCall(async (request: CallableRequest<SyncAppointmentData>) => {
    if (!request?.auth?.uid) {
        throw new https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const { appointmentId } = request.data;
    
    if (!appointmentId) {
        throw new https.HttpsError("invalid-argument", "Appointment ID is required");
    }

    try {
        const db = getFirestore();
        
        // Get Google auth tokens
        const tokens = await getGoogleAuthClient(request.auth.uid);
        
        // Set up OAuth client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: tokens?.accessToken,
            refresh_token: tokens?.refreshToken,
        });

        // Get appointment data
        const appointmentDoc = await db.collection("appointments").doc(appointmentId).get();
        if (!appointmentDoc.exists) {
            throw new https.HttpsError("not-found", "Appointment not found");
        }
        
        const appointment = appointmentDoc.data() as AppointmentData;
        if (!appointment) {
            throw new https.HttpsError("not-found", "Appointment data is missing");
        }
        
        // Get related data
        const [serviceDoc, customerDoc] = await Promise.all([
            db.collection("services").doc(appointment.serviceId).get(),
            db.collection("customers").doc(appointment.clientId).get(),
        ]);
        
        if (!serviceDoc.exists || !customerDoc.exists) {
            throw new https.HttpsError("not-found", "Service or customer not found");
        }
        
        const service = serviceDoc.data() as ServiceData;
        const customer = customerDoc.data() as CustomerData;
        
        if (!service || !customer) {
            throw new https.HttpsError("not-found", "Service or customer data is missing");
        }

        // Create Google Calendar event
        const calendarEvent: GoogleCalendarEvent = {
            summary: `${service.name} - ${customer.fullName}`,
            description: `Usługa: ${service.name}\nKlient: ${customer.fullName}\n${appointment.notes || ""}`,
            start: {
                dateTime: appointment.start.toDate().toISOString(),
                timeZone: "Europe/Warsaw",
            },
            end: {
                dateTime: appointment.end.toDate().toISOString(),
                timeZone: "Europe/Warsaw",
            },
            extendedProperties: {
                private: {
                    appointmentId: appointmentId,
                    salonId: process.env.GCLOUD_PROJECT || "salonbeautymario-x1",
                    serviceId: appointment.serviceId,
                },
            },
        };

        // Add attendee if customer has email
        if (customer?.email) {
            calendarEvent.attendees = [{
                email: customer.email,
                displayName: customer.fullName,
            }];
        }

        // Create calendar API client
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        
        // Check if event already exists
        const syncDoc = await db.collection("calendarSync").doc(appointmentId).get();
        let response;
        
        if (syncDoc.exists && syncDoc.data()?.googleEventId) {
            // Update existing event
            response = await calendar.events.update({
                calendarId: "primary",
                eventId: syncDoc.data()?.googleEventId,
                requestBody: calendarEvent,
            });
        } else {
            // Create new event
            response = await calendar.events.insert({
                calendarId: "primary",
                requestBody: calendarEvent,
            });
        }

        // Save sync record
        const syncData: CalendarSync = {
            appointmentId,
            googleEventId: response.data.id || "",
            userId: request.auth.uid,
            lastSyncAt: new Date(),
            syncDirection: "to_google",
            status: "synced",
        };

        await db.collection("calendarSync").doc(appointmentId).set(syncData);

        return {
            success: true,
            googleEventId: response.data.id,
            eventLink: response.data.htmlLink,
        };
    } catch (error) {
        console.error("Error syncing appointment to Google:", error);
        throw new https.HttpsError("internal", "Failed to sync appointment to Google Calendar");
    }
});

export const deleteGoogleCalendarEvent = https.onCall(async (request: CallableRequest<DeleteAppointmentData>) => {
    if (!request?.auth?.uid) {
        throw new https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const { appointmentId } = request.data;
    
    if (!appointmentId) {
        throw new https.HttpsError("invalid-argument", "Appointment ID is required");
    }

    try {
        const db = getFirestore();
        
        // Get sync record
        const syncDoc = await db.collection("calendarSync").doc(appointmentId).get();
        if (!syncDoc.exists || !syncDoc.data()?.googleEventId) {
            return { success: true, message: "No Google Calendar event to delete" };
        }

        const syncData = syncDoc.data();
        
        // Get Google auth tokens
        const tokens = await getGoogleAuthClient(request.auth.uid);
        
        // Set up OAuth client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
        });

        // Delete calendar event
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        await calendar.events.delete({
            calendarId: "primary",
            eventId: syncData?.googleEventId,
        });

        // Delete sync record
        await db.collection("calendarSync").doc(appointmentId).delete();

        return { success: true };
    } catch (error) {
        console.error("Error deleting Google Calendar event:", error);
        throw new https.HttpsError("internal", "Failed to delete Google Calendar event");
    }
});

export const batchSyncAppointments = https.onCall(async (request: CallableRequest<BatchSyncData>) => {
    if (!request?.auth?.uid) {
        throw new https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const { appointmentIds } = request.data;
    
    if (!Array.isArray(appointmentIds)) {
        throw new https.HttpsError("invalid-argument", "Appointment IDs must be an array");
    }

    const results = [];
    const errors = [];

    for (const appointmentId of appointmentIds) {
        try {
            await syncAppointmentLogic(appointmentId, request.auth.uid);
            results.push(appointmentId);
        } catch (error) {
            console.error(`Failed to sync appointment ${appointmentId}:`, error);
            errors.push({ appointmentId, error: (error as Error).message });
        }
    }

    return {
        success: true,
        synced: results,
        errors,
        total: appointmentIds.length,
    };
});

