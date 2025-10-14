import { initializeApp } from "firebase-admin/app";

// Import Google Calendar functions
export { getGoogleAuthUrl, handleGoogleCallback } from "./google-calendar/auth";
export { syncAppointmentToGoogle, deleteGoogleCalendarEvent, batchSyncAppointments } from "./google-calendar/sync";

initializeApp();
