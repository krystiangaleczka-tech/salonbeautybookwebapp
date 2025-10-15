import { https } from "firebase-functions/v2";
import { CallableRequest } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { getFirestore } from "firebase-admin/firestore";
import { googleClientId, googleClientSecret, googleRedirectUri, getGoogleOAuthConfig } from "./config";

export const getGoogleAuthUrl = https.onCall(
    {
        secrets: [googleClientId, googleClientSecret, googleRedirectUri],
    },
    async (request: CallableRequest<Record<string, never>>) => {
        if (!request?.auth?.uid) {
            throw new https.HttpsError("unauthenticated", "User must be authenticated");
        }

        const config = getGoogleOAuthConfig();
        const oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            config.redirectUri
        );

        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: config.scopes,
            state: request.auth.uid,
            prompt: "consent",
        });

        return { url };
    }
);

export const handleGoogleCallback = https.onRequest(
    {
        cors: true,
        invoker: "public",
        secrets: [googleClientId, googleClientSecret, googleRedirectUri],
    },
    async (req, res) => {
        const { code, state, error } = req.query;
        
        if (error) {
            console.error("Google OAuth error:", error);
            res.redirect("https://salonbeautymario-x1.web.app/ustawienia/integracje?error=true");
            return;
        }
        
        if (!code || !state) {
            res.status(400).send("Missing required parameters");
            return;
        }

        try {
            const config = getGoogleOAuthConfig();
            const oauth2Client = new google.auth.OAuth2(
                config.clientId,
                config.clientSecret,
                config.redirectUri
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

            res.redirect("https://salonbeautymario-x1.web.app/ustawienia/integracje?success=true");
        } catch (error) {
            console.error("Error handling Google callback:", error);
            res.redirect("https://salonbeautymario-x1.web.app/ustawienia/integracje?error=true");
        }
    }
);

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

        const config = getGoogleOAuthConfig();
        const oauth2Client = new google.auth.OAuth2(
            config.clientId,
            config.clientSecret,
            config.redirectUri
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
