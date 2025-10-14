'use client';

import { useState, useEffect } from "react";
import { Calendar, Link2, MessageCircle, PlugZap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { googleCalendarService, type GoogleCalendarStatus } from "@/lib/google-calendar-service";
import { useSearchParams } from "next/navigation";

const plannedIntegrations = [
    {
        name: "Bramka SMS",
        description: "Integracja z dostawcą wysyłki SMS (np. SMSAPI, Twilio).",
        benefits: ["Kody alfanumeryczne", "Monitorowanie dostarczalności", "Fallback na e-mail"],
    },
];

export default function IntegrationsPage() {
    const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check for OAuth callback results
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        
        if (success === 'true') {
            // Show success message
            console.log('Google Calendar connected successfully');
        } else if (error === 'true') {
            // Show error message
            console.error('Failed to connect Google Calendar');
        }
        
        // Check connection status
        checkGoogleCalendarStatus();
    }, [searchParams]);

    const checkGoogleCalendarStatus = async () => {
        setIsLoading(true);
        try {
            const status = await googleCalendarService.getConnectionStatus();
            setGoogleStatus(status);
        } catch (error) {
            console.error('Error checking Google Calendar status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectGoogleCalendar = async () => {
        setIsConnecting(true);
        try {
            const url = await googleCalendarService.getAuthUrl();
            window.location.href = url;
        } catch (error) {
            console.error('Error connecting to Google Calendar:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnectGoogleCalendar = async () => {
        try {
            await googleCalendarService.disconnect();
            setGoogleStatus(null);
        } catch (error) {
            console.error('Error disconnecting Google Calendar:', error);
        }
    };

    const handleSyncNow = async () => {
        setIsSyncing(true);
        setSyncMessage(null);
        setSyncError(null);
        
        try {
            // Tutaj można zaimplementować synchronizację wszystkich wizyt
            // Na razie tylko symulacja
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSyncMessage('Synchronizacja zakończona pomyślnie!');
            
            // Odśwież status połączenia
            await checkGoogleCalendarStatus();
        } catch (error) {
            console.error('Błąd synchronizacji:', error);
            setSyncError('Nie udało się zsynchronizować kalendarza. Spróbuj ponownie.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleBatchSync = async () => {
        setIsSyncing(true);
        setSyncMessage('Rozpoczynanie synchronizacji masowej...');
        setSyncError(null);
        
        try {
            // Przykład synchronizacji wszystkich przyszłych wizyt
            const response = await fetch('/api/sync/google-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ syncAll: true }),
            });
            
            if (!response.ok) {
                throw new Error('Błąd synchronizacji masowej');
            }
            
            const result = await response.json();
            setSyncMessage(`Zsynchronizowano ${result.syncedCount} wizyt. ${result.errorCount} błędów.`);
            
            // Odśwież status połączenia
            await checkGoogleCalendarStatus();
        } catch (error) {
            console.error('Błąd synchronizacji masowej:', error);
            setSyncError('Nie udało się przeprowadzić synchronizacji masowej. Spróbuj ponownie.');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <section className="card rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 shadow-sm">
                <header className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <PlugZap className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-primary">Integracje</h2>
                        <p className="text-sm text-muted-foreground">
                            Łączymy panel z popularnymi narzędziami, aby usprawnić przepływ informacji między kalendarzami i kanałami powiadomień.
                        </p>
                    </div>
                </header>

                {/* Google Calendar Integration */}
                <div className="mt-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Google Calendar</h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : googleStatus?.isConnected ? (
                        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                            <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Połączono z Google Calendar</span>
                            </div>
                            <p className="mt-2 text-sm text-green-600">
                                Ostatnia synchronizacja: {googleStatus.lastSync?.toLocaleString('pl-PL')}
                            </p>
                            {/* Wiadomości o synchronizacji */}
                            {syncMessage && (
                                <div className="mt-3 p-3 rounded-lg bg-green-100 text-green-800 text-sm">
                                    {syncMessage}
                                </div>
                            )}
                            {syncError && (
                                <div className="mt-3 p-3 rounded-lg bg-red-100 text-red-800 text-sm">
                                    {syncError}
                                </div>
                            )}
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={handleSyncNow}
                                    disabled={isSyncing}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSyncing ? (
                                        <>
                                            <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                                            Synchronizacja...
                                        </>
                                    ) : (
                                        'Synchronizuj teraz'
                                    )}
                                </button>
                                <button
                                    onClick={handleBatchSync}
                                    disabled={isSyncing}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSyncing ? (
                                        <>
                                            <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                                            Synchronizacja masowa...
                                        </>
                                    ) : (
                                        'Synchronizuj wszystkie'
                                    )}
                                </button>
                                <button
                                    onClick={handleDisconnectGoogleCalendar}
                                    disabled={isSyncing}
                                    className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    Rozłącz
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-5 w-5" />
                                <span>Nie połączono z Google Calendar</span>
                            </div>
                            <button
                                onClick={handleConnectGoogleCalendar}
                                disabled={isConnecting}
                                className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Łączenie...
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="h-4 w-4" />
                                        Połącz z Google Calendar
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    
                    <div className="mt-4 rounded-2xl border border-border bg-card/80 p-4 text-sm text-muted-foreground">
                        <h4 className="font-semibold text-foreground mb-2">Korzyści integracji:</h4>
                        <ul className="list-inside list-disc space-y-1">
                            <li>Automatyczna synchronizacja wizyt w obie strony</li>
                            <li>Dostęp do kalendarza z urządzeń mobilnych</li>
                            <li>Możliwość udostępniania kalendarza klientom</li>
                            <li>Powiadomienia o nowych wizytach</li>
                            <li>Wsparcie dla wielu kalendarzy</li>
                            <li>Synchronizacja masowa istniejących wizyt</li>
                        </ul>
                    </div>
                    
                    <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Informacje o synchronizacji
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Nowe wizyty są automatycznie synchronizowane z Google Calendar</li>
                            <li>• Edycje i usunięcia wizyt są odzwierciedlone w obu systemach</li>
                            <li>• Wizyty zsynchronizowane oznaczone są niebieską kropką w kalendarzu</li>
                            <li>• Możesz przeprowadzić synchronizację masową wszystkich istniejących wizyt</li>
                        </ul>
                    </div>
                </div>

                {/* Other Planned Integrations */}
                <div className="mt-8">
                    <h3 className="text-base font-semibold text-foreground mb-4">Integracje w przygotowaniu</h3>
                    <div className="grid gap-4 md:grid-cols-1">
                        {plannedIntegrations.map(({ name, description, benefits }) => (
                            <div key={name} className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                                <h4 className="text-sm font-semibold text-foreground">{name}</h4>
                                <p className="mt-1">{description}</p>
                                <ul className="mt-3 list-inside list-disc space-y-1">
                                    {benefits.map((benefit) => (
                                        <li key={benefit}>{benefit}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-card/80 p-4 text-sm text-muted-foreground">
                    <p>
                        Integracje zostaną uruchomione po zatwierdzeniu polityki bezpieczeństwa i zapewnieniu zgodności z RODO. Zespół produktowy przygotowuje scenariusze awaryjne oraz monitoring stabilności.
                    </p>
                </div>
            </section>

            <aside className="space-y-6">
                <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm text-sm text-muted-foreground">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <Link2 className="h-5 w-5 text-primary" />
                        Plan działania
                    </h3>
                    <ol className="mt-3 list-inside list-decimal space-y-2">
                        <li>Specyfikacja API oraz zakres danych wymienianych z partnerem.</li>
                        <li>Mechanizm autoryzacji (OAuth) i odświeżania tokenów.</li>
                        <li>Monitorowanie błędów i kolejkowanie wiadomości w razie awarii.</li>
                    </ol>
                </div>
                <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm text-sm text-muted-foreground">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <Calendar className="h-5 w-5 text-primary" />
                        Synchronizacja kalendarza
                    </h3>
                    <p className="mt-2">
                        Klienci zobaczą dostępne sloty w czasie rzeczywistym. System rozwiąże konflikty oraz pokaże status synchronizacji przy każdej wizycie.
                    </p>
                </div>
                <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm text-sm text-muted-foreground">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Integracja SMS
                    </h3>
                    <p className="mt-2">
                        W planie fallback na e-mail, obsługa unicode i dynamiczne podpisy. Moduł powiadomień będzie korzystał ze wspólnego repozytorium wiadomości.
                    </p>
                </div>
            </aside>
        </div>
    );
}
