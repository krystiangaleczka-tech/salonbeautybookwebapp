"use client";

import { Bell, Eye, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  getBubbleStyle,
  getSoftBadgeStyle,
  toneColorMap,
  toneTextClass,
} from "@/lib/dashboard-theme";
import {
  getDashboardStats,
  getTodayAppointments,
  getAllAppointments,
  getDayAppointments,
  getPopularServices,
  getStaffAvailability,
  type DashboardStats,
  type AppointmentWithDetails,
  type PopularService,
  type StaffAvailability
} from "@/lib/dashboard-service";
import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Coffee, Users } from "lucide-react";
import { format, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import NotificationsModal from "@/components/notifications/notifications-modal";
import { getUnreadNotifications, type Notification } from "@/lib/notifications-service";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Nowy stan dla wybranej daty
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching data for:", { showAllAppointments, selectedDate });
        
        let appointmentsData;
        if (showAllAppointments) {
          appointmentsData = await getAllAppointments();
        } else {
          appointmentsData = await getDayAppointments(selectedDate);
        }
        
        const [statsData, servicesData, staffData] = await Promise.all([
          getDashboardStats(),
          getPopularServices(),
          getStaffAvailability()
        ]);
        
        console.log("Appointments data received:", appointmentsData);
        
        setStats(statsData);
        setAppointments(appointmentsData);
        setPopularServices(servicesData);
        setStaffAvailability(staffData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showAllAppointments, selectedDate]); // Upewnij się, że obie zależności są tutaj

  // Pobieranie liczby nieprzeczytanych powiadomień
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const unreadNotifications = await getUnreadNotifications();
        setUnreadNotificationsCount(unreadNotifications.length);
      } catch (error) {
        console.error("Error fetching unread notifications count:", error);
      }
    };

    fetchUnreadCount();
    
    // Odświeżaj co 30 sekund
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleAppointmentsView = async () => {
    if (!showAllAppointments) {
      // Przełącz na wszystkie rezerwacje
      setShowAllAppointments(true);
      // Nie resetuj selectedDate - pozwól useEffect załatwić resztę
    } else {
      // Przełącz na dzisiejsze wizyty
      setShowAllAppointments(false);
      setSelectedDate(new Date()); // To wywoła useEffect
    }
  };

  const headerActions = (
    <div className="hidden sm:flex items-center gap-2">
      <button className="btn-primary">
        <Plus className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Nowa rezerwacja</span>
        <span className="sm:hidden">Dodaj</span>
      </button>
      <div className="relative">
        <button 
          className="group flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 active:scale-95"
          onClick={() => setIsNotificationsModalOpen(true)}
        >
          <Bell className="h-5 w-5" />
        </button>
        {unreadNotificationsCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
          </span>
        )}
      </div>
    </div>
  );

  const currentDate = selectedDate; // Użyj wybranej daty zamiast dzisiejszej
  const daysOfWeek = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
  const currentDay = daysOfWeek[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];
  const formattedDate = `${currentDate.getDate()} ${currentDate.toLocaleDateString('pl', { month: 'long' })} ${currentDate.getFullYear()}`;

  const overviewStats = stats ? [
    { label: "Dzisiejsze wizyty", value: stats.todayAppointments.toString(), icon: Calendar, tone: "primary" as const },
    { label: "Zajętość", value: `${stats.occupancyRate}%`, icon: TrendingUp, tone: "chart4" as const },
    { label: "Czas wolny", value: stats.freeTime, icon: Coffee, tone: "chart5" as const },
  ] : [];

  const maxPopularity = popularServices.length > 0 
    ? Math.max(...popularServices.map((service) => service.count))
    : 1;

  if (loading) {
    return (
      <DashboardLayout
        active="dashboard"
        header={{
          title: "Witaj, Maja!",
          subtitle: `Dzisiaj jest ${currentDay}, ${formattedDate}`,
          actions: headerActions,
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
      active="dashboard"
      header={{
        title: "Witaj, Maja!",
        subtitle: `Dzisiaj jest ${currentDay}, ${formattedDate}`,
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
            <h2 className="text-xl font-semibold text-foreground">
              {showAllAppointments ? "Wszystkie rezerwacje" : 
               isToday(selectedDate) ? "Dzisiejsze wizyty" : "Wizyty na wybrany dzień"}
            </h2>
            <span className="text-sm font-medium text-primary">{appointments.length} rezerwacji</span>
          </div>

          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments.map(({ id, customerName, serviceName, start, end, price }) => {
                const startTime = start instanceof Date ? start : start.toDate();
                const endTime = end instanceof Date ? end : end.toDate();
                const timeString = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
                const dateString = showAllAppointments
                  ? format(startTime, "dd.MM.yyyy", { locale: pl })
                  : "";
                const priceString = price ? `${price} zł` : "Cena nieokreślona";
                
                return (
                  <article
                    key={id}
                    className="card flex flex-col gap-4 border-l-4 border-primary p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-accent" />
                        <div>
                          <p className="font-medium text-foreground">{customerName}</p>
                          <p className="text-sm text-muted-foreground">{serviceName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{timeString}</p>
                        {showAllAppointments && (
                          <p className="text-sm text-muted-foreground">{dateString}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{priceString}</p>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {showAllAppointments ? "Brak rezerwacji" : 
                 isToday(selectedDate) ? "Brak wizyt na dziś" : "Brak wizyt na wybrany dzień"}
              </div>
            )}
          </div>

          <button
            className="btn-primary mt-6 w-full"
            onClick={toggleAppointmentsView}
            disabled={loading}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showAllAppointments ? "Pokaż dzisiejsze wizyty" : "Zobacz wszystkie rezerwacje"}
          </button>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden p-0">
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-center text-primary-foreground">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  title="Poprzedni miesiąc"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex flex-col items-center">
                  <h2 className="text-xl font-semibold">
                    {currentDate.toLocaleDateString('pl', { month: 'long' }).toUpperCase()} {currentDate.getFullYear()}
                  </h2>
                  {!isToday(selectedDate) && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(new Date())}
                      className="mt-1 px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      Dzisiaj
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  title="Następny miesiąc"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
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
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                  const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // convert Sunday-first to Monday-first
                  const day = i - startOffset + 1;
                  const isCurrentMonth = day >= 1 && day <= new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                  const isSelected = isCurrentMonth && 
                    selectedDate.getFullYear() === currentDate.getFullYear() && 
                    selectedDate.getMonth() === currentDate.getMonth() && 
                    selectedDate.getDate() === day;
                  const isTodayDate = isCurrentMonth && 
                    new Date().getFullYear() === currentDate.getFullYear() && 
                    new Date().getMonth() === currentDate.getMonth() && 
                    new Date().getDate() === day;
                  
                  const handleClick = () => {
                    if (isCurrentMonth) {
                      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      setSelectedDate(newDate);
                      setShowAllAppointments(false); // Przełącz z powrotem na widok dnia
                    }
                  };
                  
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={handleClick}
                      className={`calendar-day p-2 rounded-lg transition-all ${
                        isSelected ? "bg-primary text-primary-foreground shadow-md" : 
                        isTodayDate ? "bg-accent text-accent-foreground font-bold" : 
                        isCurrentMonth ? "hover:bg-accent/50 text-foreground" : "text-muted-foreground"
                      }`}
                      disabled={!isCurrentMonth}
                      title={isCurrentMonth ? `${day} ${currentDate.toLocaleDateString('pl', { month: 'long' })} ${currentDate.getFullYear()}` : ""}
                    >
                      {isCurrentMonth ? day : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Szybkie akcje</h2>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="quick-action-tile">
                <Plus className="mb-2 h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground">Nowy klient</span>
              </button>
              <button type="button" className="quick-action-tile">
                <Calendar className="mb-2 h-6 w-6 text-chart-3" />
                <span className="text-sm font-medium text-foreground">Dodaj usługę</span>
              </button>
              <button type="button" className="quick-action-tile">
                <Eye className="mb-2 h-6 w-6 text-chart-4" />
                <span className="text-sm font-medium text-foreground">Blokada terminu</span>
              </button>
              <button type="button" className="quick-action-tile">
                <TrendingUp className="mb-2 h-6 w-6 text-chart-5" />
                <span className="text-sm font-medium text-foreground">Raport dnia</span>
              </button>
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
            {staffAvailability.length > 0 ? (
              staffAvailability.map(({ name, role, activeAppointments, status }) => {
                const statusColors = {
                  available: "chart4",
                  busy: "primary",
                  "on-break": "accent"
                } as const;
                
                const gradientColors = {
                  available: "from-chart-4 to-chart-3",
                  busy: "from-primary to-accent",
                  "on-break": "from-chart-5 to-[#c084fc]"
                };
                
                return (
                  <article
                    key={name}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${gradientColors[status]}`} />
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-sm text-muted-foreground">{role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${toneTextClass[statusColors[status]]}`}
                        style={getSoftBadgeStyle(statusColors[status])}
                      >
                        {status === "available" ? "Dostępna" : status === "busy" ? "W trakcie wizyty" : "Na przerwie"}
                      </span>
                      <p className="mt-2 text-sm text-muted-foreground">{activeAppointments} wizyt</p>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Brak danych o personelu
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Popularne usługi</h2>
            <span className="text-sm text-muted-foreground">Ten tydzień</span>
          </div>
          <div className="space-y-4">
            {popularServices.length > 0 ? (
              popularServices.map(({ id, name, count, trend }, index) => {
                const toneIndex = index % 5;
                const tones: Array<"primary" | "chart3" | "chart4" | "chart5"> = ["primary", "chart3", "chart4", "chart5", "chart3"];
                const tone = tones[toneIndex];
                
                return (
                  <article key={id} className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-sm text-muted-foreground">{count} wizyt</p>
                      </div>
                      <span className={`text-sm font-semibold ${toneTextClass[tone]}`}>{trend}</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / maxPopularity) * 100}%`,
                          background: toneColorMap[tone],
                        }}
                      />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Brak danych o popularności usług
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal powiadomień */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />
    </DashboardLayout>
  );
}
