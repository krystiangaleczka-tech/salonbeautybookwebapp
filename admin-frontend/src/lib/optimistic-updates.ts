import { Appointment } from "./appointments-service";
import { Timestamp } from 'firebase/firestore';

export interface CalendarEvent {
  id: string;
  serviceId: string;
  clientName: string;
  staffName: string;
  start: string; // ISO string
  end: string; // ISO string
  status: "confirmed" | "pending" | "no-show" | "cancelled";
  price?: string;
  offline?: boolean;
  notes?: string;
  googleCalendarEventId?: string; // ID wydarzenia w Google Calendar
  isGoogleSynced?: boolean; // Czy wydarzenie jest zsynchronizowane z Google Calendar
}

export type OptimisticAppointment = CalendarEvent & {
    _optimistic?: boolean;
    _tempId?: string;
    clientId: string; // Required for Appointment type
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
};

/**
 * Generate temporary ID for optimistic updates
 */
export function generateTempId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if appointment is optimistic (not yet saved to Firestore)
 */
export function isOptimistic(appointment: OptimisticAppointment): boolean {
    return appointment._optimistic === true;
}

/**
 * Replace optimistic appointment with real one
 */
export function replaceOptimistic(
    appointments: OptimisticAppointment[],
    tempId: string,
    realAppointment: CalendarEvent
): OptimisticAppointment[] {
    return appointments.map(appt =>
        appt._tempId === tempId ? {
            ...realAppointment,
            _optimistic: false,
            clientId: appt.clientId, // Preserve clientId from optimistic appointment
            createdAt: appt.createdAt,
            updatedAt: appt.updatedAt,
        } : appt
    );
}

/**
 * Remove failed optimistic appointment
 */
export function removeOptimistic(
    appointments: OptimisticAppointment[],
    tempId: string
): OptimisticAppointment[] {
    return appointments.filter(appt => appt._tempId !== tempId);
}