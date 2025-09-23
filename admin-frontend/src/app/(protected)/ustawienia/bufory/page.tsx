import { Hourglass, ListChecks, SlidersHorizontal } from "lucide-react";

const bufferRules = [
  {
    service: "Manicure hybrydowy",
    before: "10 min",
    after: "5 min",
    override: "Tak",
  },
  {
    service: "Zabieg nawilżający",
    before: "15 min",
    after: "10 min",
    override: "Nie",
  },
  {
    service: "Konsultacja premium",
    before: "20 min",
    after: "15 min",
    override: "Tak",
  },
];

export default function BuffersPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Hourglass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Bufory czasowe</h2>
            <p className="text-sm text-muted-foreground">
              Ustal domyślne przerwy przed i po każdej usłudze, by uniknąć spiętrzeń w grafiku i przygotować stanowisko.
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Domyślne bufory salonu</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Zastosuj globalny bufor dla wszystkich usług. Może zostać nadpisany na poziomie pojedynczego zabiegu.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-2 font-medium text-foreground">
                Przed usługą
                <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring">
                  <option>5 min</option>
                  <option>10 min</option>
                  <option>15 min</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 font-medium text-foreground">
                Po usłudze
                <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring">
                  <option>5 min</option>
                  <option>10 min</option>
                  <option>15 min</option>
                </select>
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Strategia</h3>
            <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Bufor przed wizytą daje czas na przygotowanie stanowiska i dezynfekcję.</li>
              <li>Bufor po wizycie jest potrzebny do płatności i porządkowania.</li>
              <li>Wyjątki per usługa: np. zabiegi SPA mogą mieć wydłużone przygotowanie.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Usługa</th>
                <th className="px-4 py-3">Bufor przed</th>
                <th className="px-4 py-3">Bufor po</th>
                <th className="px-4 py-3">Nadpisanie</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {bufferRules.map(({ service, before, after, override }) => (
                <tr key={service} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">{service}</td>
                  <td className="px-4 py-3 text-muted-foreground">{before}</td>
                  <td className="px-4 py-3 text-muted-foreground">{after}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{override}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-primary hover:underline">Edytuj</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Priorytety</h3>
              <p className="text-sm text-muted-foreground">
                Ustal kolejność stosowania buforów: globalny → pracownik → usługa.
              </p>
            </div>
          </header>
          <p className="mt-4 text-sm text-muted-foreground">
            Wersja PRD zakłada wizualizację na osi czasu oraz symulację wpływu na dostępne sloty w kalendarzu.
          </p>
        </div>
        <div className="card rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <p>
              Dodajemy też reguły inteligentne: automatyczne wydłużanie bufora po zabiegach łączonych lub w okresach największego obłożenia.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
