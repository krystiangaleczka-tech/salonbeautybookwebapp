import { Database, FileDown, ShieldCheck, ScrollText } from "lucide-react";

const exportHistory = [
  { date: "2024-05-10", type: "Eksport klientów", requestedBy: "Maja Flak", status: "Zakończony" },
  { date: "2024-06-12", type: "Eksport rezerwacji", requestedBy: "Ilona Flak", status: "W toku" },
];

const auditLog = [
  { timestamp: "2024-07-01 08:24", action: "Eksport rezerwacji", actor: "Agnieszka Nowicka" },
  { timestamp: "2024-07-02 14:12", action: "Zmiana uprawnień roli Manager", actor: "Maja Flak" },
  { timestamp: "2024-07-03 09:40", action: "Włączenie 2FA dla użytkownika Ilona", actor: "System" },
];

export default function PrivacyPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Prywatność i zgodność</h2>
            <p className="text-sm text-muted-foreground">
              Narzędzia wspierające RODO: eksport danych na żądanie klienta oraz rejestr czynności.
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Eksport danych</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Wybierz zakres (klienci, rezerwacje, zgody marketingowe). Eksport generuje paczkę ZIP z plikami CSV i logiem operacji.
            </p>
            <button className="btn-primary mt-4 inline-flex items-center justify-center">
              <FileDown className="mr-2 h-4 w-4" />
              Nowy eksport
            </button>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Retencja danych</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Zdefiniuj politykę przechowywania danych (np. 36 miesięcy). System przypomni o konieczności anonimizacji.
            </p>
            <div className="mt-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-xs text-muted-foreground">
              W planie: automatyczne usuwanie rekordów po upływie retencji oraz raport zgodności.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Database className="h-4 w-4" />
              Historia eksportów
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              {exportHistory.map(({ date, type, requestedBy, status }) => (
                <li key={`${date}-${type}`} className="rounded-xl border border-border bg-card/80 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                    <span>{date}</span>
                    <span className="font-semibold text-primary">{status}</span>
                  </div>
                  <p className="mt-1 font-medium text-foreground">{type}</p>
                  <p className="text-xs text-muted-foreground">Zlecone przez: {requestedBy}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ScrollText className="h-4 w-4" />
              Rejestr czynności
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              {auditLog.map(({ timestamp, action, actor }) => (
                <li key={`${timestamp}-${action}`} className="rounded-xl border border-border bg-card/80 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{timestamp}</div>
                  <p className="mt-1 font-medium text-foreground">{action}</p>
                  <p className="text-xs text-muted-foreground">Operator: {actor}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm text-sm text-muted-foreground">
          <h3 className="text-base font-semibold text-foreground">Checklist RODO</h3>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Zbieraj świadome zgody marketingowe i przechowuj dowody.</li>
            <li>Zautomatyzuj odpowiedź na żądania usunięcia danych.</li>
            <li>Loguj każdą zmianę ustawień bezpieczeństwa i eksport danych.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
