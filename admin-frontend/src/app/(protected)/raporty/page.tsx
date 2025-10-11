"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AnalyticsPanel } from "@/components/reports/analytics-panel";
import { getBubbleStyle, toneTextClass } from "@/lib/dashboard-theme";
import { 
  getReportStats, 
  getWeeklyTrends,
  type ReportStats,
  type WeeklyTrend
} from "@/lib/dashboard-service";
import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Coffee, Crown, TrendingDown } from "lucide-react";

export default function ReportsPage() {
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, trendsData] = await Promise.all([
          getReportStats(),
          getWeeklyTrends()
        ]);
        
        setReportStats(statsData);
        setWeeklyTrends(trendsData);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statsData = reportStats ? [
    {
      label: "Dzisiejsze wizyty",
      value: reportStats.todayAppointments.toString(),
      tone: "primary" as const,
      icon: Calendar,
      meta: "Zrealizowane",
    },
    {
      label: "Zajętość",
      value: `${reportStats.occupancyRate}%`,
      tone: "chart4" as const,
      icon: TrendingUp,
      meta: "Obłożenie dnia",
    },
    {
      label: "Czas wolny",
      value: reportStats.freeTime,
      tone: "chart5" as const,
      icon: Coffee,
      meta: "Do dyspozycji",
    },
    {
      label: "TOP usługa tygodnia",
      value: reportStats.topServiceWeekly,
      tone: "chart3" as const,
      icon: TrendingUp,
      meta: `${reportStats.topServiceWeeklyCount} rezerwacji`,
    },
    {
      label: "LOW usługa tygodnia",
      value: reportStats.lowServiceWeekly,
      tone: "chart4" as const,
      icon: TrendingDown,
      meta: `${reportStats.lowServiceWeeklyCount} rezerwacji`,
    },
    {
      label: "TOP usługa z 3 miesięcy",
      value: reportStats.topServiceQuarterly,
      tone: "chart5" as const,
      icon: Crown,
      meta: `${reportStats.topServiceQuarterlyCount} rezerwacji`,
    },
  ] : [];

  if (loading) {
    return (
      <DashboardLayout
        active="reports"
        header={{
          title: "Raporty",
          subtitle: "Analizuj wyniki salonu i podejmuj lepsze decyzje",
          actions: undefined,
        }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Ładowanie danych...</div>
        </div>
      </DashboardLayout>
    );
  }

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
        {statsData.map(({ label, value, tone, icon: Icon, meta }) => (
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

      <AnalyticsPanel weeklyTrends={weeklyTrends} />
    </DashboardLayout>
  );
}
