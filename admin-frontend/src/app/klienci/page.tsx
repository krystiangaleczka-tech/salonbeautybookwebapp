import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { clients } from "@/lib/dashboard-data";
import { Filter, MessageSquare, Pencil, Search, Trash2, UserPlus } from "lucide-react";

const tableHeaders = ["", "Imię i nazwisko", "Telefon", ""];

export default function ClientsPage() {
  return (
    <DashboardLayout
      active="clients"
      header={{
        title: "Klienci",
        subtitle: "Zarządzaj bazą kontaktów i działaniami follow-up",
        actions: undefined,
      }}
    >
      <section className="space-y-6">
        <div className="card border border-border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Szukaj klienta po imieniu, nazwisku lub numerze telefonu..."
                className="w-full rounded-lg border border-border bg-card px-10 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
              <Filter className="mr-2 h-4 w-4" />
              Filtry
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <button className="inline-flex items-center justify-center rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-destructive hover:text-destructive-foreground">
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń klienta
          </button>
          <button className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj klienta
          </button>
          <button className="btn-primary">
            <UserPlus className="mr-2 h-4 w-4" />
            Dodaj klienta
          </button>
        </div>

        <div className="card border border-border">
          <div className="grid grid-cols-[48px_1fr_200px_72px] items-center gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tableHeaders.map((header, index) => (
              <span key={`${header}-${index}`}>{header}</span>
            ))}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {clients.map(({ id, fullName, phone }) => (
              <div
                key={id}
                className="grid grid-cols-[48px_1fr_200px_72px] items-center gap-4 border-b border-border px-6 py-4 last:border-b-0 hover:bg-muted/60"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  aria-label={`Zaznacz klienta ${fullName}`}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{fullName}</span>
                  <span className="text-xs text-muted-foreground">Aktywny klient</span>
                </div>
                <span className="text-sm font-medium text-foreground">{phone}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                  aria-label={`Wyślij SMS do ${fullName}`}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
