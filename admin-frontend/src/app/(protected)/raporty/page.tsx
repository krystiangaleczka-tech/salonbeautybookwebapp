import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AnalyticsPanel } from "@/components/reports/analytics-panel";
import { reportStats } from "@/lib/dashboard-data";
import { getBubbleStyle, toneTextClass } from "@/lib/dashboard-theme";

export default function ReportsPage() {
  return (
    <DashboardLayout
      active="reports"
      header={{
        title: "Raporty",
        subtitle: "Analizuj wyniki salonu i podejmuj lepsze decyzje",
        actions: undefined,
      }}
    >
      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {reportStats.map(({ label, value, tone, icon: Icon, meta }) => (
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

      <AnalyticsPanel />
    </DashboardLayout>
  );
}
