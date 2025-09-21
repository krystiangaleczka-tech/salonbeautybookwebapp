import {
  BarChart3,
  Calendar,
  CalendarPlus,
  Clock,
  Coffee,
  LayoutDashboard,
  Scissors,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToneKey } from "./dashboard-theme";

export type NavKey = "dashboard" | "calendar" | "clients" | "services" | "reports";

export interface SidebarNavItem {
  key: NavKey;
  label: string;
  icon: LucideIcon;
  href?: string;
  disabled?: boolean;
}

export const sidebarNavItems: SidebarNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { key: "calendar", label: "Kalendarz", icon: Calendar, href: "/kalendarz" },
  { key: "clients", label: "Klienci", icon: Users, disabled: true },
  { key: "services", label: "Usługi", icon: Scissors, disabled: true },
  { key: "reports", label: "Raporty", icon: BarChart3, disabled: true },
];

export interface StatCardData {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Exclude<ToneKey, "destructive" | "accent">;
}

export const overviewStats: StatCardData[] = [
  { label: "Dzisiejsze wizyty", value: "8", icon: Calendar, tone: "primary" },
  { label: "Oczekujące", value: "3", icon: Clock, tone: "chart3" },
  { label: "Zajętość", value: "75%", icon: TrendingUp, tone: "chart4" },
  { label: "Czas wolny", value: "2h 15m", icon: Coffee, tone: "chart5" },
];

export interface AppointmentCardData {
  name: string;
  service: string;
  time: string;
  price: string;
  gradient: string;
  tone: ToneKey;
  urgent?: boolean;
}

export const appointments: AppointmentCardData[] = [
  {
    name: "Anna Kowalska",
    service: "Manicure hybrydowy",
    time: "09:00",
    price: "120 zł",
    gradient: "from-primary to-accent",
    tone: "primary",
  },
  {
    name: "Katarzyna Nowak",
    service: "Stylizacja brwi",
    time: "10:30",
    price: "80 zł",
    gradient: "from-chart-3 to-chart-4",
    tone: "chart3",
  },
  {
    name: "Maria Wiśniewska",
    service: "Konsultacja + zabieg",
    time: "11:45",
    price: "250 zł",
    gradient: "from-destructive to-[#fb923c]",
    tone: "destructive",
    urgent: true,
  },
  {
    name: "Joanna Lewandowska",
    service: "Masaż twarzy",
    time: "13:15",
    price: "150 zł",
    gradient: "from-chart-5 to-[#a855f7]",
    tone: "chart5",
  },
];

export interface QuickActionData {
  label: string;
  icon: LucideIcon;
  tone: Exclude<ToneKey, "destructive">;
}

export const quickActions: QuickActionData[] = [
  { label: "Nowy klient", icon: UserPlus, tone: "accent" },
  { label: "Dodaj usługę", icon: Scissors, tone: "chart3" },
  { label: "Blokada terminu", icon: CalendarPlus, tone: "chart4" },
  { label: "Raport dnia", icon: BarChart3, tone: "chart5" },
];

export interface StaffAvailabilityData {
  name: string;
  role: string;
  shift: string;
  status: string;
  statusTone: ToneKey;
  gradient: string;
}

export const staffAvailability: StaffAvailabilityData[] = [
  {
    name: "Maja Flak",
    role: "Stylizacja paznokci",
    shift: "08:00 – 16:00",
    status: "W trakcie wizyty",
    statusTone: "primary",
    gradient: "from-primary to-accent",
  },
  {
    name: "Ilona Flak",
    role: "Kosmetologia twarzy",
    shift: "09:00 – 17:00",
    status: "Dostępna",
    statusTone: "chart4",
    gradient: "from-chart-4 to-chart-3",
  },
  {
    name: "Agnieszka Nowicka",
    role: "Makijaż permanentny",
    shift: "10:00 – 18:00",
    status: "Na przerwie",
    statusTone: "accent",
    gradient: "from-chart-5 to-[#c084fc]",
  },
  {
    name: "Kasia Wiśniewska",
    role: "Stylizacja brwi",
    shift: "07:30 – 15:30",
    status: "W drodze do klienta",
    statusTone: "chart3",
    gradient: "from-[#fb923c] to-[#f97316]",
  },
];

export interface PopularServiceData {
  name: string;
  count: number;
  trend: string;
  tone: Exclude<ToneKey, "destructive" | "accent">;
  trendTone: ToneKey;
}

export const popularServices: PopularServiceData[] = [
  {
    name: "Manicure hybrydowy",
    count: 24,
    trend: "+12%",
    tone: "primary",
    trendTone: "primary",
  },
  {
    name: "Stylizacja brwi",
    count: 18,
    trend: "+5%",
    tone: "chart3",
    trendTone: "chart3",
  },
  {
    name: "Masaż kobido",
    count: 14,
    trend: "+8%",
    tone: "chart5",
    trendTone: "chart5",
  },
  {
    name: "Zabieg nawilżający",
    count: 11,
    trend: "+2%",
    tone: "chart4",
    trendTone: "chart4",
  },
];

export const calendarOccupancyBase: Record<string, number> = {
  "2024-01-02": 22,
  "2024-01-03": 48,
  "2024-01-05": 78,
  "2024-01-08": 35,
  "2024-01-10": 62,
  "2024-01-12": 88,
  "2024-01-13": 94,
  "2024-01-15": 71,
  "2024-01-17": 56,
  "2024-01-19": 29,
  "2024-01-20": 44,
  "2024-01-22": 68,
  "2024-01-24": 81,
  "2024-01-26": 97,
  "2024-01-28": 52,
};
