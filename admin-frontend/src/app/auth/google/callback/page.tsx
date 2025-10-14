'use client';

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');

            if (error) {
                console.error('Google OAuth error:', error);
                router.push('/ustawienia/integracje?error=true');
                return;
            }

            if (!code || !state) {
                router.push('/ustawienia/integracje?error=true');
                return;
            }

            try {
                // The callback is handled by the Cloud Function
                // We just need to redirect back to the integrations page
                router.push('/ustawienia/integracje?success=true');
            } catch (error) {
                console.error('Error handling Google callback:', error);
                router.push('/ustawienia/integracje?error=true');
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground">Obsługiwanie połączenia z Google Calendar...</p>
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="mt-4 text-muted-foreground">Ładowanie...</p>
                </div>
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    );
}