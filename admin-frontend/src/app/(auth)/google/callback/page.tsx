'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Calendar } from 'lucide-react';

export default function GoogleCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Łączenie z Google Calendar...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams?.get('code');
            const state = searchParams?.get('state');
            const errorParam = searchParams?.get('error');

            if (errorParam) {
                setStatus('error');
                setError(errorParam === 'access_denied' 
                    ? 'Odmówiono dostępu do Google Calendar. Możesz spróbować ponownie później.' 
                    : `Wystąpił błąd: ${errorParam}`);
                return;
            }

            if (!code || !state) {
                setStatus('error');
                setError('Brak wymaganych parametrów w adresie URL. Spróbuj ponownie.');
                return;
            }

            try {
                // Wywołaj Cloud Function do obsługi callbacku OAuth
                const response = await fetch('/api/auth/google/callback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code, state }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Wystąpił błąd podczas łączenia z Google Calendar');
                }

                const data = await response.json();
                
                if (data.success) {
                    setStatus('success');
                    setMessage('Pomyślnie połączono z Google Calendar! Teraz możesz synchronizować swoje wizyty.');
                    
                    // Przekieruj do ustawień integracji po 3 sekundach
                    setTimeout(() => {
                        router.push('/ustawienia/integracje');
                    }, 3000);
                } else {
                    throw new Error(data.error || 'Nie udało się połączyć z Google Calendar');
                }
            } catch (err) {
                console.error('Błąd podczas obsługi callbacku Google:', err);
                setStatus('error');
                setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
            }
        };

        handleCallback();
    }, [searchParams, router]);

    const handleRetry = () => {
        router.push('/ustawienia/integracje');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center">
                    {/* Ikona statusu */}
                    <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center rounded-full bg-rose-100">
                        {status === 'loading' && <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />}
                        {status === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
                        {status === 'error' && <XCircle className="w-8 h-8 text-red-600" />}
                    </div>

                    {/* Tytuł */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {status === 'loading' && 'Łączenie z Google Calendar'}
                        {status === 'success' && 'Połączono z Google Calendar!'}
                        {status === 'error' && 'Błąd połączenia'}
                    </h1>

                    {/* Wiadomość */}
                    <p className="text-gray-600 mb-8">
                        {message}
                        {status === 'error' && error && (
                            <span className="block mt-2 text-sm text-red-600">
                                {error}
                            </span>
                        )}
                    </p>

                    {/* Przyciski akcji */}
                    <div className="space-y-3">
                        {status === 'loading' && (
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Przetwarzanie...</span>
                            </div>
                        )}
                        
                        {status === 'success' && (
                            <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                                <Calendar className="w-4 h-4" />
                                <span>Przekierowanie do ustawień...</span>
                            </div>
                        )}
                        
                        {status === 'error' && (
                            <button
                                onClick={handleRetry}
                                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                            >
                                Wróć do ustawień
                            </button>
                        )}
                    </div>

                    {/* Dodatkowe informacje */}
                    {status === 'success' && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800">
                                <strong>Co dalej?</strong><br />
                                Twoje wizyty będą teraz automatycznie synchronizowane z Google Calendar. 
                                Możesz zarządzać synchronizacją w ustawieniach integracji.
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mt-6 p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-800">
                                <strong>Co mogło pójść nie tak?</strong><br />
                                • Odmówiono dostępu do kalendarza<br />
                                • Problem z połączeniem internetowym<br />
                                • Błąd konfiguracji Google Calendar API
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}