import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { settingsNavItems } from "@/lib/settings-data";

export default function SettingsOverviewPage() {
  const cards = settingsNavItems.filter((item) => item.key !== "overview");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="grid gap-4">
        {cards.map(({ key, label, description, href, icon: Icon }) => (
          <Link key={key} href={href} className="card group flex items-start justify-between gap-4 rounded-2xl border border-border bg-card/80 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{label}</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <ArrowUpRight className="mt-1 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>

      <aside className="space-y-4">
        <article className="card rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">Jak korzystać z ustawień</h2>
          <p className="mt-2">
            Zgrupowaliśmy konfigurację w dedykowanych kartach. Zacznij od profilu salonu, następnie przejdź do zespołu i harmonogramów.
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2">
            <li>Każda sekcja otwiera własną kartę roboczą z kontekstem biznesowym.</li>
            <li>Zakładki wspierają routing, więc możesz współdzielić linki w zespole.</li>
            <li>Udostępniaj linki do sekcji, aby szybko przechodzić do konkretnych obszarów konfiguracji.</li>
          </ul>
        </article>
        <article className="card rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-sm text-muted-foreground">
          <h2 className="text-base font-semibold text-primary">Strategia wdrożenia</h2>
          <p className="mt-2">
            Priorytetem są moduły wpływające na obsługę klienta: grafiki pracy, powiadomienia oraz jakość danych w profilu salonu.
          </p>
          <p className="mt-2">
            Integracje zostaną dodane po ustabilizowaniu procesów wewnętrznych (kalendarz, SMS).
          </p>
        </article>
      </aside>
    </div>
  );
}
