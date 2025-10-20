import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { auth } from "./firebase";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import type { Employee } from "./employees-service";

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

export interface EmployeeGoogleCalendarStatus {
    isConnected: boolean;
    lastSync?: Date;
    calendarId?: string;
    syncEnabled: boolean;
    employeeId: string;
    employeeName: string;
    googleCalendarEmail?: string;
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
            const user = auth.currentUser;
            
            if (!user) {
                return null;
            }

            // Pobierz token z Firestore
            const db = getFirestore();
            const tokenDoc = await getDoc(doc(db, 'googleTokens', user.uid));
            
            if (!tokenDoc.exists()) {
                return null;
            }

            const data = tokenDoc.data();
            
            return {
                isConnected: data.isActive === true,
                lastSync: data.updatedAt?.toDate(),
                calendarId: data.calendarId,
                syncEnabled: data.isActive === true
            };
        } catch (error) {
            console.error('Error getting connection status:', error);
            return null;
        }
    }

    // Get Google Calendar connection status for specific employee
    async getEmployeeConnectionStatus(employee: Employee): Promise<EmployeeGoogleCalendarStatus | null> {
        try {
            if (!employee.googleCalendarEmail) {
                return {
                    isConnected: false,
                    syncEnabled: false,
                    employeeId: employee.id,
                    employeeName: employee.name,
                };
            }

            // Pobierz token dla pracownika na podstawie emaila Google Calendar
            const db = getFirestore();
            const tokensQuery = query(
                collection(db, 'googleTokens'),
                where('email', '==', employee.googleCalendarEmail)
            );
            
            const querySnapshot = await getDoc(doc(db, 'googleTokens', employee.googleCalendarEmail));
            
            if (!querySnapshot.exists()) {
                return {
                    isConnected: false,
                    syncEnabled: false,
                    employeeId: employee.id,
                    employeeName: employee.name,
                    googleCalendarEmail: employee.googleCalendarEmail,
                };
            }

            const data = querySnapshot.data();
            
            return {
                isConnected: data.isActive === true,
                lastSync: data.updatedAt?.toDate(),
                calendarId: data.calendarId,
                syncEnabled: data.isActive === true,
                employeeId: employee.id,
                employeeName: employee.name,
                googleCalendarEmail: employee.googleCalendarEmail,
            };
        } catch (error) {
            console.error('Error getting employee connection status:', error);
            return {
                isConnected: false,
                syncEnabled: false,
                employeeId: employee.id,
                employeeName: employee.name,
                googleCalendarEmail: employee.googleCalendarEmail,
            };
        }
    }

    // Get OAuth URL for specific employee
    async getEmployeeAuthUrl(employee: Employee): Promise<string> {
        if (!employee.googleCalendarEmail) {
            throw new Error('Pracownik nie ma skonfigurowanego emaila Google Calendar!');
        }

        try {
            const getAuthUrl = httpsCallable(functions, 'getGoogleAuthUrl');
            const result = await getAuthUrl({ email: employee.googleCalendarEmail });
            return (result.data as { url: string }).url;
        } catch (error) {
            console.error('Error getting Google auth URL for employee:', error);
            throw new Error('Failed to get Google authorization URL for employee');
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
        googleCalendarEmail?: string;
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

    // Sync appointment to Google Calendar for specific employee
    async syncAppointmentToGoogleForEmployee(appointmentData: {
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
    }, employee: Employee): Promise<string | null> {
        try {
            if (!employee.googleCalendarEmail) {
                console.warn(`Employee ${employee.name} has no Google Calendar email configured`);
                return null;
            }

            const syncAppointment = httpsCallable(functions, 'syncAppointmentToGoogle');
            const result = await syncAppointment({
                ...appointmentData,
                googleCalendarEmail: employee.googleCalendarEmail,
            });
            const syncResult = result.data as SyncResult;
            return syncResult.success ? syncResult.googleEventId || null : null;
        } catch (error) {
            console.error(`Error syncing appointment to Google Calendar for employee ${employee.name}:`, error);
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
    async deleteGoogleCalendarEvent(googleEventId: string, googleCalendarEmail?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const deleteEvent = httpsCallable(functions, 'deleteGoogleCalendarEvent');
            const result = await deleteEvent({
                googleEventId,
                googleCalendarEmail,
            });
            return result.data as { success: boolean; error?: string };
        } catch (error) {
            console.error('Error deleting Google Calendar event:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Delete event from Google Calendar for specific employee
    async deleteGoogleCalendarEventForEmployee(googleEventId: string, employee: Employee): Promise<{ success: boolean; error?: string }> {
        try {
            if (!employee.googleCalendarEmail) {
                console.warn(`Employee ${employee.name} has no Google Calendar email configured`);
                return {
                    success: false,
                    error: 'Employee has no Google Calendar email configured'
                };
            }

            const deleteEvent = httpsCallable(functions, 'deleteGoogleCalendarEvent');
            const result = await deleteEvent({
                googleEventId,
                googleCalendarEmail: employee.googleCalendarEmail,
            });
            return result.data as { success: boolean; error?: string };
        } catch (error) {
            console.error(`Error deleting Google Calendar event for employee ${employee.name}:`, error);
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
        googleCalendarEmail?: string;
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

    // Update event in Google Calendar for specific employee
    async updateGoogleCalendarEventForEmployee(data: {
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
    }, employee: Employee): Promise<{ success: boolean; error?: string }> {
        try {
            if (!employee.googleCalendarEmail) {
                console.warn(`Employee ${employee.name} has no Google Calendar email configured`);
                return {
                    success: false,
                    error: 'Employee has no Google Calendar email configured'
                };
            }

            const updateEvent = httpsCallable(functions, 'updateGoogleCalendarEvent');
            const result = await updateEvent({
                ...data,
                googleCalendarEmail: employee.googleCalendarEmail,
            });
            return result.data as { success: boolean; error?: string };
        } catch (error) {
            console.error(`Error updating Google Calendar event for employee ${employee.name}:`, error);
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

    // Update Google Calendar Event ID in Firestore
    async updateGoogleCalendarEventId(appointmentId: string, googleEventId: string): Promise<void> {
        try {
            const db = getFirestore();
            const appointmentRef = doc(db, 'appointments', appointmentId);
            await updateDoc(appointmentRef, {
                googleCalendarEventId: googleEventId,
            });
        } catch (error) {
            console.error('Error updating Google Calendar Event ID:', error);
            throw new Error('Failed to update Google Calendar Event ID');
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();