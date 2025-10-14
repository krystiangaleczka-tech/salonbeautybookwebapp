import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { auth } from "./firebase";

export interface GoogleCalendarStatus {
    isConnected: boolean;
    lastSync?: Date;
    calendarId?: string;
    syncEnabled: boolean;
}

export interface SyncResult {
    success: boolean;
    googleEventId?: string;
    eventLink?: string;
    error?: string;
}

export interface BatchSyncResult {
    success: boolean;
    synced: string[];
    errors: Array<{ appointmentId: string; error: string }>;
    total: number;
}

class GoogleCalendarService {
    // Get OAuth URL for Google Calendar authorization
    async getAuthUrl(): Promise<string> {
        // Sprawdź czy użytkownik jest zalogowany
        const user = auth.currentUser;
        
        if (!user) {
            throw new Error('Musisz być zalogowany aby połączyć Google Calendar!');
        }

        try {
            const getAuthUrl = httpsCallable(functions, 'getGoogleAuthUrl');
            const result = await getAuthUrl();
            return (result.data as { url: string }).url;
        } catch (error) {
            console.error('Error getting Google auth URL:', error);
            throw new Error('Failed to get Google authorization URL');
        }
    }

    // Get Google Calendar connection status
    async getConnectionStatus(): Promise<GoogleCalendarStatus | null> {
        try {
            // This would be implemented as a Cloud Function
            // For now, return null - will be implemented later
            return null;
        } catch (error) {
            console.error('Error getting connection status:', error);
            return null;
        }
    }

    // Sync appointment to Google Calendar with full appointment data
    async syncAppointmentToGoogle(appointmentData: {
        id: string;
        serviceId: string;
        clientId: string;
        staffName: string;
        start: Date;
        end: Date;
        status: string;
        notes?: string;
        clientEmail?: string;
        serviceName: string;
        clientName: string;
    }): Promise<string | null> {
        try {
            const syncAppointment = httpsCallable(functions, 'syncAppointmentToGoogle');
            const result = await syncAppointment(appointmentData);
            const syncResult = result.data as SyncResult;
            return syncResult.success ? syncResult.googleEventId || null : null;
        } catch (error) {
            console.error('Error syncing appointment to Google Calendar:', error);
            return null;
        }
    }

    // Sync appointment by ID
    async syncAppointment(appointmentId: string): Promise<SyncResult> {
        try {
            const syncAppointment = httpsCallable(functions, 'syncAppointmentToGoogle');
            const result = await syncAppointment({ appointmentId });
            return result.data as SyncResult;
        } catch (error) {
            console.error('Error syncing appointment to Google Calendar:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Delete event from Google Calendar by Google Event ID
    async deleteGoogleCalendarEvent(googleEventId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const deleteEvent = httpsCallable(functions, 'deleteGoogleCalendarEvent');
            const result = await deleteEvent({ googleEventId });
            return result.data as { success: boolean; error?: string };
        } catch (error) {
            console.error('Error deleting Google Calendar event:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Delete event from Google Calendar by appointment ID
    async deleteGoogleEvent(appointmentId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const deleteEvent = httpsCallable(functions, 'deleteGoogleCalendarEvent');
            const result = await deleteEvent({ appointmentId });
            return result.data as { success: boolean; error?: string };
        } catch (error) {
            console.error('Error deleting Google Calendar event:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Update event in Google Calendar
    async updateGoogleCalendarEvent(data: {
        googleCalendarEventId: string;
        appointment: {
            id: string;
            serviceId: string;
            clientId: string;
            staffName: string;
            start: Date;
            end: Date;
            status: string;
            notes?: string;
        };
        clientEmail?: string;
        serviceName: string;
        clientName: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const updateEvent = httpsCallable(functions, 'updateGoogleCalendarEvent');
            const result = await updateEvent(data);
            return result.data as { success: boolean; error?: string };
        } catch (error) {
            console.error('Error updating Google Calendar event:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Batch sync multiple appointments
    async batchSyncAppointments(appointmentIds: string[]): Promise<BatchSyncResult> {
        try {
            const batchSync = httpsCallable(functions, 'batchSyncAppointments');
            const result = await batchSync({ appointmentIds });
            return result.data as BatchSyncResult;
        } catch (error) {
            console.error('Error batch syncing appointments:', error);
            return {
                success: false,
                synced: [],
                errors: [],
                total: appointmentIds.length
            };
        }
    }

    // Disconnect Google Calendar
    async disconnect(): Promise<{ success: boolean; error?: string }> {
        try {
            // This would be implemented as a Cloud Function
            // For now, return success - will be implemented later
            return { success: true };
        } catch (error) {
            console.error('Error disconnecting Google Calendar:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Handle OAuth callback
    handleCallback(code: string, state: string): void {
        // This is handled by the Cloud Function
        // Just redirect to the callback URL
        window.location.href = `/auth/google/callback?code=${code}&state=${state}`;
    }
}

export const googleCalendarService = new GoogleCalendarService();