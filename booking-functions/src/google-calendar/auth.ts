import { https } from "firebase-functions/v2";
import { CallableRequest } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { getFirestore } from "firebase-admin/firestore";
import { GOOGLE_OAUTH_CONFIG } from "./config";

export const getGoogleAuthUrl = https.onCall(async (request: CallableRequest<Record<string, never>>) => {
    if (!request?.auth?.uid) {
        throw new https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_OAUTH_CONFIG.clientId,
        GOOGLE_OAUTH_CONFIG.clientSecret,
        GOOGLE_OAUTH_CONFIG.redirectUri
    );

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: GOOGLE_OAUTH_CONFIG.scopes,
        state: request.auth.uid,
        prompt: "consent",
    });

    return { url };
});

export const handleGoogleCallback = https.onRequest(async (req, res) => {
    const { code, state, error } = req.query;
    
    if (error) {
        console.error("Google OAuth error:", error);
        const baseUrl = GOOGLE_OAUTH_CONFIG.redirectUri.split("/auth/google/callback")[0];
        res.redirect(`${baseUrl}/ustawienia/integracje?error=true`);
        return;
    }
    
    if (!code || !state) {
        res.status(400).send("Missing required parameters");
        return;
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_OAUTH_CONFIG.clientId,
            GOOGLE_OAUTH_CONFIG.clientSecret,
            GOOGLE_OAUTH_CONFIG.redirectUri,
        );

        const { tokens } = await oauth2Client.getToken(code as string);
        
        const db = getFirestore();
        await db.collection("googleTokens").doc(state as string).set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiryDate: new Date(tokens.expiry_date || 0),
            calendarId: "primary",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const baseUrl = GOOGLE_OAUTH_CONFIG.redirectUri.split("/auth/google/callback")[0];
        res.redirect(`${baseUrl}/ustawienia/integracje?success=true`);
    } catch (error) {
        console.error("Error handling Google callback:", error);
        const baseUrl = GOOGLE_OAUTH_CONFIG.redirectUri.split("/auth/google/callback")[0];
        res.redirect(`${baseUrl}/ustawienia/integracje?error=true`);
    }
});

export const refreshAccessToken = async (userId: string): Promise<boolean> => {
    try {
        const db = getFirestore();
        const tokenDoc = await db.collection("googleTokens").doc(userId).get();
        
        if (!tokenDoc.exists) {
            return false;
        }
        
        const tokens = tokenDoc.data();
        if (!tokens?.refreshToken) {
            return false;
        }

        const oauth2Client = new google.auth.OAuth2(
            GOOGLE_OAUTH_CONFIG.clientId,
            GOOGLE_OAUTH_CONFIG.clientSecret,
            GOOGLE_OAUTH_CONFIG.redirectUri
        );

        oauth2Client.setCredentials({
            refresh_token: tokens.refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        
        await db.collection("googleTokens").doc(userId).update({
            accessToken: credentials.access_token,
            expiryDate: new Date(credentials.expiry_date || 0),
            updatedAt: new Date(),
        });

        return true;
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return false;
    }
};


export const getGoogleAuthClient = async (userId: string) => {
    const db = getFirestore();
    const tokenDoc = await db.collection("googleTokens").doc(userId).get();
    
    if (!tokenDoc.exists) {
        throw new Error("Google Calendar not connected for this user");
    }

    const tokens = tokenDoc.data();
    if (!tokens) {
        throw new Error("No token data found");
    }
    
    // Check if token is expired
    if (new Date() > tokens.expiryDate.toDate()) {
        const refreshed = await refreshAccessToken(userId);
        if (!refreshed) {
            throw new Error("Failed to refresh access token");
        }
        
        // Get updated tokens
        const updatedTokenDoc = await db.collection("googleTokens").doc(userId).get();
        const updatedTokens = updatedTokenDoc.data();
        if (!updatedTokens) {
            throw new Error("Failed to retrieve updated tokens");
        }
        return updatedTokens;
    }

    return tokens;
};
