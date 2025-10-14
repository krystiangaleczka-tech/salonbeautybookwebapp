export const GOOGLE_OAUTH_CONFIG = {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "https://salonbeautymario-x1.web.app/auth/google/callback",
    scopes: ["https://www.googleapis.com/auth/calendar"],
};
