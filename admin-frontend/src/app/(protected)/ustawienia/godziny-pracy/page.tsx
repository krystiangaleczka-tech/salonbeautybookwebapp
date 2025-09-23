import { CalendarClock, Copy, LayoutGrid, Sun, Moon } from "lucide-react";

const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

const templates = [
  {
    name: "Poranny",
    description: "Pon-Pt • 08:00–16:00",
    tags: ["Recepcja", "Stylizacja paznokci"],
  },
  {
    name: "Weekend",
    description: "Sob-Nd • 10:00–18:00",
    tags: ["Makijaż", "Kosmetologia"],
  },
  {
    name: "Popołudniowy",
    description: "Pon-Śr • 12:00–20:00",
    tags: ["Fryzjerstwo"],
  },
];

const exampleSchedule = weekDays.map((day) => ({
  day,
  slots: [
    { label: "08:00", active: day !== "Nd" },
    { label: "12:00", active: day !== "Nd" },
    { label: "16:00", active: day !== "Nd" && day !== "Sob" },
    { label: "20:00", active: day === "Pt" || day === "Sob" },
  ],
}));

export default function WorkingHoursPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <section className="space-y-6">
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarClock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Grafik bazowy</h2>
                <p className="text-sm text-muted-foreground">
                  Zdefiniuj domyślne godziny otwarcia salonu i przypisz je do członków zespołu. Edycja w formie matrycy 7×24 pozwoli na szybkie oznaczanie bloków godzinowych.
                </p>
              </div>
            </div>
            <button className="btn-primary inline-flex items-center justify-center">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Otwórz edytor godzin
            </button>
          </header>

          <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
              <span>Dzień tygodnia</span>
              <span>Aktywne bloki (przykład)</span>
            </div>
            <div className="mt-4 space-y-3">
              {exampleSchedule.map(({ day, slots }) => (
                <div key={day} className="grid grid-cols-[72px_1fr] gap-4 text-sm">
                  <span className="rounded-lg bg-muted px-3 py-2 text-center font-semibold text-foreground">{day}</span>
                  <div className="flex flex-wrap gap-2">
                    {slots.map(({ label, active }) => (
                      <span
                        key={`${day}-${label}`}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground line-through"
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Docelowo w tym miejscu pojawi się interaktywny edytor matrycy z możliwością rysowania przedziałów i duplikacji na kolejne dni.
            </p>
          </div>
        </div>

        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Plan urlopów i blokad</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Wyklucz dni z grafiku salonu lub wprowadź urlop całego zespołu. Blokady z poziomu kalendarza będą synchronizowane z tym modułem.
          </p>
          <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
            <p>
              Integracja z kalendarzem umożliwi szybkie zaznaczanie blokad (np. szkolenia) oraz wyjątków dla poszczególnych osób.
            </p>
            <p className="mt-2">
              W kolejnych iteracjach dodamy widok osi czasu i import eksport do CSV.
            </p>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sun className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Szablony grafiku</h3>
              <p className="text-sm text-muted-foreground">
                Twórz powtarzalne schematy i przypisuj je do członków zespołu lub konkretnych usług.
              </p>
            </div>
          </header>
          <div className="mt-4 space-y-3">
            {templates.map(({ name, description, tags }) => (
              <div key={name} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{name}</h4>
                  <button className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                    <Copy className="h-3.5 w-3.5" />
                    Klonuj
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={`${name}-${tag}`} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
            <p>
              Wersja MVP pozwoli przypisać szablon domyślny per osoba oraz ustawić wyjątkowe dni w kalendarzu.
            </p>
          </div>
        </div>
        <div className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Moon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Tryby pracy</h3>
              <p className="text-sm text-muted-foreground">
                Zdefiniuj odrębne harmonogramy dla świąt, sezonów lub wydarzeń specjalnych.
              </p>
            </div>
          </header>
          <p className="mt-4 text-sm text-muted-foreground">
            Każdy tryb będzie mógł dziedziczyć bazową konfigurację i nadpisywać jedynie wybrane dni. Dzięki temu przełączanie między sezonem letnim i zimowym będzie kwestią jednego kliknięcia.
          </p>
        </div>
      </aside>
    </div>
  );
}
