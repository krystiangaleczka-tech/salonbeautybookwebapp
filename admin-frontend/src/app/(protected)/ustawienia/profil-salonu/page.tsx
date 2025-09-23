import { MapPin, Phone, UploadCloud, Globe2 } from "lucide-react";

const countries = [
  { code: "PL", label: "Polska" },
  { code: "DE", label: "Niemcy" },
  { code: "CZ", label: "Czechy" },
];

const timezones = [
  "Europe/Warsaw",
  "Europe/Berlin",
  "Europe/Prague",
];

export default function SalonProfilePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Branding i logo</h2>
              <p className="text-sm text-muted-foreground">Dodaj logotyp, aby personalizować powiadomienia oraz panel klienta.</p>
            </div>
          </header>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
              Logo 512×512
            </div>
            <div className="flex-1 space-y-3 text-sm text-muted-foreground">
              <p>
                Obsługujemy pliki PNG oraz SVG. Idealne proporcje to kwadrat 512×512 px. Logo będzie widoczne w wiadomościach e-mail, kalendarzu i na paragonach.
              </p>
              <button className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
                <UploadCloud className="mr-2 h-4 w-4" />
                Prześlij logo
              </button>
            </div>
          </div>
        </section>

        <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Lokalizacja i kontakt</h2>
              <p className="text-sm text-muted-foreground">Te dane pojawią się w potwierdzeniach SMS i e-mail, więc zadbaj o ich aktualność.</p>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Nazwa salonu
              <input
                type="text"
                placeholder="Salon Piękności Maja"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Numer NIP
              <input
                type="text"
                placeholder="123-456-78-90"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Ulica i numer
              <input
                type="text"
                placeholder="ul. Kwiatowa 21"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Miasto
              <input
                type="text"
                placeholder="Kraków"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Kod pocztowy
              <input
                type="text"
                placeholder="31-002"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Kraj
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring">
                {countries.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Telefon kontaktowy
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="+48 600 000 000"
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              Strona WWW
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
                <Globe2 className="h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  placeholder="https://salonmaja.pl"
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>
            </label>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
          <h3 className="text-base font-semibold text-primary">Wskazówki</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Dane adresowe są wykorzystywane do generowania faktur i potwierdzeń rezerwacji.</li>
            <li>Wizytówka online pobiera nazwę i logo, aby zapewnić spójne doświadczenie klienta.</li>
            <li>Aktualizacje są wersjonowane – w przyszłości pokażemy historię zmian.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
