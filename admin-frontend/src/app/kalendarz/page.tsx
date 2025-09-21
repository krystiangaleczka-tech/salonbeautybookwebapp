import dynamic from "next/dynamic";
import { Filter, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { calendarOccupancyBase, overviewStats } from "@/lib/dashboard-data";
import { getBubbleStyle, toneTextClass } from "@/lib/dashboard-theme";

const CalendarCard = dynamic(
  () => import("@/components/dashboard/calendar-card").then((mod) => mod.CalendarCard),
  { ssr: false }
);

const occupancyLegend: Array<{ label: string; description: string; className: string }> = [
  { label: "Do 30%", description: "Dostępne sloty w większości godzin", className: "occupancy-dot-low" },
  { label: "31% – 60%", description: "Średnie obłożenie – warto monitorować", className: "occupancy-dot-medium" },
  { label: "61% – 90%", description: "Wysokie zainteresowanie – rozważ dodatkowe sloty", className: "occupancy-dot-high" },
  { label: "90%+", description: "Prawie pełny dzień – brak dostępnych okien", className: "occupancy-dot-critical" },
];

export default function CalendarPage() {
  const headerActions = (
    <>
      <button className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
        <Filter className="mr-2 h-4 w-4" />
        Filtry
      </button>
      <button className="btn-primary">
        <Plus className="mr-2 h-4 w-4" />
        Nowa rezerwacja
      </button>
    </>
  );

  return (
    <DashboardLayout
      active="calendar"
      header={{
        title: "Kalendarz",
        subtitle: "Zaplanuj grafik zespołu i monitoruj dostępność",
        actions: headerActions,
      }}
    >
      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="card stat-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-3xl font-bold ${toneTextClass[tone]}`}>{value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={getBubbleStyle(tone)}>
                <Icon className={`h-6 w-6 ${toneTextClass[tone]}`} />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CalendarCard occupancy={calendarOccupancyBase} />
        <div className="card h-max p-6">
          <h2 className="text-xl font-semibold text-foreground">Legenda zajętości</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Kolory kropek wskazują poziom obłożenia dnia na podstawie procentowej zajętości slotów.
          </p>
          <div className="mt-4 space-y-4">
            {occupancyLegend.map(({ label, description, className }) => (
              <div key={label} className="flex items-start gap-3">
                <span className={`mt-1 h-3 w-3 rounded-full ${className}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
