import {
  BarChart3,
  Calendar,
  CalendarPlus,
  Clock,
  Coffee,
  Crown,
  LayoutDashboard,
  Settings,
  Scissors,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToneKey } from "./dashboard-theme";

export type NavKey = "dashboard" | "calendar" | "clients" | "services" | "reports" | "settings";

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
  { key: "clients", label: "Klienci", icon: Users, href: "/klienci" },
  { key: "services", label: "Usługi", icon: Scissors, href: "/uslugi" },
  { key: "reports", label: "Raporty", icon: BarChart3, href: "/raporty" },
  { key: "settings", label: "Ustawienia", icon: Settings, href: "/ustawienia" },
];

export interface StatCardData {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Exclude<ToneKey, "destructive" | "accent">;
}

export const overviewStats: StatCardData[] = [
  { label: "Dzisiejsze wizyty", value: "8", icon: Calendar, tone: "primary" },
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

export interface ClientRecord {
  id: string;
  fullName: string;
  phone: string;
}

export const clients: ClientRecord[] = [
  { id: "cli-1", fullName: "Anna Kowalska", phone: "+48 600 123 456" },
  { id: "cli-2", fullName: "Katarzyna Nowak", phone: "+48 601 987 654" },
  { id: "cli-3", fullName: "Magdalena Wójcik", phone: "+48 602 789 012" },
  { id: "cli-4", fullName: "Joanna Zielińska", phone: "+48 603 234 567" },
  { id: "cli-5", fullName: "Marta Kamińska", phone: "+48 604 345 678" },
  { id: "cli-6", fullName: "Agnieszka Wiśniewska", phone: "+48 605 456 789" },
  { id: "cli-7", fullName: "Dorota Lewandowska", phone: "+48 606 567 890" },
  { id: "cli-8", fullName: "Paulina Szymańska", phone: "+48 607 678 901" },
  { id: "cli-9", fullName: "Karolina Kaczmarek", phone: "+48 608 789 234" },
  { id: "cli-10", fullName: "Ewelina Piotrowska", phone: "+48 609 890 345" },
  { id: "cli-11", fullName: "Natalia Pawlak", phone: "+48 690 123 987" },
  { id: "cli-12", fullName: "Sylwia Górska", phone: "+48 691 234 098" },
  { id: "cli-13", fullName: "Patrycja Adamska", phone: "+48 692 345 109" },
];

export interface ServiceRecord {
  id: string;
  name: string;
  duration: string;
  weeklyBookings: number;
  quarterlyBookings: number;
}

export const services: ServiceRecord[] = [
  {
    id: "srv-1",
    name: "Manicure hybrydowy",
    duration: "60 min",
    weeklyBookings: 24,
    quarterlyBookings: 210,
  },
  {
    id: "srv-2",
    name: "Pedicure SPA",
    duration: "75 min",
    weeklyBookings: 11,
    quarterlyBookings: 126,
  },
  {
    id: "srv-3",
    name: "Stylizacja brwi",
    duration: "30 min",
    weeklyBookings: 18,
    quarterlyBookings: 162,
  },
  {
    id: "srv-4",
    name: "Makijaż okolicznościowy",
    duration: "90 min",
    weeklyBookings: 7,
    quarterlyBookings: 92,
  },
  {
    id: "srv-5",
    name: "Masaż kobido",
    duration: "70 min",
    weeklyBookings: 14,
    quarterlyBookings: 134,
  },
  {
    id: "srv-6",
    name: "Zabieg nawilżający",
    duration: "50 min",
    weeklyBookings: 9,
    quarterlyBookings: 118,
  },
  {
    id: "srv-7",
    name: "Regulacja brwi + henna",
    duration: "35 min",
    weeklyBookings: 12,
    quarterlyBookings: 102,
  },
  {
    id: "srv-8",
    name: "Przedłużanie rzęs 2:1",
    duration: "110 min",
    weeklyBookings: 6,
    quarterlyBookings: 85,
  },
  {
    id: "srv-9",
    name: "Depilacja woskiem",
    duration: "45 min",
    weeklyBookings: 5,
    quarterlyBookings: 74,
  },
  {
    id: "srv-10",
    name: "Peeling kawitacyjny",
    duration: "40 min",
    weeklyBookings: 4,
    quarterlyBookings: 66,
  },
];

export const serviceKpis = {
  total: services.length,
  topWeekly: services.reduce((prev, current) =>
    current.weeklyBookings > prev.weeklyBookings ? current : prev
  ),
  lowWeekly: services.reduce((prev, current) =>
    current.weeklyBookings < prev.weeklyBookings ? current : prev
  ),
  topQuarterly: services.reduce((prev, current) =>
    current.quarterlyBookings > prev.quarterlyBookings ? current : prev
  ),
};

export const reportStats = [
  {
    label: "Dzisiejsze wizyty",
    value: "8",
    tone: "primary" as const,
    icon: Calendar,
    meta: "Zrealizowane",
  },
  {
    label: "Zajętość",
    value: "75%",
    tone: "chart4" as const,
    icon: TrendingUp,
    meta: "Obłożenie dnia",
  },
  {
    label: "Czas wolny",
    value: "2h 15m",
    tone: "chart5" as const,
    icon: Coffee,
    meta: "Do dyspozycji",
  },
  {
    label: "TOP usługa tygodnia",
    value: serviceKpis.topWeekly.name,
    tone: "chart3" as const,
    icon: TrendingUp,
    meta: `${serviceKpis.topWeekly.weeklyBookings} rezerwacji`,
  },
  {
    label: "LOW usługa tygodnia",
    value: serviceKpis.lowWeekly.name,
    tone: "chart4" as const,
    icon: TrendingDown,
    meta: `${serviceKpis.lowWeekly.weeklyBookings} rezerwacji`,
  },
  {
    label: "TOP usługa z 3 miesięcy",
    value: serviceKpis.topQuarterly.name,
    tone: "chart5" as const,
    icon: Crown,
    meta: `${serviceKpis.topQuarterly.quarterlyBookings} rezerwacji`,
  },
] as const;

export const analysisTiles = [
  "Obłożenie tygodniowe",
  "Nowi klienci",
  "Powracający klienci",
  "Przychód",
  "Średnia wartość wizyty",
  "Konwersja zapytań",
  "Anulacje",
  "No-show",
  "Średni czas wizyty",
  "Sentyment opinii",
];

export const weeklyTrend = [
  { label: "Tydzień 1", value: 32 },
  { label: "Tydzień 2", value: 45 },
  { label: "Tydzień 3", value: 51 },
  { label: "Tydzień 4", value: 48 },
  { label: "Tydzień 5", value: 56 },
  { label: "Tydzień 6", value: 62 },
  { label: "Tydzień 7", value: 58 },
  { label: "Tydzień 8", value: 67 },
];
