export interface GoogleToken {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiryDate: Date;
    calendarId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CalendarSync {
    appointmentId: string;
    googleEventId: string;
    userId: string;
    lastSyncAt: Date;
    syncDirection: "to_google" | "from_google" | "bidirectional";
    status: "synced" | "pending" | "error";
    errorMessage?: string;
}

export interface GoogleCalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
    }>;
    extendedProperties?: {
        private?: {
            appointmentId: string;
            salonId: string;
            serviceId: string;
        };
    };
}

export interface SyncAppointmentRequest {
    data: {
        appointmentId: string;
    };
    auth: {
        uid: string;
    };
}

export interface DeleteAppointmentRequest {
    data: {
        appointmentId: string;
    };
    auth: {
        uid: string;
    };
}

export interface BatchSyncRequest {
    data: {
        appointmentIds: string[];
    };
    auth: {
        uid: string;
    };
}

export interface AppointmentData {
    id: string;
    serviceId: string;
    clientId: string;
    start: {
        toDate: () => Date;
    };
    end: {
        toDate: () => Date;
    };
    notes?: string;
}

export interface ServiceData {
    name: string;
}

export interface CustomerData {
    fullName: string;
    email?: string;
}
