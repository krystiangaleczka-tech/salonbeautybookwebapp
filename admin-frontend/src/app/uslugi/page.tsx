import type { ComponentType } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { serviceKpis, services } from "@/lib/dashboard-data";
import { getBubbleStyle, toneTextClass, type ToneKey } from "@/lib/dashboard-theme";
import {
  Crown,
  Filter,
  Pencil,
  Plus,
  Scissors,
  Search,
  Star,
  Trash2,
  TrendingDown,
} from "lucide-react";

interface ServiceStat {
  label: string;
  value: string;
  meta: string;
  tone: ToneKey;
  icon: ComponentType<{ className?: string }>;
}

const statCards: ServiceStat[] = [
  {
    label: "Ilość usług",
    value: serviceKpis.total.toString(),
    icon: Scissors,
    tone: "primary" as const,
    meta: "Aktywne w katalogu",
  },
  {
    label: "TOP usługa tygodnia",
    value: serviceKpis.topWeekly.name,
    icon: Star,
    tone: "chart3" as const,
    meta: `${serviceKpis.topWeekly.weeklyBookings} rezerwacji`,
  },
  {
    label: "LOW usługa tygodnia",
    value: serviceKpis.lowWeekly.name,
    icon: TrendingDown,
    tone: "chart4" as const,
    meta: `${serviceKpis.lowWeekly.weeklyBookings} rezerwacji`,
  },
  {
    label: "TOP usługa z 3 miesięcy",
    value: serviceKpis.topQuarterly.name,
    icon: Crown,
    tone: "chart5" as const,
    meta: `${serviceKpis.topQuarterly.quarterlyBookings} rezerwacji`,
  },
];

const serviceHeaders = ["", "Nazwa usługi", "Orientacyjny czas"];

export default function ServicesPage() {
  return (
    <DashboardLayout
      active="services"
      header={{
        title: "Usługi",
        subtitle: "Zarządzaj katalogiem zabiegów i dostępnością",
        actions: undefined,
      }}
    >
      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, tone, meta }) => (
          <article key={label} className="card stat-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
                <p className={`text-sm font-medium ${toneTextClass[tone]}`}>{meta}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={getBubbleStyle(tone)}>
                <Icon className={`h-6 w-6 ${toneTextClass[tone]}`} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-6">
        <div className="card border border-border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Szukaj usługi po nazwie..."
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
            Usuń usługę
          </button>
          <button className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj usługę
          </button>
          <button className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj usługę
          </button>
        </div>

        <div className="card border border-border">
          <div className="grid grid-cols-[48px_1fr_160px] items-center gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {serviceHeaders.map((header, index) => (
              <span key={`${header}-${index}`}>{header}</span>
            ))}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {services.map(({ id, name, duration }) => (
              <div
                key={id}
                className="grid grid-cols-[48px_1fr_160px] items-center gap-4 border-b border-border px-6 py-4 last:border-b-0 hover:bg-muted/60"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  aria-label={`Zaznacz usługę ${name}`}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="text-xs text-muted-foreground">Standardowy zabieg</span>
                </div>
                <span className="text-sm font-medium text-foreground">{duration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
