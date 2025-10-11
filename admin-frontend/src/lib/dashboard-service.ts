import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  count,
  sum,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subscribeToAppointments, type Appointment } from "./appointments-service";
import { subscribeToCustomers, type Customer } from "./customers-service";
import { subscribeToServices, type ServiceRecord } from "./services-service";

// Funkcje pomocnicze do operacji na datach
function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

function endOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

function startOfWeek(date: Date): Date {
  const newDate = new Date(date);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(newDate.setDate(diff));
}

function endOfWeek(date: Date): Date {
  const newDate = startOfWeek(date);
  newDate.setDate(newDate.getDate() + 6);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export interface DashboardStats {
  todayAppointments: number;
  occupancyRate: number;
  freeTime: string;
  weekRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  totalServices: number;
}

export interface AppointmentWithDetails extends Appointment {
  customerName?: string;
  serviceName?: string;
  servicePrice?: number;
}

export interface PopularService {
  id: string;
  name: string;
  count: number;
  revenue: number;
  trend: string;
}

export interface StaffAvailability {
  name: string;
  role: string;
  activeAppointments: number;
  status: "available" | "busy" | "on-break";
  nextAppointment?: Timestamp;
}

export interface WeeklyTrend {
  week: string;
  appointments: number;
  revenue: number;
}

export interface ReportStats {
  todayAppointments: number;
  occupancyRate: number;
  freeTime: string;
  topServiceWeekly: string;
  topServiceWeeklyCount: number;
  lowServiceWeekly: string;
  lowServiceWeeklyCount: number;
  topServiceQuarterly: string;
  topServiceQuarterlyCount: number;
}

// Pobieranie statystyk dla dashboardu
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  try {
    // Pobierz dzisiejsze wizyty
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("start", ">=", todayStart),
      where("start", "<=", todayEnd),
      where("status", "==", "confirmed")
    );
    const todayAppointmentsSnapshot = await getDocs(appointmentsQuery);
    const todayAppointmentsCount = todayAppointmentsSnapshot.size;

    // Pobierz wszystkie wizyty w tym tygodniu do obliczenia obłożenia
    const weekAppointmentsQuery = query(
      collection(db, "appointments"),
      where("start", ">=", weekStart),
      where("start", "<=", weekEnd),
      where("status", "==", "confirmed")
    );
    const weekAppointmentsSnapshot = await getDocs(weekAppointmentsQuery);

    // Pobierz pracowników do obliczenia obłożenia
    const employeesSnapshot = await getDocs(collection(db, "employees"));
    const totalEmployees = employeesSnapshot.size;
    const maxWeeklySlots = totalEmployees * 40; // Zakładając 40 slotów tygodniowo na pracownika

    // Oblicz obłożenie
    const occupancyRate = maxWeeklySlots > 0 ? Math.round((weekAppointmentsSnapshot.size / maxWeeklySlots) * 100) : 0;

    // Oblicz czas wolny na dziś
    const workingHoursStart = 8; // 8:00
    const workingHoursEnd = 18; // 18:00
    const totalWorkingMinutes = (workingHoursEnd - workingHoursStart) * 60 * totalEmployees;
    const bookedMinutes = todayAppointmentsSnapshot.docs.reduce((total, doc) => {
      const appointment = doc.data();
      const start = appointment.start instanceof Timestamp ? appointment.start.toDate() : new Date();
      const end = appointment.end instanceof Timestamp ? appointment.end.toDate() : new Date();
      return total + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    const freeMinutes = Math.max(0, totalWorkingMinutes - bookedMinutes);
    const freeHours = Math.floor(freeMinutes / 60);
    const freeMinutesRemainder = Math.round(freeMinutes % 60);
    const freeTime = `${freeHours}h ${freeMinutesRemainder}m`;

    // Oblicz przychody
    const weekRevenue = weekAppointmentsSnapshot.docs.reduce((total, doc) => {
      const appointment = doc.data();
      return total + (appointment.price || 0);
    }, 0);

    const monthAppointmentsQuery = query(
      collection(db, "appointments"),
      where("start", ">=", monthStart),
      where("start", "<=", monthEnd),
      where("status", "==", "confirmed")
    );
    const monthAppointmentsSnapshot = await getDocs(monthAppointmentsQuery);
    const monthlyRevenue = monthAppointmentsSnapshot.docs.reduce((total, doc) => {
      const appointment = doc.data();
      return total + (appointment.price || 0);
    }, 0);

    // Pobierz liczbę klientów i usług
    const customersSnapshot = await getDocs(collection(db, "customers"));
    const servicesSnapshot = await getDocs(collection(db, "services"));

    return {
      todayAppointments: todayAppointmentsCount,
      occupancyRate,
      freeTime,
      weekRevenue,
      monthlyRevenue,
      totalCustomers: customersSnapshot.size,
      totalServices: servicesSnapshot.size,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      todayAppointments: 0,
      occupancyRate: 0,
      freeTime: "0h 0m",
      weekRevenue: 0,
      monthlyRevenue: 0,
      totalCustomers: 0,
      totalServices: 0,
    };
  }
}

// Pobieranie dzisiejszych wizyt z detalami
export async function getTodayAppointments(): Promise<AppointmentWithDetails[]> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  try {
    // Pobierz dzisiejsze wizyty
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("start", ">=", todayStart),
      where("start", "<=", todayEnd),
      where("status", "==", "confirmed"),
      orderBy("start")
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);

    // Pobierz wszystkie klientów i usługi
    const customersSnapshot = await getDocs(collection(db, "customers"));
    const servicesSnapshot = await getDocs(collection(db, "services"));

    // Stwórz mapy dla szybkiego dostępu
    const customersMap = new Map();
    customersSnapshot.docs.forEach(doc => {
      customersMap.set(doc.id, doc.data());
    });

    const servicesMap = new Map();
    servicesSnapshot.docs.forEach(doc => {
      servicesMap.set(doc.id, doc.data());
    });

    // Połącz dane
    return appointmentsSnapshot.docs.map(doc => {
      const appointment = {
        id: doc.id,
        ...doc.data()
      } as Appointment;

      const customer = customersMap.get(appointment.clientId);
      const service = servicesMap.get(appointment.serviceId);

      return {
        ...appointment,
        customerName: customer?.fullName || "Nieznany klient",
        serviceName: service?.name || "Nieznana usługa",
        servicePrice: service?.price || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching today appointments:", error);
    return [];
  }
}

// Pobieranie popularnych usług
export async function getPopularServices(): Promise<PopularService[]> {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  try {
    // Pobierz wizyty z ostatniego tygodnia
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("start", ">=", weekStart),
      where("start", "<=", weekEnd),
      where("status", "==", "confirmed")
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);

    // Pobierz wszystkie usługi
    const servicesSnapshot = await getDocs(collection(db, "services"));

    // Zlicz wizyty dla każdej usługi
    const serviceCounts = new Map();
    const serviceRevenue = new Map();

    appointmentsSnapshot.docs.forEach(doc => {
      const appointment = doc.data();
      const serviceId = appointment.serviceId;
      const price = appointment.price || 0;

      serviceCounts.set(serviceId, (serviceCounts.get(serviceId) || 0) + 1);
      serviceRevenue.set(serviceId, (serviceRevenue.get(serviceId) || 0) + price);
    });

    // Połącz dane i posortuj
    const popularServices: PopularService[] = [];
    servicesSnapshot.docs.forEach(doc => {
      const serviceId = doc.id;
      const serviceData = doc.data();
      const count = serviceCounts.get(serviceId) || 0;
      const revenue = serviceRevenue.get(serviceId) || 0;

      if (count > 0) {
        popularServices.push({
          id: serviceId,
          name: serviceData.name,
          count,
          revenue,
          trend: "+5%", // TODO: Obliczyć rzeczywisty trend
        });
      }
    });

    return popularServices.sort((a, b) => b.count - a.count).slice(0, 5);
  } catch (error) {
    console.error("Error fetching popular services:", error);
    return [];
  }
}

// Pobieranie dostępności personelu
export async function getStaffAvailability(): Promise<StaffAvailability[]> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  try {
    // Pobierz pracowników
    const employeesSnapshot = await getDocs(collection(db, "employees"));
    
    // Pobierz dzisiejsze wizyty
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("start", ">=", todayStart),
      where("start", "<=", todayEnd),
      where("status", "==", "confirmed")
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);

    // Grupuj wizyty po pracownikach
    const staffAppointments = new Map();
    appointmentsSnapshot.docs.forEach(doc => {
      const appointment = doc.data();
      const staffName = appointment.staffName;
      
      if (!staffAppointments.has(staffName)) {
        staffAppointments.set(staffName, []);
      }
      staffAppointments.get(staffName).push({
        start: appointment.start instanceof Timestamp ? appointment.start.toDate() : new Date(),
        end: appointment.end instanceof Timestamp ? appointment.end.toDate() : new Date(),
      });
    });

    // Stwórz listę dostępności
    const staffAvailability: StaffAvailability[] = [];
    
    employeesSnapshot.docs.forEach(doc => {
      const employee = doc.data();
      const name = employee.fullName || employee.name || "Nieznany pracownik";
      const role = employee.role || "Specjalista";
      const appointments = staffAppointments.get(name) || [];
      
      // Określ status pracownika
      let status: "available" | "busy" | "on-break" = "available";
      let nextAppointment: Timestamp | undefined;
      
      const now = new Date();
      const currentAppointment = appointments.find(apt => 
        apt.start <= now && apt.end >= now
      );
      
      if (currentAppointment) {
        status = "busy";
      } else {
        const nextApt = appointments.find(apt => apt.start > now);
        if (nextApt) {
          nextAppointment = Timestamp.fromDate(nextApt.start);
          // Jeśli następna wizyta jest w ciągu 30 minut, ustaw status "on-break"
          if (nextApt.start.getTime() - now.getTime() < 30 * 60 * 1000) {
            status = "on-break";
          }
        }
      }

      staffAvailability.push({
        name,
        role,
        activeAppointments: appointments.length,
        status,
        nextAppointment,
      });
    });

    return staffAvailability;
  } catch (error) {
    console.error("Error fetching staff availability:", error);
    return [];
  }
}

