import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

// Set global options for all functions
setGlobalOptions({
    "region": "europe-central2",
});

// Import Google Calendar functions
export { getGoogleAuthUrl, handleGoogleCallback } from "./google-calendar/auth";
export {
    syncAppointmentToGoogle,
    deleteGoogleCalendarEvent,
    batchSyncAppointments,
    updateGoogleCalendarEvent,
} from "./google-calendar/sync";

// Export Firestore Triggers
export {
    onAppointmentCreated,
    onAppointmentUpdated,
    onAppointmentDeleted,
} from "./firestore-triggers";

initializeApp();
