import { BadgeCheck, LockKeyhole, ShieldHalf, UserPlus, Users2 } from "lucide-react";

const teamMembers = [
  {
    name: "Maja Flak",
    role: "Właścicielka",
    email: "maja@salonmaja.pl",
    status: "Aktywna",
    twoFactor: "Włączone",
  },
  {
    name: "Ilona Flak",
    role: "Manager",
    email: "ilona@salonmaja.pl",
    status: "Aktywna",
    twoFactor: "Zaproszenie wysłane",
  },
  {
    name: "Agnieszka Nowicka",
    role: "Stylistka",
    email: "agnieszka@salonmaja.pl",
    status: "W trakcie wdrożenia",
    twoFactor: "Opcjonalne",
  },
];

const roleTemplates = [
  {
    name: "Właściciel",
    permissions: ["Fakturowanie", "Ustawienia globalne", "Raporty finansowe"],
  },
  {
    name: "Manager",
    permissions: ["Grafiki", "Zespół", "Powiadomienia"],
  },
  {
    name: "Recepcja",
    permissions: ["Kalendarz", "Klienci", "Szybkie blokady"],
  },
];

export default function TeamAndRolesPage() {
  return (
    <div className="space-y-6">
      <section className="card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Zespół i role</h2>
              <p className="text-sm text-muted-foreground">
                Dodawaj członków zespołu, przypisuj zakres odpowiedzialności oraz włączaj uwierzytelnianie wieloskładnikowe dla wrażliwych ról.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
              <ShieldHalf className="mr-2 h-4 w-4" />
              Konfiguruj role
            </button>
            <button className="btn-primary">
              <UserPlus className="mr-2 h-4 w-4" />
              Zaproś pracownika
            </button>
          </div>
        </header>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Imię i nazwisko</th>
                <th className="px-4 py-3">Rola</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">2FA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {teamMembers.map(({ name, role, email, status, twoFactor }) => (
                <tr key={email} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">{name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{twoFactor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <h3 className="text-base font-semibold text-foreground">Szablony ról</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Szablony definiują zestaw uprawnień, które możesz przypisać osobom w zespole. W kolejnych iteracjach dodamy szczegółową matrycę praw dostępu.
          </p>
          <div className="mt-4 space-y-4">
            {roleTemplates.map(({ name, permissions }) => (
              <div key={name} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{name}</h4>
                  <button className="text-xs font-semibold text-primary hover:underline">Edytuj</button>
                </div>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  {permissions.map((permission) => (
                    <li key={permission}>{permission}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
          <h4 className="text-sm font-semibold text-primary">Bezpieczeństwo kont</h4>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              Właściciele i administratorzy będą mieli obowiązkowe logowanie z 2FA – w planie SMS lub aplikacja OTP.
            </li>
            <li>
              Role operacyjne (recepcja) mogą mieć ograniczony dostęp do eksportów i edycji danych finansowych.
            </li>
            <li>
              Wskaźnik wdrożenia pokaże ilu członków zespołu ma aktywne MFA.
            </li>
          </ul>
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <LockKeyhole className="h-4 w-4" />
            Zobacz politykę bezpieczeństwa
          </button>
        </div>
      </section>
    </div>
  );
}
