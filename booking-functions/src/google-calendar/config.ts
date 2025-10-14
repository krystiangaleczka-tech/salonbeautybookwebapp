import { defineSecret } from "firebase-functions/params";

// Define secrets for production
export const googleClientId = defineSecret("GOOGLE_CLIENT_ID");
export const googleClientSecret = defineSecret("GOOGLE_CLIENT_SECRET");
export const googleRedirectUri = defineSecret("GOOGLE_REDIRECT_URI");

export const getGoogleOAuthConfig = () => ({
    clientId: googleClientId.value(),
    clientSecret: googleClientSecret.value(),
    redirectUri: googleRedirectUri.value(),
    scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
    ],
});
