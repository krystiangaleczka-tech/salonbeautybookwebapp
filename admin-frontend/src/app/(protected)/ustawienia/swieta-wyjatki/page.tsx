import { CalendarX2, Plane, Snowflake, Sparkles } from "lucide-react";

const holidayCalendar = [
  { date: "2024-12-24", label: "Wigilia", type: "Święto" },
  { date: "2024-12-31", label: "Sylwester (skrócony dzień)", type: "Wyjątek" },
  { date: "2025-01-06", label: "Trzech Króli", type: "Święto" },
];

const timeOffGuidelines = [
  "Urlopy globalne mają wyższy priorytet niż szablony grafiku.",
  "Blokady z kalendarza synchronizują się automatycznie.",
  "Pracownik może poprosić o urlop – manager zatwierdza w tej zakładce.",
];

export default function HolidaysAndExceptionsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarX2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Święta i wyjątki</h2>
            <p className="text-sm text-muted-foreground">
              Zarządzaj dniami wolnymi całego salonu. Wyjątki zostaną oznaczone w kalendarzu oraz w edytorze grafiku.
            </p>
          </div>
        </header>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Nazwa</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {holidayCalendar.map(({ date, label, type }) => (
                <tr key={`${date}-${label}`} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">{date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{label}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{type}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-primary hover:underline">Edytuj</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-sm text-muted-foreground">
          <p>
            Planowane rozszerzenie: import kalendarza świąt państwowych, generowanie raportów urlopowych i powiadomienia do klientów o zmianach godzin otwarcia.
          </p>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Polityka urlopowa</h3>
              <p className="text-sm text-muted-foreground">
                Zdefiniuj zasady dotyczące urlopów zespołowych oraz wyjątków dla poszczególnych osób.
              </p>
            </div>
          </header>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {timeOffGuidelines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Snowflake className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Sezonowe harmonogramy</h3>
              <p className="text-sm text-muted-foreground">
                Przykładowo: ferie zimowe, okres ślubny czy Black Friday. Możesz aktywować je jednorazowo lub cyklicznie.
              </p>
            </div>
          </header>
          <p className="mt-4 text-sm text-muted-foreground">
            Wersja PRD zakłada integrację z modułem grafików, aby przełączanie między sezonami było bezbolesne. Klienci dostaną powiadomienie o zmianie dostępności.
          </p>
        </div>
        <div className="card rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            <p>
              Dodaj wydarzenia specjalne (np. Noc SPA) i powiąż je z dedykowanym cennikiem oraz kampanią powiadomień.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
