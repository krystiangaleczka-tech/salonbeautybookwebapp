import { Bell, Eye, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  appointments,
  overviewStats,
  popularServices,
  quickActions,
  staffAvailability,
} from "@/lib/dashboard-data";
import {
  getAccentBorder,
  getBubbleStyle,
  getSoftBadgeStyle,
  toneColorMap,
  toneTextClass,
} from "@/lib/dashboard-theme";

export default function DashboardPage() {
  const maxPopularity = Math.max(...popularServices.map((service) => service.count));

  const headerActions = (
    <>
      <button className="btn-primary">
        <Plus className="mr-2 h-4 w-4" />
        Nowa rezerwacja
      </button>
      <div className="relative">
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Bell className="h-5 w-5" />
        </button>
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
          3
        </span>
      </div>
    </>
  );

  return (
    <DashboardLayout
      active="dashboard"
      header={{
        title: "Witaj, Maja!",
        subtitle: "Dzisiaj jest poniedziałek, 15 stycznia 2024",
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Dzisiejsze wizyty</h2>
            <span className="text-sm font-medium text-primary">8 rezerwacji</span>
          </div>

          <div className="space-y-4">
            {appointments.map(({ name, service, time, price, gradient, tone, urgent }) => (
              <article
                key={`${name}-${time}`}
                className={`card flex flex-col gap-4 border-l-4 p-4 ${urgent ? "border-destructive" : "border-primary"}`}
                style={getAccentBorder(tone)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${gradient}`} />
                    <div>
                      <p className="font-medium text-foreground">{name}</p>
                      <p className="text-sm text-muted-foreground">{service}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${urgent ? "text-destructive" : "text-foreground"}`}>{time}</p>
                    <p className="text-sm text-muted-foreground">{price}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button className="btn-primary mt-6 w-full">
            <Eye className="mr-2 h-4 w-4" />
            Zobacz wszystkie rezerwacje
          </button>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden p-0">
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-center text-primary-foreground">
              <h2 className="text-xl font-semibold">STYCZEŃ 2024</h2>
            </div>
            <div className="p-6">
              <div className="mb-2 grid grid-cols-7 gap-2 text-sm text-muted-foreground">
                {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((day) => (
                  <span key={day} className="text-center">
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`calendar-day ${day === 15 ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Szybkie akcje</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map(({ label, icon: Icon, tone }) => (
                <button key={label} type="button" className="quick-action-tile">
                  <Icon className={`mb-2 h-6 w-6 ${toneTextClass[tone]}`} />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Dostępność personelu</h2>
            <span className="text-sm text-muted-foreground">Aktualny dyżur</span>
          </div>
          <div className="space-y-4">
            {staffAvailability.map(({ name, role, shift, status, statusTone, gradient }) => (
              <article
                key={name}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${gradient}`} />
                  <div>
                    <p className="font-medium text-foreground">{name}</p>
                    <p className="text-sm text-muted-foreground">{role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${toneTextClass[statusTone]}`}
                    style={getSoftBadgeStyle(statusTone)}
                  >
                    {status}
                  </span>
                  <p className="mt-2 text-sm text-muted-foreground">{shift}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Popularne usługi</h2>
            <span className="text-sm text-muted-foreground">Ten tydzień</span>
          </div>
          <div className="space-y-4">
            {popularServices.map(({ name, count, trend, tone, trendTone }) => (
              <article key={name} className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{name}</p>
                    <p className="text-sm text-muted-foreground">{count} wizyt</p>
                  </div>
                  <span className={`text-sm font-semibold ${toneTextClass[trendTone]}`}>{trend}</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${maxPopularity ? (count / maxPopularity) * 100 : 0}%`,
                      background: toneColorMap[tone],
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
