import { Bell, MessageSquare, SmartphoneNfc, Timer } from "lucide-react";

const notificationChannels = [
  {
    name: "Potwierdzenie rezerwacji",
    description: "Natychmiastowe powiadomienie SMS/email po zapisaniu wizyty.",
    enabled: true,
    timings: ["24h przed", "2h przed"],
  },
  {
    name: "Przypomnienie o wizycie",
    description: "Dodatkowe przypomnienie dla klientów z ryzykiem no-show.",
    enabled: true,
    timings: ["24h przed", "2h przed"],
  },
  {
    name: "Podziękowanie po wizycie",
    description: "Wyślij link do opinii i kod rabatowy.",
    enabled: false,
    timings: ["30 min po"],
  },
];

const smsTemplate = `Cześć {{client.name}}! Przypominamy o wizycie {{appointment.date}} o {{appointment.time}} w salonie {{company.name}}. Do zobaczenia!`;

export default function NotificationsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Powiadomienia</h2>
            <p className="text-sm text-muted-foreground">
              Zadbaj o komunikację z klientem: wybierz kanał, timing wiadomości i dopasuj treść do tonu salonu.
            </p>
          </div>
        </header>

        <div className="mt-6 space-y-4">
          {notificationChannels.map(({ name, description, enabled, timings }) => (
            <div key={name} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {timings.map((timing) => (
                      <span key={timing} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        <Timer className="h-3.5 w-3.5" />
                        {timing}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={`inline-flex h-9 w-16 items-center rounded-full border px-1 ${
                    enabled ? "border-primary bg-primary" : "border-border bg-muted"
                  } transition-colors`}
                  aria-pressed={enabled}
                >
                  <span
                    className={`h-7 w-7 rounded-full bg-background shadow-sm transition-transform ${
                      enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Szablon SMS</h3>
              <p className="text-sm text-muted-foreground">
                Edytor z podpowiedziami zmiennych systemowych. Wersja PRD przewiduje podgląd w czasie rzeczywistym.
              </p>
            </div>
          </header>
          <textarea
            className="mt-4 h-40 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
            defaultValue={smsTemplate}
          />
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {['{{client.name}}', '{{appointment.date}}', '{{appointment.time}}', '{{company.name}}'].map((token) => (
              <span key={token} className="rounded-full bg-muted px-2 py-1 font-semibold">
                {token}
              </span>
            ))}
          </div>
        </div>
        <div className="card rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <SmartphoneNfc className="h-5 w-5 text-primary" />
            <p>
              W planie: moduł kampanii marketingowych (serie wiadomości, segmentacja klientów) oraz A/B testy treści.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