// Pobieranie tygodniowych trendów
export async function getWeeklyTrends(): Promise<WeeklyTrend[]> {
  const trends: WeeklyTrend[] = [];
  const now = new Date();
  
  // Generuj dane dla ostatnich 8 tygodni
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7)));
    const weekEnd = endOfWeek(weekStart);
    
    try {
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("start", ">=", weekStart),
        where("start", "<=", weekEnd),
        where("status", "==", "confirmed")
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      const appointments = appointmentsSnapshot.size;
      const revenue = appointmentsSnapshot.docs.reduce((total, doc) => {
        const appointment = doc.data();
        return total + (appointment.price || 0);
      }, 0);
      
      trends.push({
        week: `Tydzień ${8 - i}`,
        appointments,
        revenue,
      });
    } catch (error) {
      console.error(`Error fetching week ${8 - i} data:`, error);
      trends.push({
        week: `Tydzień ${8 - i}`,
        appointments: 0,
        revenue: 0,
      });
    }
  }
  
  return trends;
}

// Pobieranie statystyk dla raportów
export async function getReportStats(): Promise<ReportStats> {
  try {
    const dashboardStats = await getDashboardStats();
    const popularServices = await getPopularServices();
    
    const topServiceWeekly = popularServices.length > 0 ? popularServices[0] : null;
    const lowServiceWeekly = popularServices.length > 0 ? popularServices[popularServices.length - 1] : null;
    
    // Pobierz dane dla kwartalnych statystyk
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    
    const quarterAppointmentsQuery = query(
      collection(db, "appointments"),
      where("start", ">=", quarterStart),
      where("start", "<=", quarterEnd),
      where("status", "==", "confirmed")
    );
    const quarterAppointmentsSnapshot = await getDocs(quarterAppointmentsQuery);
    
    // Zlicz usługi dla kwartalu
    const quarterlyServiceCounts = new Map();
    quarterAppointmentsSnapshot.docs.forEach(doc => {
      const appointment = doc.data();
      const serviceId = appointment.serviceId;
      quarterlyServiceCounts.set(serviceId, (quarterlyServiceCounts.get(serviceId) || 0) + 1);
    });
    
    // Znajdź najpopularniejszą usługę kwartalną
    const servicesSnapshot = await getDocs(collection(db, "services"));
    let topServiceQuarterly: { name: string; count: number } | null = null;
    
    servicesSnapshot.docs.forEach(doc => {
      const serviceId = doc.id;
      const serviceData = doc.data();
      const count = quarterlyServiceCounts.get(serviceId) || 0;
      
      if (!topServiceQuarterly || count > topServiceQuarterly.count) {
        topServiceQuarterly = {
          name: serviceData.name,
          count,
        };
      }
    });
    
    return {
      todayAppointments: dashboardStats.todayAppointments,
      occupancyRate: dashboardStats.occupancyRate,
      freeTime: dashboardStats.freeTime,
      topServiceWeekly: topServiceWeekly?.name || "Brak danych",
      topServiceWeeklyCount: topServiceWeekly?.count || 0,
      lowServiceWeekly: lowServiceWeekly?.name || "Brak danych",
      lowServiceWeeklyCount: lowServiceWeekly?.count || 0,
      topServiceQuarterly: topServiceQuarterly?.name || "Brak danych",
      topServiceQuarterlyCount: topServiceQuarterly?.count || 0,
    };
  } catch (error) {
    console.error("Error fetching report stats:", error);
    return {
      todayAppointments: 0,
      occupancyRate: 0,
      freeTime: "0h 0m",
      topServiceWeekly: "Brak danych",
      topServiceWeeklyCount: 0,
      lowServiceWeekly: "Brak danych",
      lowServiceWeeklyCount: 0,
      topServiceQuarterly: "Brak danych",
      topServiceQuarterlyCount: 0,
    };
  }
}