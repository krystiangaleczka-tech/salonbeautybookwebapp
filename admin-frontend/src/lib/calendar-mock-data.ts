import type { ToneKey } from "@/lib/dashboard-theme";

export type CalendarStatus = "confirmed" | "pending" | "no-show" | "cancelled";

export interface CalendarService {
  id: string;
  name: string;
  durationMin: number;
  noParallel?: boolean;
  bufferAfterMin?: number;
  tone: ToneKey;
}

export interface CalendarEvent {
  id: string;
  serviceId: string;
  clientName: string;
  staffName: string;
  start: string; // ISO string
  end: string; // ISO string
  status: CalendarStatus;
  price?: string;
  offline?: boolean;
  notes?: string;
}

export interface WorkingHours {
  start: string; // HH:mm
  end: string; // HH:mm
}

export type WeeklyHours = Record<number, WorkingHours | null>; // 0 (Sunday) - 6 (Saturday)

export const calendarServices: CalendarService[] = [
  {
    id: "pedicure-classic",
    name: "Pedicure klasyczny",
    durationMin: 60,
    noParallel: true,
    bufferAfterMin: 10,
    tone: "chart5",
  },
  {
    id: "podology-treatment",
    name: "Zabieg podologiczny",
    durationMin: 70,
    noParallel: true,
    bufferAfterMin: 15,
    tone: "chart3",
  },
  {
    id: "face-cleansing",
    name: "Oczyszczanie twarzy",
    durationMin: 60,
    tone: "primary",
  },
  {
    id: "microdermabrasion",
    name: "Mikrodermabrazja",
    durationMin: 50,
    tone: "chart4",
  },
  {
    id: "brows-henna",
    name: "Henna brwi",
    durationMin: 30,
    tone: "chart4",
  },
  {
    id: "depilation",
    name: "Depilacja",
    durationMin: 45,
    tone: "accent",
  },
  {
    id: "upper-lip",
    name: "Wąsik",
    durationMin: 20,
    tone: "chart3",
  },
  {
    id: "manicure-hybrid",
    name: "Manicure hybrydowy",
    durationMin: 45,
    tone: "primary",
  },
];

export const baseSalonHours: WeeklyHours = {
  0: null,
  1: { start: "09:00", end: "17:00" },
  2: { start: "09:00", end: "17:00" },
  3: { start: "09:00", end: "17:00" },
  4: { start: "09:00", end: "17:30" },
  5: { start: "10:00", end: "16:00" },
  6: null,
};

export const dailyOverrides: Record<string, WorkingHours> = {
  "2024-01-17": { start: "11:00", end: "17:00" },
  "2024-01-18": { start: "09:00", end: "15:00" },
};

