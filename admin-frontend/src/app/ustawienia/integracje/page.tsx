import { Calendar, Link2, MessageCircle, PlugZap } from "lucide-react";

const plannedIntegrations = [
  {
    name: "Google Calendar",
    description: "Dwustronna synchronizacja wizyt z kalendarzem Google.",
    benefits: ["Automatyczne aktualizacje", "Zaproszenia dla klientów", "Obsługa wielu kalendarzy"],
  },
  {
    name: "Bramka SMS",
    description: "Integracja z dostawcą wysyłki SMS (np. SMSAPI, Twilio).",
    benefits: ["Kody alfanumeryczne", "Monitorowanie dostarczalności", "Fallback na e-mail"],
  },
];

export default function IntegrationsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="card rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 shadow-sm">
        <header className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PlugZap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary">Integracje w przygotowaniu</h2>
            <p className="text-sm text-muted-foreground">
              Łączymy panel z popularnymi narzędziami, aby usprawnić przepływ informacji między kalendarzami i kanałami powiadomień.
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {plannedIntegrations.map(({ name, description, benefits }) => (
            <div key={name} className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
              <h3 className="text-sm font-semibold text-foreground">{name}</h3>
              <p className="mt-1">{description}</p>
              <ul className="mt-3 list-inside list-disc space-y-1">
                {benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>
          ))}
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