export const calendarEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    serviceId: "pedicure-classic",
    clientName: "Anna Kowalska",
    staffName: "Maja Flak",
    start: "2024-01-15T09:00:00",
    end: "2024-01-15T10:10:00",
    status: "confirmed",
    
  },
  {
    id: "evt-2",
    serviceId: "manicure-hybrid",
    clientName: "Karolina Nowak",
    staffName: "Ilona Flak",
    start: "2024-01-15T10:30:00",
    end: "2024-01-15T11:20:00",
    status: "pending",
    
  },
  {
    id: "evt-3",
    serviceId: "pedicure-classic",
    clientName: "Ewa Lis",
    staffName: "Maja Flak",
    start: "2024-01-15T11:00:00",
    end: "2024-01-15T12:15:00",
    status: "pending",
    
  },
  {
    id: "evt-4",
    serviceId: "face-cleansing",
    clientName: "Magda Zając",
    staffName: "Agnieszka Nowicka",
    start: "2024-01-15T13:00:00",
    end: "2024-01-15T14:00:00",
    status: "confirmed",
    price: "210 zł",
  },
  {
    id: "evt-5",
    serviceId: "brows-henna",
    clientName: "Olga Baran",
    staffName: "Ilona Flak",
    start: "2024-01-16T09:30:00",
    end: "2024-01-16T10:10:00",
    status: "confirmed",
    price: "85 zł",
  },
  {
    id: "evt-6",
    serviceId: "pedicure-classic",
    clientName: "Dorota Król",
    staffName: "Maja Flak",
    start: "2024-01-16T11:30:00",
    end: "2024-01-16T12:45:00",
    status: "cancelled",
    price: "0 zł",
  },
  {
    id: "evt-7",
    serviceId: "manicure-hybrid",
    clientName: "Zuzanna Klimek",
    staffName: "Ilona Flak",
    start: "2024-01-17T12:00:00",
    end: "2024-01-17T12:45:00",
    status: "no-show",
    
  },
  {
    id: "evt-8",
    serviceId: "pedicure-classic",
    clientName: "Karolina Duda",
    staffName: "Maja Flak",
    start: "2024-01-17T09:00:00",
    end: "2024-01-17T10:15:00",
    status: "confirmed",
    price: "170 zł",
  },
  {
    id: "evt-9",
    serviceId: "manicure-hybrid",
    clientName: "Natalia Pawlak",
    staffName: "Ilona Flak",
    start: "2024-01-17T10:30:00",
    end: "2024-01-17T11:20:00",
    status: "pending",
    
  },
  {
    id: "evt-10",
    serviceId: "depilation",
    clientName: "Weronika Drwal",
    staffName: "Agnieszka Nowicka",
    start: "2024-01-17T15:00:00",
    end: "2024-01-17T15:45:00",
    status: "confirmed",
    price: "140 zł",
  },
  {
    id: "evt-11",
    serviceId: "brows-shaping",
    clientName: "Paulina Róg",
    staffName: "Ilona Flak",
    start: "2024-01-18T09:15:00",
    end: "2024-01-18T10:00:00",
    status: "confirmed",
    price: "95 zł",
  },
  {
    id: "evt-12",
    serviceId: "manicure-hybrid",
    clientName: "Ilona Mazur",
    staffName: "Ilona Flak",
    start: "2024-01-18T11:30:00",
    end: "2024-01-18T12:15:00",
    status: "pending",
    price: "125 zł",
  },
  {
    id: "evt-13",
    serviceId: "pedicure-classic",
    clientName: "Monika Żuk",
    staffName: "Maja Flak",
    start: "2024-01-18T12:00:00",
    end: "2024-01-18T13:15:00",
    status: "pending",
    price: "165 zł",
  },
  {
    id: "evt-14",
    serviceId: "microdermabrasion",
    clientName: "Kamila Wrona",
    staffName: "Agnieszka Nowicka",
    start: "2024-01-18T14:30:00",
    end: "2024-01-18T15:45:00",
    status: "confirmed",
    price: "210 zł",
  },
  {
    id: "evt-15",
    serviceId: "pedicure-classic",
    clientName: "Oliwia Bąk",
    staffName: "Maja Flak",
    start: "2024-01-19T09:00:00",
    end: "2024-01-19T10:10:00",
    status: "confirmed",
    price: "155 zł",
  },
  {
    id: "evt-16",
    serviceId: "manicure-hybrid",
    clientName: "Justyna Czarnecka",
    staffName: "Ilona Flak",
    start: "2024-01-19T10:30:00",
    end: "2024-01-19T11:15:00",
    status: "confirmed",
    price: "115 zł",
  },
  {
    id: "evt-17",
    serviceId: "pedicure-classic",
    clientName: "Lena Jurek",
    staffName: "Maja Flak",
    start: "2024-01-19T11:00:00",
    end: "2024-01-19T12:20:00",
    status: "pending",
    
  },
  {
    id: "evt-18",
    serviceId: "upper-lip",
    clientName: "Sara Legutko",
    staffName: "Ilona Flak",
    start: "2024-01-19T13:30:00",
    end: "2024-01-19T13:50:00",
    status: "pending",
    price: "45 zł",
  },
  {
    id: "evt-19",
    serviceId: "face-cleansing",
    clientName: "Martyna Łoś",
    staffName: "Agnieszka Nowicka",
    start: "2024-01-19T15:00:00",
    end: "2024-01-19T16:15:00",
    status: "confirmed",
    price: "220 zł",
  },
  {
    id: "evt-20",
    serviceId: "pedicure-classic",
    clientName: "Helena Michalak",
    staffName: "Maja Flak",
    start: "2024-01-20T09:30:00",
    end: "2024-01-20T10:40:00",
    status: "confirmed",
    
  },
  {
    id: "evt-21",
    serviceId: "manicure-hybrid",
    clientName: "Karina Niedźwiedź",
    staffName: "Ilona Flak",
    start: "2024-01-20T11:00:00",
    end: "2024-01-20T11:45:00",
    status: "confirmed",
    price: "110 zł",
  },
  {
    id: "evt-22",
    serviceId: "brows-shaping",
    clientName: "Jolanta Ozga",
    staffName: "Ilona Flak",
    start: "2024-01-20T12:00:00",
    end: "2024-01-20T12:40:00",
    status: "pending",
    price: "88 zł",
  },
  {
    id: "evt-23",
    serviceId: "podology-treatment",
    clientName: "Beata Parol",
    staffName: "Agnieszka Nowicka",
    start: "2024-01-20T13:30:00",
    end: "2024-01-20T14:45:00",
    status: "pending",
    price: "255 zł",
  },
  {
    id: "evt-24",
    serviceId: "pedicure-classic",
    clientName: "Nina Rataj",
    staffName: "Maja Flak",
    start: "2024-01-21T09:00:00",
    end: "2024-01-21T10:15:00",
    status: "confirmed",
    price: "165 zł",
  },
  {
    id: "evt-25",
    serviceId: "manicure-hybrid",
    clientName: "Aneta Starczewska",
    staffName: "Ilona Flak",
    start: "2024-01-21T10:30:00",
    end: "2024-01-21T11:20:00",
    status: "pending",
    price: "118 zł",
  },
];
