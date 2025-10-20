'use client';

import { useEffect, useMemo, useState, useTransition, useRef, useCallback } from "react";
import {
  AlarmClock,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
  Filter,
  Download,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { ToneKey } from "@/lib/dashboard-theme";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, Timestamp, getDoc, doc, serverTimestamp } from "firebase/firestore";
import { createAppointment, subscribeToAppointments, getAppointments, updateAppointment, deleteAppointment, updateGoogleCalendarEventId, type Appointment } from "@/lib/appointments-service";
import { subscribeToCustomers, type Customer } from "@/lib/customers-service";
import { subscribeToEmployees, type Employee } from "@/lib/employees-service";
import { usePendingTimeChanges } from "@/hooks/usePendingTimeChanges";
import { useEmployee } from "@/contexts/employee-context";
import { EmployeeSelector } from "@/components/calendar/employee-selector";
import { AppointmentFilters } from "@/components/calendar/appointment-filters";
import { type AppointmentFilter, type FilterPreset } from "@/lib/filters-service";
import { googleCalendarService } from "@/lib/google-calendar-service";
import {
    generateTempId,
    isOptimistic,
    replaceOptimistic,
    removeOptimistic,
    type OptimisticAppointment,
} from "@/lib/optimistic-updates";

type CalendarStatus = "confirmed" | "pending" | "no-show" | "cancelled";

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
  googleCalendarEventId?: string; // ID wydarzenia w Google Calendar
  isGoogleSynced?: boolean; // Czy wydarzenie jest zsynchronizowane z Google Calendar
}

export interface WorkingHours {
  start: string; // HH:mm
  end: string; // HH:mm
}

export type WeeklyHours = Record<number, WorkingHours | null>;

const baseSalonHours: WeeklyHours = {
  0: { start: "10:00", end: "16:00" }, // Niedziela - skrócone godziny
  1: { start: "09:00", end: "17:00" }, // Poniedziałek
  2: { start: "09:00", end: "17:00" }, // Wtorek
  3: { start: "09:00", end: "17:00" }, // Środa
  4: { start: "09:00", end: "17:30" }, // Czwartek
  5: { start: "10:00", end: "16:00" }, // Piątek
  6: null, // Sobota - zamknięte
};

const dailyOverrides: Record<string, WorkingHours> = {
  "2024-01-17": { start: "11:00", end: "17:00" },
  "2024-01-18": { start: "09:00", end: "15:00" },
};

// ✅ POPRAWIONE - Uniwersalna konwersja Timestamp do Date
function timestampToDate(value: unknown): Date {
  if (!value) {
    return new Date();
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    return new Date(value);
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as Timestamp).toDate();
  }

  return new Date();
}

// ✅ Porównanie czy dwie daty są tego samego dnia (LOKALNY czas)
function isSameLocalDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// ✅ Konwersja do ISO string dla WYŚWIETLANIA (zachowaj dla kompatybilności)
function toIsoString(value: unknown): string {
  const date = timestampToDate(value);
  return date.toISOString();
}

function toCalendarStatus(value: unknown): CalendarStatus {
  const candidate = typeof value === "string" ? value : "";
  if (candidate === "confirmed" || candidate === "pending" || candidate === "no-show" || candidate === "cancelled") {
    return candidate;
  }
  return "pending";
}

function formatPrice(value: unknown): string | undefined {
  if (typeof value === "number") {
    return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return undefined;
}

const VIEW_OPTIONS = [
  { value: "day", label: "Dzień", icon: CalendarDays },
  { value: "week", label: "Tydzień", icon: CalendarRange },
  { value: "month", label: "Miesiąc", icon: LayoutList },
] as const;

const STATUS_CLASSNAME: Record<CalendarStatus, { badge: string; border: string }> = {
  confirmed: {
    badge: "bg-emerald-600 text-emerald-50",
    border: "border-emerald-500",
  },
  pending: {
    badge: "bg-amber-500 text-amber-950",
    border: "border-amber-500",
  },
  "no-show": {
    badge: "bg-rose-500 text-rose-50",
    border: "border-rose-500",
  },
  cancelled: {
    badge: "bg-rose-200 text-rose-700",
    border: "border-rose-300",
  },
};

interface TimeRange {
  start: number;
  end: number;
}

interface PositionedEvent extends CalendarEvent {
  top: number;
  height: number;
  isOutsideWorkingHours: boolean;
  hasConflict: boolean;
  serviceName: string;
}

// ✅ POPRAWIONE - używaj lokalnej daty, nie UTC
function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function compactText(value: string, maxLength: number) {
  return value.replace(/\s+/g, "").toLowerCase().slice(0, maxLength);
}

// ✅ POPRAWIONE - używaj timestampToDate zamiast new Date(iso)
function parseIsoDate(iso: string) {
  return timestampToDate(iso);
}

function startOfWeek(date: Date) {
  const cloned = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = cloned.getDay();
  const diff = (day + 6) % 7; // convert to Monday-start
  cloned.setDate(cloned.getDate() - diff);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number) {
  const cloned = new Date(date);
  cloned.setDate(cloned.getDate() + days);
  return cloned;
}

function addWeeks(date: Date, weeks: number) {
  return addDays(date, weeks * 7);
}

function addMonths(date: Date, months: number) {
  const cloned = new Date(date);
  cloned.setMonth(cloned.getMonth() + months);
  return cloned;
}

function timeStringToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesSinceStartOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTimeRange(start: Date, end: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

function getWorkingWindow(day: Date, selectedEmployee?: Employee): WorkingHours | null {
  const override = dailyOverrides[toDateKey(day)];
  if (override) {
    return override;
  }
  
  // Jeśli wybrano pracownika i ma zdefiniowane godziny pracy, użyj ich
  if (selectedEmployee && selectedEmployee.workingHours && selectedEmployee.workingHours.length > 0) {
    const dayOfWeek = day.getDay();
    const employeeWorkingHours = selectedEmployee.workingHours.find(
      (wh: any) => wh.dayOfWeek === dayOfWeek && wh.isActive
    );
    
    if (employeeWorkingHours) {
      return {
        start: employeeWorkingHours.startTime,
        end: employeeWorkingHours.endTime
      };
    }
  }
  
  // W przeciwnym razie użyj globalnych godzin salonu
  const base = baseSalonHours[day.getDay()];
  return base ?? null;
}

function buildEventsForRange(
  events: CalendarEvent[],
  weekStart: Date,
  services: CalendarService[],
  minutesWindow: TimeRange,
  selectedEmployee?: Employee
) {
  const pedicureIds = new Set(services.filter((service) => service.noParallel).map((service) => service.id));
  const serviceLookup = new Map(services.map((service) => [service.id, service]));

  const eventsInRange = events.filter((event) => {
    const start = timestampToDate(event.start); // ✅ Użyj timestampToDate zamiast parseIsoDate
    return start >= weekStart && start < addDays(weekStart, 7);
  });

  const conflicts = new Set<string>();
  const pedicureEvents = eventsInRange
    .filter((event) => pedicureIds.has(event.serviceId))
    .sort((a, b) => parseIsoDate(a.start).getTime() - parseIsoDate(b.start).getTime());

  for (let i = 0; i < pedicureEvents.length; i += 1) {
    for (let j = i + 1; j < pedicureEvents.length; j += 1) {
      const first = pedicureEvents[i];
      const second = pedicureEvents[j];
      const firstDay = toDateKey(parseIsoDate(first.start));
      const secondDay = toDateKey(parseIsoDate(second.start));
      if (firstDay !== secondDay) {
        break;
      }
      const firstStart = parseIsoDate(first.start).getTime();
      const firstEnd = parseIsoDate(first.end).getTime();
      const secondStart = parseIsoDate(second.start).getTime();
      const secondEnd = parseIsoDate(second.end).getTime();
      const overlap = firstStart < secondEnd && secondStart < firstEnd;
      if (overlap) {
        conflicts.add(first.id);
        conflicts.add(second.id);
      }
    }
  }

  const positioned: PositionedEvent[] = eventsInRange.map((event) => {
    const start = parseIsoDate(event.start);
    const end = parseIsoDate(event.end);
    const minutesStart = minutesSinceStartOfDay(start) - minutesWindow.start;
    const minutesEnd = minutesSinceStartOfDay(end) - minutesWindow.start;
    const top = Math.max(0, minutesStart);
    const height = Math.max(30, minutesEnd - minutesStart);
    const workingWindow = getWorkingWindow(start, selectedEmployee);
    const isOutsideWorkingHours = workingWindow
      ? minutesSinceStartOfDay(start) < timeStringToMinutes(workingWindow.start) ||
        minutesSinceStartOfDay(end) > timeStringToMinutes(workingWindow.end)
      : true;
    const hasConflict = conflicts.has(event.id);
    const serviceName = serviceLookup.get(event.serviceId)?.name ?? event.serviceId;

    return {
      ...event,
      top,
      height,
      isOutsideWorkingHours,
      hasConflict,
      serviceName,
    };
  });

  return positioned;
}

function useWeek(date: Date) {
  return useMemo(() => {
    const start = startOfWeek(date);
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
    return { start, days };
  }, [date]);
}

function useMonth(date: Date) {
  return useMemo(() => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = [] as Date[];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return { start, end, days };
  }, [date]);
}

const minutesWindow: TimeRange = {
  start: 6 * 60,
  end: 22 * 60,
};

const PIXELS_PER_MINUTE = 1;
const DAY_PIXELS_PER_MINUTE = 4.5;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function buildHorizontalPositions(events: PositionedEvent[]) {
  return events.map((event) => {
    const start = parseIsoDate(event.start);
    const end = parseIsoDate(event.end);
    const left = (minutesSinceStartOfDay(start) - minutesWindow.start) * DAY_PIXELS_PER_MINUTE;
    const width = Math.max(90, (minutesSinceStartOfDay(end) - minutesSinceStartOfDay(start)) * DAY_PIXELS_PER_MINUTE);

    return {
      ...event,
      left,
      width,
    };
  });
}

type HorizontalEvent = ReturnType<typeof buildHorizontalPositions>[number];

const PULSE_SHADOW_ANIMATION = `
  @keyframes pulse-shadow-inset {
    0% {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 0 0 0 rgba(252, 165, 165, 0.1);
    }
    75% {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 0 8px 8px rgba(252, 165, 165, 0.3);
    }
    100% {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -5px rgba(0, 0, 0, 0.05), inset 0 0 2px 2px rgba(252, 165, 165, 0.1);
    }
  }
  
  .hover-pulse-shadow:hover {
    animation: pulse-shadow-inset 2.5s infinite;
  }
`;

function WeekBoard({
  weekDays,
  events,
  selectedDate,
  onSelectDate,
  selectedEmployee,
}: {
  weekDays: Date[];
  events: PositionedEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  selectedEmployee?: Employee;
}) {
  const hours = useMemo(() => {
    const range: number[] = [];
    const startHour = Math.floor(minutesWindow.start / 60);
    const endHour = Math.ceil(minutesWindow.end / 60);
    for (let hour = startHour; hour <= endHour; hour += 1) {
      range.push(hour);
    }
    return range;
  }, []);

  const workingWindows = useMemo(() => {
    const entries = new Map<string, WorkingHours | null>();
    weekDays.forEach((day) => {
      entries.set(toDateKey(day), getWorkingWindow(day, selectedEmployee));
    });
    return entries;
  }, [weekDays, selectedEmployee]);

  return (
    <div className="rounded-3xl border border-[#f2dcd4] bg-[#f8f3ec] p-2 sm:p-4">
      <div className="flex gap-2 sm:gap-4">
        <div className="w-10 sm:w-14 shrink-0 text-right text-xs font-semibold text-muted-foreground">
          {hours.map((hour) => (
            <div key={hour} className="flex h-[40px] sm:h-[60px] items-start justify-end pr-1 sm:pr-2">
              <span className="hidden sm:inline">{hour.toString().padStart(2, "0")}:00</span>
              <span className="sm:hidden text-[10px]">{hour.toString().padStart(2, "0")}</span>
            </div>
          ))}
        </div>
        <div className="relative grid flex-1 grid-cols-7 gap-1 sm:gap-3">
          {weekDays.map((day) => {
            const key = toDateKey(day);
            const window = workingWindows.get(key);
            const selected = toDateKey(selectedDate) === key;
            const dayEvents = events.filter((event) => {
              const eventDate = timestampToDate(event.start); // ✅ Użyj timestampToDate
              return isSameLocalDay(eventDate, day); // ✅ Użyj isSameLocalDay
            });
            const workingStart = window ? timeStringToMinutes(window.start) - minutesWindow.start : null;
            const workingEnd = window ? timeStringToMinutes(window.end) - minutesWindow.start : null;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDate(day)}
                className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border p-1 sm:p-2 text-left transition-colors ${
                  selected ? "border-primary bg-[#fdf7f3]" : "border-transparent bg-[#fdf7f3]/70 hover:border-primary/40"
                }`}
              >
                <div className="mb-1 sm:mb-2 flex items-center justify-between text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="hidden sm:inline">
                    {day.toLocaleDateString("pl-PL", { weekday: "short" })}
                  </span>
                  <span className="sm:hidden text-[9px]">
                    {day.toLocaleDateString("pl-PL", { weekday: "short" }).slice(0, 2)}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-foreground">
                    {day.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}
                  </span>
                </div>

                <div className="relative h-[640px] sm:h-[960px]">
                  <div className="absolute inset-0 grid grid-rows-[repeat(16,40px_sm:60px)]">
                    {hours.slice(0, -1).map((hour, index) => (
                      <div key={`${key}-grid-${hour}`} className="border-t border-[#ead9d1]/70" style={{ gridRow: index + 1 }} />
                    ))}
                  </div>

                  <div className="absolute inset-0 bg-[#e7d7ff]/30" />
                  {workingStart !== null && workingEnd !== null ? (
                    <div
                      className="absolute left-0 right-0 rounded-xl bg-[#ffc7d3]/60"
                      style={{
                        top: Math.max(0, workingStart * PIXELS_PER_MINUTE),
                        height: Math.max(40, (workingEnd - workingStart) * PIXELS_PER_MINUTE),
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 rounded-xl bg-muted/60" />
                  )}

                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`absolute inset-x-1 sm:inset-x-2 flex h-full flex-col justify-between overflow-hidden rounded-lg sm:rounded-xl border bg-card p-1 sm:p-2 shadow-lg transition-all hover-pulse-shadow ${
                        STATUS_CLASSNAME[event.status].border
                      } ${event.isOutsideWorkingHours ? "ring-1 sm:ring-2 ring-amber-400" : ""} ${
                        (event as any)._optimistic ? "opacity-70 animate-pulse" : ""
                      }`}
                      style={{
                        top: Math.max(0, event.top * PIXELS_PER_MINUTE),
                        height: Math.max(40, event.height * PIXELS_PER_MINUTE),
                      }}
                    >
                      <div className="flex items-center justify-between text-[8px] sm:text-[10px] uppercase text-muted-foreground">
                        <span className="hidden sm:inline">{formatTimeRange(parseIsoDate(event.start), parseIsoDate(event.end))}</span>
                        <span className="sm:hidden text-[7px]">{formatTimeRange(parseIsoDate(event.start), parseIsoDate(event.end)).replace(" – ", "-")}</span>
                        <div className="flex items-center gap-1">
                          {event.isGoogleSynced && (
                            <div className="h-2 w-2 rounded-full bg-blue-500" title="Zsynchronizowano z Google Calendar" />
                          )}
                          <span className={`h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full ${
                            event.status === "confirmed"
                              ? "bg-emerald-500"
                              : event.status === "pending"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`} />
                        </div>
                      </div>
                      <div className="mt-0.5 sm:mt-1 space-y-0.5">
                        <p className="text-[9px] sm:text-[11px] font-semibold lowercase text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                          {compactText(event.clientName, 4)}
                        </p>
                        <p className="text-[8px] sm:text-[10px] lowercase text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block">
                          {compactText(event.serviceName, 7)}
                        </p>
                      </div>
                      {event.hasConflict ? (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 rounded-b-lg sm:rounded-b-xl bg-rose-500" title="Pedicure nie może się nakładać" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayBoard({
  date,
  events,
  onSelectAppointment,
  selectedAppointmentId,
  selectedEmployee,
}: {
  date: Date;
  events: PositionedEvent[];
  onSelectAppointment: (appointmentId: string) => void;
  selectedAppointmentId: string;
  selectedEmployee?: Employee;
}) {
  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number; showLabel: boolean }[] = [];
    const startHour = Math.floor(minutesWindow.start / 60);
    const endHour = Math.ceil(minutesWindow.end / 60);
    
    for (let hour = startHour; hour <= endHour; hour += 1) {
      // Dodaj podziałki co 15 minut
      for (let minute = 0; minute < 60; minute += 15) {
        // Pokaż etykietę tylko dla pełnych godzin (00 minut) i pół godzin (30 minut)
        const showLabel = minute === 0 || minute === 30;
        slots.push({ hour, minute, showLabel });
      }
    }
    
    // Usuń ostatnią podziałkę, jeśli jest poza zakresem
    if (slots.length > 0) {
      const lastSlot = slots[slots.length - 1];
      const lastSlotMinutes = lastSlot.hour * 60 + lastSlot.minute;
      if (lastSlotMinutes >= minutesWindow.end) {
        slots.pop();
      }
    }
    
    return slots;
  }, []);

  const timelineWidth = (minutesWindow.end - minutesWindow.start) * DAY_PIXELS_PER_MINUTE;
  const hourWidth = 60 * DAY_PIXELS_PER_MINUTE;
  const workingWindow = getWorkingWindow(date, selectedEmployee);
  const workingLeft = workingWindow
    ? clamp((timeStringToMinutes(workingWindow.start) - minutesWindow.start) * DAY_PIXELS_PER_MINUTE, 0, timelineWidth)
    : 0;
  const workingWidth = workingWindow
    ? clamp((timeStringToMinutes(workingWindow.end) - timeStringToMinutes(workingWindow.start)) * DAY_PIXELS_PER_MINUTE, 0, timelineWidth)
    : timelineWidth;

  const horizontalEvents = useMemo(() => buildHorizontalPositions(events), [events]);

  const dayViewRef = useRef<HTMLDivElement>(null);
  const previousDateRef = useRef<string>("");
  const isScrollingToFirstEventRef = useRef<boolean>(false);
  
  // Przewijanie do pierwszej wizyty dnia po zmianie daty
  useEffect(() => {
    const currentDateString = date.toISOString().slice(0, 10);
    
    // Sprawdź, czy data faktycznie się zmieniła
    if (previousDateRef.current !== currentDateString && dayViewRef.current && events.length > 0 && !isScrollingToFirstEventRef.current) {
      // Ustaw flagę, aby zapobiec wielokrotnemu przewijaniu
      isScrollingToFirstEventRef.current = true;
      
      // Znajdź pierwszą wizytę dnia
      const firstEvent = events.sort((a, b) =>
        parseIsoDate(a.start).getTime() - parseIsoDate(b.start).getTime()
      )[0];
      
      if (firstEvent) {
        // Znajdź element pierwszej wizyty w DOM
        const firstEventElement = dayViewRef.current?.querySelector(`[data-event-id="${firstEvent.id}"]`);
        
        if (firstEventElement) {
          // Użyj scrollIntoView z smooth TYLKO dla automatycznego przewijania
          firstEventElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'start'
          });
          
          // Zresetuj flagę po zakończeniu animacji (zwykle ~500-1000ms)
          setTimeout(() => {
            isScrollingToFirstEventRef.current = false;
          }, 1000);
        } else {
          // Fallback: oblicz pozycję przewijania jeśli element nie został znaleziony
          const startTime = parseIsoDate(firstEvent.start);
          const startMinutes = minutesSinceStartOfDay(startTime);
          const scrollPosition = (startMinutes - minutesWindow.start) * DAY_PIXELS_PER_MINUTE;
          
          setTimeout(() => {
            dayViewRef.current?.scrollTo({
              left: scrollPosition,
              behavior: "smooth"
            });
            
            setTimeout(() => {
              isScrollingToFirstEventRef.current = false;
            }, 1000);
          }, 100);
        }
      }
      
      // Zaktualizuj poprzednią datę
      previousDateRef.current = currentDateString;
    }
  }, [date, events]);
  
  // Obsługa przewijania poziomego kółkiem myszy
  useEffect(() => {
    const container = dayViewRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Resetuj flagę przy ręcznym przewijaniu
      if (isScrollingToFirstEventRef.current) {
        isScrollingToFirstEventRef.current = false;
      }

      // Rozróżnij touchpad (deltaMode = 0, małe wartości) od kółka myszy (deltaMode = 1 lub większe wartości)
      const isTouchpad = e.deltaMode === 0 && Math.abs(e.deltaY) < 50;
      
      // Dla touchpada: pozwól na natywne przewijanie (NIE używaj preventDefault)
      if (isTouchpad) {
        return; // Nie ingeruj w touchpad
      }

      // Tylko dla kółka myszy: przechwytuj i konwertuj na poziome przewijanie
      if (e.deltaY !== 0) {
        e.preventDefault();
        
        // Dla kółka myszy użyj requestAnimationFrame dla płynności
        requestAnimationFrame(() => {
          container.scrollLeft += e.deltaY;
        });
      }
    };

    // WAŻNE: { passive: false } pozwala na preventDefault()
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);
  
  return (
    <div className="rounded-3xl border border-[#f2dcd4] bg-[#fdf7f3] p-2 sm:p-4 min-h-[400px] sm:min-h-[640px]">
      <div className="flex flex-col gap-2 sm:gap-4">
        <div className="text-xs sm:text-sm font-semibold text-foreground">
          <span className="hidden sm:inline">
            {date.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span className="sm:hidden">
            {date.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}
          </span>
        </div>
        <div
          className="overflow-auto"
          ref={dayViewRef}
        >
          <div className="min-w-full" style={{ minWidth: timelineWidth + 120, minHeight: 400 }}>
            <div className="pl-12 sm:pl-16">
              <div className="flex items-end gap-0 text-[9px] sm:text-[11px] uppercase text-muted-foreground" style={{ width: timelineWidth }}>
                {timeSlots.map((slot, index) => (
                  <div key={`${slot.hour}-${slot.minute}`} className="relative flex items-center justify-center" style={{ width: hourWidth / 4 }}>
                    {slot.showLabel && (
                      <span className="hidden sm:inline">{slot.hour.toString().padStart(2, "0")}:{slot.minute.toString().padStart(2, "0")}</span>
                    )}
                    {slot.showLabel && (
                      <span className="sm:hidden text-[8px]">{slot.hour.toString().padStart(2, "0")}:{slot.minute.toString().padStart(2, "0")}</span>
                    )}
                    {index < timeSlots.length - 1 ? (
                      <span className="absolute bottom-0 right-0 h-2 sm:h-3 w-px bg-[#ead9d1]" />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="relative mt-2 sm:mt-4 h-[400px] sm:h-[672px] rounded-xl sm:rounded-2xl border border-[#f2dcd4]/60 bg-[#fdf1eb]" style={{ width: timelineWidth }}>
                <div className="absolute inset-0">
                  <div className="absolute inset-y-0 rounded-2xl bg-[#e7d7ff]/30" />
                  <div
                    className="absolute inset-y-4 rounded-2xl bg-[#ffc7d3]/60"
                    style={{ left: workingLeft, width: workingWidth }}
                  />
                  {timeSlots.map((slot, index) => (
                    <div
                      key={`grid-${slot.hour}-${slot.minute}`}
                      className="absolute top-0 bottom-0 border-l border-dashed border-[#ead9d1]/80"
                      style={{ left: index * (hourWidth / 4) }}
                    />
                  ))}
                </div>

                {horizontalEvents.map((event) => (
                  <div
                    key={event.id}
                    data-event-id={event.id}
                    onClick={() => onSelectAppointment(event.id)}
                    className={`absolute top-8 sm:top-10 flex h-20 sm:h-24 w-36 sm:w-48 flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border bg-card p-2 sm:p-3 text-left text-xs shadow-lg transition-all cursor-pointer hover-pulse-shadow ${
                       STATUS_CLASSNAME[event.status].border
                     } ${event.isOutsideWorkingHours ? "ring-1 sm:ring-2 ring-amber-400" : ""} ${
                       selectedAppointmentId === event.id
                         ? "bg-red-50 border-red-400 shadow-[inset_0_1px_3px_rgba(239,68,68,0.2)]"
                         : ""
                     } ${(event as any)._optimistic ? "opacity-70 animate-pulse" : ""}`}
                    style={{
                      left: clamp(event.left, 0, Math.max(0, timelineWidth - 120)),
                      width: clamp(event.width, 80, 150),
                    }}
                  >
                    <div className="flex items-center justify-between text-[8px] sm:text-[10px] uppercase text-muted-foreground">
                      <span className="hidden sm:inline">{formatTimeRange(parseIsoDate(event.start), parseIsoDate(event.end))}</span>
                      <span className="sm:hidden text-[7px]">{formatTimeRange(parseIsoDate(event.start), parseIsoDate(event.end)).replace(" – ", "-")}</span>
                      <div className="flex items-center gap-1">
                        {event.isGoogleSynced && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" title="Zsynchronizowano z Google Calendar" />
                        )}
                        <span className={`h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full ${
                          event.status === "confirmed"
                            ? "bg-emerald-500"
                            : event.status === "pending"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`} />
                      </div>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[9px] sm:text-[11px] font-semibold lowercase text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                        {compactText(event.clientName, 4)}
                      </p>
                      <p className="text-[8px] sm:text-[10px] lowercase text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block">
                        {compactText(event.serviceName, 7)}
                      </p>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block">
                        {event.staffName}
                      </p>
                    </div>
                    {event.hasConflict ? (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 sm:h-1 rounded-b-xl bg-rose-500" title="Pedicure nie może się nakładać" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayAgenda({
  events,
  onEditAppointment,
  onDeleteAppointment,
  onAdjustTime,
  onCommitTimeChange,
  onRevertChange,
  hasPendingChange,
  getPendingChange,
  selectedAppointmentId,
  onSelectAppointment
}: {
  events: PositionedEvent[];
  onEditAppointment: (event: CalendarEvent) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onAdjustTime: (appointmentId: string, minutesDelta: number) => void;
  onCommitTimeChange: (appointmentId: string) => void;
  onRevertChange: (appointmentId: string) => void;
  hasPendingChange: (appointmentId: string) => boolean;
  getPendingChange: (appointmentId: string) => any;
  selectedAppointmentId: string;
  onSelectAppointment: (appointmentId: string) => void;
}) {
  // Stan dla tooltipu
  const [tooltipAppointmentId, setTooltipAppointmentId] = useState<string | null>(null);
  return (
    <aside className="flex h-full flex-col gap-2 sm:gap-4 rounded-2xl sm:rounded-3xl border border-border bg-card/90 p-2 sm:p-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Wizyty dnia</h2>
        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Kliknij kartę, aby zobaczyć szczegóły i edytować.</p>
      </div>
      <div className="space-y-2 sm:space-y-3 overflow-y-auto pr-1 sm:pr-2">
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">
            Brak wizyt w wybranym dniu.
          </p>
        ) : null}
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectAppointment(event.id)}
            className={`relative flex w-full flex-col gap-1.5 sm:gap-2 rounded-2xl sm:rounded-3xl border px-3 py-2 sm:px-4 sm:py-3 text-left shadow-sm transition-all cursor-pointer hover-pulse-shadow ${
              STATUS_CLASSNAME[event.status].border
            } ${
              selectedAppointmentId === event.id
                ? "bg-red-50 border-red-400 shadow-[inset_0_1px_3px_rgba(239,68,68,0.2)]"
                : ""
            } ${(event as any)._optimistic ? "opacity-70 animate-pulse" : ""}`}
          >
            {/* Przyciski zatwierdzenia/cofania zmian w prawym górnym rogu */}
            {hasPendingChange(event.id) && (
              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 flex gap-1 z-10">
                {/* Przycisk zatwierdzenia - zielony ptaszek */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCommitTimeChange(event.id);
                    setTooltipAppointmentId(null);
                  }}
                  onMouseEnter={() => setTooltipAppointmentId(`commit-${event.id}`)}
                  onMouseLeave={() => setTooltipAppointmentId(null)}
                  className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition-all hover:bg-green-600 hover:scale-110 animate-pulse"
                  aria-label="Zatwierdź zmianę czasu"
                  title={`Zatwierdź zmianę: ${getPendingChange(event.id)?.minutesDelta > 0 ? '+' : ''}${getPendingChange(event.id)?.minutesDelta} min`}
                >
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                
                {/* Przycisk cofania - czerwona strzałka */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRevertChange(event.id);
                    setTooltipAppointmentId(null);
                  }}
                  onMouseEnter={() => setTooltipAppointmentId(`revert-${event.id}`)}
                  onMouseLeave={() => setTooltipAppointmentId(null)}
                  className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-all hover:bg-red-600 hover:scale-110"
                  aria-label="Cofnij zmianę czasu"
                  title="Cofnij zmianę"
                >
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            )}
            
            {/* Tooltip dla przycisku zatwierdzenia */}
            {tooltipAppointmentId === `commit-${event.id}` && (
              <div className="absolute top-8 sm:top-10 right-1.5 sm:right-2 z-20 rounded-md bg-gray-900 text-white text-[10px] sm:text-xs px-2 py-1 shadow-lg whitespace-nowrap">
                Zatwierdź zmianę: {getPendingChange(event.id)?.minutesDelta > 0 ? '+' : ''}{getPendingChange(event.id)?.minutesDelta} min
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
              </div>
            )}
            
            {/* Tooltip dla przycisku cofania */}
            {tooltipAppointmentId === `revert-${event.id}` && (
              <div className="absolute top-8 sm:top-10 right-8 sm:right-10 z-20 rounded-md bg-gray-900 text-white text-[10px] sm:text-xs px-2 py-1 shadow-lg whitespace-nowrap">
                Cofnij zmianę
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>{formatTimeRange(parseIsoDate(event.start), parseIsoDate(event.end))}</span>
              {event.price ? <span className="font-semibold text-foreground">{event.price}</span> : null}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1">
                {event.isGoogleSynced && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" title="Zsynchronizowano z Google Calendar" />
                )}
                <div
                  className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
                    event.status === "confirmed"
                      ? "bg-emerald-500"
                      : event.status === "pending"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">{event.clientName}</p>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{event.staffName}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{event.serviceName}</p>
            {event.hasConflict ? (
              <span className="text-[10px] sm:text-xs font-semibold text-rose-500">Konflikt: pedicure nakłada się w tym czasie.</span>
            ) : null}
            {event.isOutsideWorkingHours ? (
              <span className="text-[10px] sm:text-xs font-semibold text-amber-500">
                ⚠ Poza godzinami pracy – rozważ korektę grafiku.
              </span>
            ) : null}
            <div className="flex items-center justify-between mt-1.5 sm:mt-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onAdjustTime(event.id, -5)}
                  className="inline-flex items-center justify-center rounded-md border border-border bg-background px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs text-foreground transition hover:bg-accent"
                  title="Przesuń o 5 minut do tyłu"
                >
                  <span className="hidden sm:inline">-5 min</span>
                  <span className="sm:hidden">-5</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAdjustTime(event.id, 5)}
                  className="inline-flex items-center justify-center rounded-md border border-border bg-background px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs text-foreground transition hover:bg-accent"
                  title="Przesuń o 5 minut do przodu"
                >
                  <span className="hidden sm:inline">+5 min</span>
                  <span className="sm:hidden">+5</span>
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAppointment(event);
                  }}
                  className="inline-flex items-center justify-center rounded-md border p-1 sm:p-1.5 transition-transform hover:-translate-y-0.5 border-border text-foreground hover:bg-accent"
                  title="Edytuj wizytę"
                >
                  <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            </div>
            {hasPendingChange(event.id) && (
              <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-amber-600 font-medium">
                <span className="hidden sm:inline">Oczekująca zmiana: {getPendingChange(event.id)?.minutesDelta > 0 ? '+' : ''}{getPendingChange(event.id)?.minutesDelta} min</span>
                <span className="sm:hidden">Zmiana: {getPendingChange(event.id)?.minutesDelta > 0 ? '+' : ''}{getPendingChange(event.id)?.minutesDelta} min</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function ViewSwitcher({ value, onChange }: { value: typeof VIEW_OPTIONS[number]["value"]; onChange: (value: typeof VIEW_OPTIONS[number]["value"]) => void }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#f2dcd4] bg-[#fdf7f3] p-1 shadow-sm">
      {VIEW_OPTIONS.map(({ value: option, label, icon: Icon }) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-[#ffc7d3] text-foreground" : "text-muted-foreground hover:bg-[#ffe1e8]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function CalendarToolbar({
  onOpenAppointmentModal,
  onEditAppointment,
  onDeleteAppointment,
  selectedAppointmentId
}: {
  onOpenAppointmentModal: () => void;
  onEditAppointment: () => void;
  onDeleteAppointment: () => void;
  selectedAppointmentId: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5"
        onClick={onOpenAppointmentModal}
      >
        <Plus className="h-4 w-4" />
        Dodaj wizytę
      </button>
      <button
        className={`inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 ${
          selectedAppointmentId
            ? "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
            : "border-gray-300 text-gray-400 cursor-not-allowed"
        }`}
        onClick={onEditAppointment}
        disabled={!selectedAppointmentId}
        title={selectedAppointmentId ? "Edytuj zaznaczoną wizytę" : "Kliknij w wizytę, aby zaznaczyć"}
      >
        <Pencil className="h-4 w-4" />
        Edytuj
      </button>
      <button
        className={`inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 ${
          selectedAppointmentId
            ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            : "border-gray-300 text-gray-400 cursor-not-allowed"
        }`}
        onClick={onDeleteAppointment}
        disabled={!selectedAppointmentId}
        title={selectedAppointmentId ? "Usuń zaznaczoną wizytę" : "Kliknij w wizytę, aby zaznaczyć"}
      >
        <Trash2 className="h-4 w-4" />
        Usuń
      </button>
      <button className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
        <AlarmClock className="h-4 w-4" />
        Zmień godziny pracy
      </button>
    </div>
  );
}

export default function CalendarPage() {
  // Hook do zarządzania oczekującymi zmianami czasu
  const {
    addTimeChange,
    commitChange,
    revertChange,
    hasPendingChange,
    getPendingChange
  } = usePendingTimeChanges();
  // Hook do zarządzania pracownikami z uprawnieniami
  const { 
    currentEmployee, 
    filteredEmployees, 
    canViewAllEmployees,
    isLoading: employeesLoading 
  } = useEmployee();

  // Funkcja do poprawnego tworzenia daty w lokalnej strefie czasowej
  function createLocalDate(dateString: string, timeString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Tworzymy datę w lokalnej strefie czasowej
    // Miesiące w JavaScript są numerowane od 0 (styczeń = 0)
    return new Date(year, month - 1, day, hours, minutes);
  }
  // Stan dla selektora pracowników
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(
    currentEmployee?.id
  );

  // Funkcja do szybkiej korekty czasu wizyty - teraz używa stanu lokalnego
  const adjustAppointmentTime = (appointmentId: string, minutesDelta: number) => {
    // Znajdź wizytę w kalendarzu
    const appointment = calendarEvents.find(event => event.id === appointmentId);
    if (!appointment) {
      setAppointmentFormError("Nie znaleziono wizyty.");
      return;
    }

    // Pobierz oryginalny czas rozpoczęcia i zakończenia
    const originalStart = timestampToDate(appointment.start);
    const originalEnd = timestampToDate(appointment.end);
    
    // Sprawdź, czy już istnieje oczekująca zmiana dla tej wizyty
    const existingChange = getPendingChange(appointmentId);
    
    if (existingChange) {
      // Jeśli istnieje zmiana, zaktualizuj ją
      addTimeChange(appointmentId, minutesDelta, {
        start: existingChange.originalStart,
        end: existingChange.originalEnd,
        serviceId: existingChange.serviceId,
        clientId: existingChange.clientId,
        staffName: existingChange.staffName,
        status: existingChange.status,
        notes: existingChange.notes,
        price: existingChange.price
      });
    } else {
      // W przeciwnym razie utwórz nową zmianę
      addTimeChange(appointmentId, minutesDelta, {
        start: originalStart,
        end: originalEnd,
        serviceId: appointment.serviceId,
        clientId: appointment.clientId || customers.find(c => c.fullName === appointment.clientName)?.id || "",
        staffName: appointment.staffName,
        status: appointment.status as any,
        notes: appointment.notes
      });
    }
    
    setAppointmentFormSuccess(`Czas wizyty został ${minutesDelta > 0 ? 'przesunięty do przodu' : 'przesunięty do tyłu'} o ${Math.abs(minutesDelta)} minut. Zatwierdź zmiany, aby zapisać w bazie danych.`);
    
    // Wyczyść komunikat po 3 sekundach (dłużej, bo trzeba zatwierdzić)
    setTimeout(() => {
      setAppointmentFormSuccess(null);
    }, 3000);
  };

  // Funkcja do zatwierdzania zmian czasu wizyty
  const commitTimeChange = async (appointmentId: string) => {
    if (!hasPendingChange(appointmentId)) {
      setAppointmentFormError("Brak oczekujących zmian dla tej wizyty.");
      return;
    }

    const pendingChange = getPendingChange(appointmentId);
    if (!pendingChange) return;

    // Znajdź pracownika, aby uwzględnić jego bufory czasowe
    const selectedEmployee = filteredEmployees.find(emp => emp.name === pendingChange.staffName);
    
    if (!selectedEmployee) {
      setAppointmentFormError("Nie znaleziono pracownika.");
      return;
    }
    
    // Oblicz efektywny czas zakończenia z uwzględnieniem buforów
    const effectiveEndDateTime = new Date(pendingChange.newEnd.getTime() +
      ((selectedEmployee.personalBuffers && selectedEmployee.personalBuffers[pendingChange.serviceId]) || selectedEmployee.defaultBuffer || 0) * 60000);

    startTransition(async () => {
      try {
        // ✅ POPRAWKA: Najpierw aktualizuj wizytę w bazie danych
        await updateAppointment(appointmentId, {
          serviceId: pendingChange.serviceId,
          clientId: pendingChange.clientId,
          staffName: pendingChange.staffName,
          start: pendingChange.newStart,
          end: effectiveEndDateTime,
          status: pendingChange.status,
          notes: pendingChange.notes,
          price: pendingChange.price
        });
        
        // ✅ POPRAWKA: Potem zatwierdź zmianę w hooku (usunięcie oczekującej zmiany)
        await commitChange(appointmentId);
        
        // ✅ Synchronizuj z Google Calendar W TLE (nie czekaj)
        const originalAppointment = calendarEvents.find(e => e.id === appointmentId);
        const selectedCustomer = customers.find(c => c.id === pendingChange.clientId);
        const selectedService = calendarServices.find(s => s.id === pendingChange.serviceId);
        
        if (selectedCustomer && selectedService) {
          if (originalAppointment?.googleCalendarEventId) {
            // Ma googleCalendarEventId - normalna aktualizacja W TLE per pracownik
            googleCalendarService.updateGoogleCalendarEventForEmployee({
              googleCalendarEventId: originalAppointment.googleCalendarEventId,
              appointment: {
                id: appointmentId,
                serviceId: pendingChange.serviceId,
                clientId: pendingChange.clientId,
                staffName: pendingChange.staffName,
                start: pendingChange.newStart,
                end: effectiveEndDateTime,
                status: pendingChange.status,
                notes: pendingChange.notes?.trim() || undefined,
              },
              clientEmail: selectedCustomer.email,
              serviceName: selectedService.name,
              clientName: selectedCustomer.fullName,
            }, selectedEmployee)
            .then(() => {
              console.log('✅ Google Calendar event updated for time change');
            })
            .catch((err) => {
              console.error('❌ Failed to update Google Calendar event:', err);
            });
          } else {
            // NIE MA googleCalendarEventId - auto-sync W TLE
            console.log('Appointment missing googleCalendarEventId - syncing in background');
            googleCalendarService.syncAppointment(appointmentId)
              .then((syncResult) => {
                if (syncResult.success && syncResult.googleEventId) {
                  return googleCalendarService.updateGoogleCalendarEventId(appointmentId, syncResult.googleEventId);
                }
              })
              .then(() => {
                console.log('✅ First-time sync successful for time change');
              })
              .catch((err) => {
                console.error('❌ Auto-sync failed for time change:', err);
              });
          }
        }
        
        // ✅ DODAJ TO - Reload appointments
        await loadAppointments();
        
        setAppointmentFormSuccess("Zmiany czasu wizyty zostały pomyślnie zatwierdzone i zapisane.");
        
        // Wyczyść komunikat po 2 sekundach
        setTimeout(() => {
          setAppointmentFormSuccess(null);
        }, 2000);
      } catch (error) {
        console.error("Błąd podczas zatwierdzania zmian czasu wizyty:", error);
        setAppointmentFormError("Nie udało się zatwierdzić zmian. Spróbuj ponownie.");
      }
    });
  };

  const [view, setView] = useState<typeof VIEW_OPTIONS[number]["value"]>("week");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [calendarServices, setCalendarServices] = useState<CalendarService[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<OptimisticAppointment[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Stan dla filtrów wizyt
  const [filters, setFilters] = useState<AppointmentFilter>({
    search: "",
    dateRange: { from: undefined, to: undefined },
    employees: [],
    services: [],
    statuses: [],
    customers: [],
  });
  
  // Inicjalizacja presetów filtrów z localStorage
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPresets = localStorage.getItem('calendarFilterPresets');
        return savedPresets ? JSON.parse(savedPresets) : [];
      } catch (error) {
        console.error("Błąd podczas wczytywania presetów filtrów:", error);
        return [];
      }
    }
    return [];
  });
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  
  // Stan dla modalu dodawania wizyty
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    serviceId: "",
    clientId: "",
    staffName: "",
    date: "",
    time: "",
    notes: ""
  });
  const [appointmentFormError, setAppointmentFormError] = useState<string | null>(null);
  const [appointmentFormSuccess, setAppointmentFormSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Stan dla modalu edycji wizyty
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    serviceId: "",
    clientId: "",
    staffName: "",
    date: "",
    time: "",
    notes: ""
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editFormSuccess, setEditFormSuccess] = useState<string | null>(null);
  
  // Stan dla zaznaczonej wizyty
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  
  // Stan dla interfejsu mobilnego
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  
  // Dane dla formularza
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  
  // Funkcja do przełączania zaznaczenia wizyty
  const toggleAppointmentSelection = (appointmentId: string) => {
    if (selectedAppointmentId === appointmentId) {
      // Jeśli wizyta jest już zaznaczona, odznacz ją
      setSelectedAppointmentId("");
    } else {
      // W przeciwnym razie zaznacz nową wizytę
      setSelectedAppointmentId(appointmentId);
    }
  };

  // Funkcja do otwierania modalu edycji z pre-wypełnionymi danymi
  const handleOpenEditModal = (appointment?: CalendarEvent) => {
    let appointmentToEdit: CalendarEvent | undefined;
    
    if (appointment) {
      // Jeśli podano wizytę w parametrze, użyj jej
      appointmentToEdit = appointment;
    } else if (selectedAppointmentId) {
      // W przeciwnym razie użyj aktualnie zaznaczonej wizyty
      appointmentToEdit = calendarEvents.find(event => event.id === selectedAppointmentId);
    }
    
    if (!appointmentToEdit) {
      setAppointmentFormError("Nie wybrano wizyty do edycji. Kliknij w wizytę, aby ją zaznaczyć.");
      return;
    }
    
    // Konwertuj daty na format dla inputów
    const startDate = new Date(appointmentToEdit.start);
    const dateStr = startDate.toISOString().slice(0, 10);
    const timeStr = startDate.toTimeString().slice(0, 5);
    
    setEditingAppointmentId(appointmentToEdit.id);
    setEditForm({
      serviceId: appointmentToEdit.serviceId,
      clientId: customers.find(c => c.fullName === appointmentToEdit.clientName)?.id || "",
      staffName: appointmentToEdit.staffName,
      date: dateStr,
      time: timeStr,
      notes: appointmentToEdit.notes || ""
    });
    setEditFormError(null);
    setEditFormSuccess(null);
    setIsEditModalOpen(true);
  };
  
  // Funkcja do zamykania modalu edycji
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAppointmentId("");
    setEditForm({
      serviceId: "",
      clientId: "",
      staffName: "",
      date: "",
      time: "",
      notes: ""
    });
    setEditFormError(null);
    setEditFormSuccess(null);
  };
  
  // Funkcja do zapisywania zmian w wizycie
  const handleSaveEdit = () => {
    // Walidacja formularza
    if (!editForm.serviceId || !editForm.clientId || !editForm.staffName || !editForm.date || !editForm.time) {
      setEditFormError("Wszystkie pola oznaczone gwiazdką są wymagane.");
      return;
    }
    
    setEditFormError(null);
    
    // Znajdź wybraną usługę, aby obliczyć czas trwania
    const selectedService = calendarServices.find(service => service.id === editForm.serviceId);
    if (!selectedService) {
      setEditFormError("Wybrana usługa jest nieprawidłowa.");
      return;
    }
    
    // Znajdź wybranego klienta
    const selectedCustomer = customers.find(customer => customer.id === editForm.clientId);
    if (!selectedCustomer) {
      setEditFormError("Wybrany klient jest nieprawidłowy.");
      return;
    }
    
    // Znajdź wybranego pracownika
    const selectedEmployee = filteredEmployees.find(emp => emp.name === editForm.staffName);
    if (!selectedEmployee) {
      setEditFormError("Wybrany pracownik jest nieprawidłowy.");
      return;
    }
    
    // Utwórz obiekt daty początkowej i końcowej
    const startDateTime = createLocalDate(editForm.date, editForm.time);
    const endDateTime = new Date(startDateTime.getTime() + selectedService.durationMin * 60000);
    
    // Oblicz efektywny czas zakończenia z uwzględnieniem buforów
    const effectiveEndDateTime = new Date(endDateTime.getTime() +
      ((selectedEmployee.personalBuffers && selectedEmployee.personalBuffers[editForm.serviceId]) || selectedEmployee.defaultBuffer || 0) * 60000);
    
    startTransition(async () => {
      try {
        const updatedData = {
          serviceId: editForm.serviceId,
          clientId: editForm.clientId,
          staffName: editForm.staffName,
          start: startDateTime,
          end: effectiveEndDateTime,
          status: "confirmed" as const,
          notes: editForm.notes?.trim() || "",
          price: undefined,
        };

        // ✅ 1. OPTIMISTIC UPDATE - pokaż natychmiast
        setCalendarEvents(prev =>
          prev.map(appt =>
            appt.id === editingAppointmentId
              ? {
                  ...appt,
                  ...updatedData,
                  _optimistic: true,
                  clientName: customers.find(c => c.id === editForm.clientId)?.fullName || appt.clientName,
                  start: startDateTime.toISOString(),
                  end: effectiveEndDateTime.toISOString(),
                }
              : appt
          )
        );

        setIsEditModalOpen(false);
        setEditFormSuccess("✨ Zapisywanie zmian...");

        // ✅ 2. SAVE TO FIRESTORE (w tle)
        await updateAppointment(editingAppointmentId, updatedData);

        // ✅ 3. CONFIRM - remove optimistic flag
        setCalendarEvents(prev =>
          prev.map(appt =>
            appt.id === editingAppointmentId
              ? { ...appt, _optimistic: false }
              : appt
          )
        );

        setEditFormSuccess("✅ Wizyta zaktualizowana!");
        
        // ✅ 4. GOOGLE CALENDAR SYNC happens automatically via Firestore Trigger!
        
        // Zamknij modal po 2 sekundach
        setTimeout(() => {
          handleCloseEditModal();
        }, 2000);
      } catch (error: any) {
        console.error("Błąd podczas aktualizacji wizyty:", error);
        
        // ✅ ROLLBACK - reload appointments
        await loadAppointments();
        
        setEditFormError(error.message || "Nie udało się zaktualizować wizyty.");
      }
    });
  };
  
  // Funkcja do usuwania wizyty
  const handleDeleteAppointment = (appointmentId: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć tę wizytę? Tej operacji nie można cofnąć.")) {
      startTransition(async () => {
        try {
          // ✅ 1. OPTIMISTIC UPDATE - usuń natychmiast z UI
          const deletedAppointment = calendarEvents.find(appt => appt.id === appointmentId);
          setCalendarEvents(prev => prev.filter(appt => appt.id !== appointmentId));

          // ✅ 2. DELETE FROM FIRESTORE (w tle)
          await deleteAppointment(appointmentId);

          setAppointmentFormSuccess("✅ Wizyta usunięta!");
          
          // ✅ 3. GOOGLE CALENDAR DELETE happens automatically via Firestore Trigger!
          
          // Wyczyść komunikat po 2 sekundach
          setTimeout(() => {
            setAppointmentFormSuccess(null);
          }, 2000);
        } catch (error: any) {
          console.error(error);
          
          // ✅ ROLLBACK - reload appointments
          await loadAppointments();
          
          alert("❌ Błąd podczas usuwania wizyty: " + error.message);
        }
      });
    }
  };

  // Funkcje obsługi filtrów
  const handleFiltersChange = (newFilters: AppointmentFilter) => {
    setFilters(newFilters);
  };

  const handleBatchAction = async (action: string, appointmentIds: string[]) => {
    try {
      // Tutaj można zaimplementować logikę operacji masowych
      // Na razie tylko podstawowa obsługa
      console.log(`Batch action: ${action}`, appointmentIds);
      
      // Przykład implementacji dla potwierdzania wizyt
      if (action === "confirm") {
        for (const appointmentId of appointmentIds) {
          const event = calendarEvents.find(e => e.id === appointmentId);
          if (event) {
            const customer = customers.find(c => c.fullName === event.clientName);
            const service = calendarServices.find(s => s.id === event.serviceId);
            
            if (customer && service) {
              await updateAppointment(appointmentId, {
                serviceId: event.serviceId,
                clientId: customer.id,
                staffName: event.staffName,
                start: timestampToDate(event.start),
                end: timestampToDate(event.end),
                status: "confirmed",
                notes: event.notes,
              });
            }
          }
        }
      }
      // Podobnie dla innych akcji...
      
      // Wyczyść wybór po wykonaniu akcji
      setSelectedAppointments([]);
    } catch (error) {
      console.error("Błąd podczas wykonywania akcji masowej:", error);
      setAppointmentFormError("Nie udało się wykonać akcji masowej. Spróbuj ponownie.");
    }
  };

  const handleSelectionChange = (appointmentIds: string[]) => {
    setSelectedAppointments(appointmentIds);
  };

  const handleSavePreset = async (name: string, filtersToSave: AppointmentFilter) => {
    try {
      // Tworzenie nowego presetu
      const newPreset: FilterPreset = {
        id: Date.now().toString(),
        name,
        filters: filtersToSave,
      };
      
      // Aktualizacja stanu lokalnego
      const updatedPresets = [...filterPresets, newPreset];
      setFilterPresets(updatedPresets);
      
      // Zapis w localStorage dla trwałości
      localStorage.setItem('calendarFilterPresets', JSON.stringify(updatedPresets));
      
      setAppointmentFormSuccess(`Preset "${name}" został zapisany.`);
    } catch (error) {
      console.error("Błąd podczas zapisywania presetu:", error);
      setAppointmentFormError("Nie udało się zapisać presetu. Spróbuj ponownie.");
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
  };

  // Filtrowane wizyty
  const filteredCalendarEvents = useMemo(() => {
    return calendarEvents.filter(event => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const service = calendarServices.find(s => s.id === event.serviceId);
        const serviceName = service ? service.name : event.serviceId;
        
        const matchesSearch =
          event.clientName.toLowerCase().includes(searchLower) ||
          serviceName.toLowerCase().includes(searchLower) ||
          event.staffName.toLowerCase().includes(searchLower) ||
          (event.notes && event.notes.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.dateRange.from) {
        const eventDate = timestampToDate(event.start);
        if (eventDate < filters.dateRange.from) return false;
      }
      if (filters.dateRange.to) {
        const eventDate = timestampToDate(event.start);
        eventDate.setHours(23, 59, 59, 999); // Koniec dnia
        if (eventDate > filters.dateRange.to) return false;
      }

      // Employee filter - użyj filteredEmployees z EmployeeContext
      if (filters.employees.length > 0) {
        const employee = filteredEmployees.find(emp => emp.name === event.staffName);
        if (!employee || !filters.employees.includes(employee.id)) return false;
      }
      
      // Automatyczne filtrowanie per pracownik na podstawie uprawnień
      if (!canViewAllEmployees && currentEmployee) {
        if (event.staffName !== currentEmployee.name) return false;
      }
      
      // Filtruj według wybranego pracownika w selektorze
      if (selectedEmployeeId && selectedEmployeeId !== "all") {
        const selectedEmployee = filteredEmployees.find(emp => emp.id === selectedEmployeeId);
        if (selectedEmployee && event.staffName !== selectedEmployee.name) {
          return false;
        }
      }

      // Service filter
      if (filters.services.length > 0 && !filters.services.includes(event.serviceId)) {
        return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) {
        return false;
      }

      // Customer filter
      if (filters.customers.length > 0) {
        const customer = customers.find(cust => cust.fullName === event.clientName);
        if (!customer || !filters.customers.includes(customer.id)) return false;
      }

      return true;
    });
  }, [calendarEvents, filters, filteredEmployees, customers, calendarServices, selectedEmployeeId, currentEmployee, canViewAllEmployees]);

  // Pobierz listę wizyt z nowego serwisu
  const loadAppointments = useCallback(async () => {
    try {
      console.log('🔄 Loading appointments with getAppointments...');
      const fetchedAppointments = await getAppointments();
      console.log('📊 Appointments loaded:', fetchedAppointments.length);
      
      // Mapowanie z Appointment na OptimisticAppointment
      const fetchedEvents = fetchedAppointments.map((appointment) => {
        // Znajdź nazwę klienta
        const customer = customers.find((c) => c.id === appointment.clientId);
        const clientName = customer ? customer.fullName : "Nieznany klient";
        
        // Znajdź nazwę usługi
        const service = calendarServices.find((s) => s.id === appointment.serviceId);
        
        return {
          id: appointment.id,
          serviceId: appointment.serviceId,
          clientName,
          staffName: appointment.staffName,
          start: appointment.start.toDate().toISOString(),
          end: appointment.end.toDate().toISOString(),
          status: appointment.status,
          price: appointment.price ? formatPrice(appointment.price) : undefined,
          offline: false,
          notes: appointment.notes,
          googleCalendarEventId: appointment.googleCalendarEventId,
          isGoogleSynced: !!appointment.googleCalendarEventId,
          clientId: appointment.clientId,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        } satisfies OptimisticAppointment;
      });
      
      setCalendarEvents(fetchedEvents);
      setEventsLoaded(true);
      console.log('✅ Appointments processed successfully');
    } catch (error) {
      console.error("❌ Nie udało się pobrać listy wizyt", error);
      setEventsLoaded(true);
      setDataError((current) => current ?? "Nie udało się pobrać listy wizyt");
    }
  }, [customers, calendarServices]);
  
  // ✅ POPRAWKA - Usunięto podwójne wywołanie loadAppointments()

  useEffect(() => {
    const servicesQuery = collection(db, "services");
    const unsubscribeServices = onSnapshot(
      servicesQuery,
      (snapshot) => {
        const fetchedServices = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: typeof data.name === "string" && data.name.trim() ? data.name : "Usługa",
            durationMin: Number(data.durationMin ?? data.duration ?? 60),
            noParallel: Boolean(data.noParallel ?? false),
            bufferAfterMin: typeof data.bufferAfterMin === "number" ? data.bufferAfterMin : undefined,
            tone: (data.tone ?? "primary") as ToneKey,
          } satisfies CalendarService;
        });
        setCalendarServices(fetchedServices);
        setServicesLoaded(true);
      },
      (error) => {
        console.error("Nie udało się pobrać listy usług", error);
        setServicesLoaded(true);
        setDataError((current) => current ?? "Nie udało się pobrać listy usług");
      }
    );
    
    // Symuluj unsubscribe dla kompatybilności
    const unsubscribeAppointments = () => {
      console.log('🔄 Unsubscribing from appointments (noop)');
    };

    // Pobierz listę klientów
    const unsubscribeCustomers = subscribeToCustomers(
      (fetchedCustomers) => {
        setCustomers(fetchedCustomers);
        setCustomersLoaded(true);
      },
      (error) => {
        console.error("Nie udało się pobrać listy klientów", error);
        setCustomersLoaded(true);
      }
    );

    // Pobierz listę pracowników
    const unsubscribeEmployees = subscribeToEmployees(
      (fetchedEmployees) => {
        setEmployees(fetchedEmployees);
        setEmployeesLoaded(true);
      },
      (error) => {
        console.error("Nie udało się pobrać listy pracowników", error);
        setEmployeesLoaded(true);
      }
    );

    return () => {
      unsubscribeServices();
      unsubscribeAppointments();
      unsubscribeCustomers();
      unsubscribeEmployees();
    };
  }, []); // Puste dependencies - wykonaj raz

  // ✅ NOWY - załaduj appointments gdy dane są gotowe
  useEffect(() => {
    if (customersLoaded && servicesLoaded) {
      loadAppointments();
    }
  }, [customersLoaded, servicesLoaded, loadAppointments]);

  const loadingData = !servicesLoaded || !eventsLoaded;

  const { start, days } = useWeek(referenceDate);
  const positionedEvents = useMemo(
    () => buildEventsForRange(filteredCalendarEvents, start, calendarServices, minutesWindow,
      selectedEmployeeId && selectedEmployeeId !== "all"
        ? filteredEmployees.find(emp => emp.id === selectedEmployeeId)
        : currentEmployee
    ),
    [filteredCalendarEvents, calendarServices, start, selectedEmployeeId, filteredEmployees, currentEmployee]
  );

  const monthInfo = useMonth(referenceDate);
  const monthWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    const monthStart = startOfWeek(monthInfo.start);
    let cursor = new Date(monthStart);
    while (cursor <= monthInfo.end || weeks.length < 6) {
      const week = Array.from({ length: 7 }, (_, index) => addDays(cursor, index));
      weeks.push(week);
      cursor = addDays(cursor, 7);
      if (cursor > monthInfo.end && cursor.getMonth() !== referenceDate.getMonth()) {
        break;
      }
    }
    return weeks;
  }, [monthInfo, referenceDate]);

  // ✅ POPRAWIONE - filtruj po LOKALNEJ dacie
  const dayEvents = useMemo(
    () =>
      positionedEvents
        .filter((event) => {
          const eventDate = timestampToDate(event.start);
          return isSameLocalDay(eventDate, referenceDate);
        })
        .sort((a, b) => timestampToDate(a.start).getTime() - timestampToDate(b.start).getTime()),
    [positionedEvents, referenceDate]
  );

  const isEmpty = !loadingData && filteredCalendarEvents.length === 0;

  return (
    <DashboardLayout
      active="calendar"
      header={{
        title: "Kalendarz",
        subtitle: "Dotykowy harmonogram salonu z walidacją pedicure",
      }}
    >
      <style jsx>{PULSE_SHADOW_ANIMATION}</style>
      <div className="space-y-6">
        {dataError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {dataError}
          </div>
        ) : null}
        {loadingData ? (
          <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
            Ładujemy dane kalendarza z Firestore...
          </div>
        ) : null}
        {/* Pasek nawigacji - desktop */}
        <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#f2dcd4] bg-[#fdf7f3] p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setReferenceDate((prev) => {
                    if (view === "day") {
                      return addDays(prev, -1);
                    }
                    if (view === "month") {
                      return addMonths(prev, -1);
                    }
                    return addWeeks(prev, -1);
                  });
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2dcd4] bg-white text-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#ffe1e8]"
                aria-label="Poprzedni zakres"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setReferenceDate((prev) => {
                    if (view === "day") {
                      return addDays(prev, 1);
                    }
                    if (view === "month") {
                      return addMonths(prev, 1);
                    }
                    return addWeeks(prev, 1);
                  });
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2dcd4] bg-white text-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-[#ffe1e8]"
                aria-label="Następny zakres"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Zakres</span>
              <span className="text-lg font-semibold text-foreground">
                {view === "day"
                  ? referenceDate.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                  : view === "month"
                    ? referenceDate.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })
                    : `${start.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })} – ${addDays(start, 6).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}`}
              </span>
            </div>
          </div>
          
          {/* Selektor pracowników - tylko dla użytkowników z uprawnieniami */}
          {canViewAllEmployees && (
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Pracownik:</span>
              <EmployeeSelector
                selectedEmployeeId={selectedEmployeeId}
                onEmployeeChange={setSelectedEmployeeId}
                showAllOption={true}
                placeholder="Wszyscy pracownicy"
              />
            </div>
          )}
          
          <ViewSwitcher value={view} onChange={(next) => {
            setView(next);
            setReferenceDate((prev) => new Date(prev));
          }} />
          <CalendarToolbar
            onOpenAppointmentModal={() => setIsAppointmentModalOpen(true)}
            onEditAppointment={() => handleOpenEditModal()}
            onDeleteAppointment={() => {
              if (selectedAppointmentId) {
                handleDeleteAppointment(selectedAppointmentId);
              }
            }}
            selectedAppointmentId={selectedAppointmentId}
          />
        </div>

        {/* Mobilne menu hamburger */}
        <div className="lg:hidden">
          {/* Nagłówek mobilny */}
          <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Otwórz menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Kalendarz</h1>
            <button
              type="button"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Filtry"
            >
              <Filter className="h-6 w-6" />
            </button>
          </div>

          {/* Mobilne menu boczne */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="relative flex flex-col w-64 max-w-xs bg-white h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    aria-label="Zamknij menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <button
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5"
                    onClick={() => {
                      setIsAppointmentModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Dodaj wizytę
                  </button>
                  <button
                    className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 ${
                      selectedAppointmentId
                        ? "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                        : "border-gray-300 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (selectedAppointmentId) {
                        handleOpenEditModal();
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    disabled={!selectedAppointmentId}
                  >
                    <Pencil className="h-4 w-4" />
                    Edytuj
                  </button>
                  <button
                    className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 ${
                      selectedAppointmentId
                        ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        : "border-gray-300 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (selectedAppointmentId) {
                        handleDeleteAppointment(selectedAppointmentId);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    disabled={!selectedAppointmentId}
                  >
                    <Trash2 className="h-4 w-4" />
                    Usuń
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
                    <AlarmClock className="h-4 w-4" />
                    Zmień godziny pracy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobilne filtry */}
          {showFiltersMobile && (
            <div className="fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowFiltersMobile(false)} />
              <div className="relative flex flex-col w-full max-w-sm bg-white h-full ml-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
                  <button
                    type="button"
                    onClick={() => setShowFiltersMobile(false)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    aria-label="Zamknij filtry"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <AppointmentFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    appointments={calendarEvents.map(event => {
                      const customer = customers.find(c => c.fullName === event.clientName);
                      const employee = filteredEmployees.find(e => e.name === event.staffName);
                      return {
                        id: event.id,
                        customerId: customer?.id || "",
                        employeeId: employee?.id || "",
                        serviceId: event.serviceId,
                        start: event.start,
                        end: event.end,
                        status: event.status,
                        notes: event.notes,
                      };
                    })}
                    employees={filteredEmployees}
                    services={calendarServices}
                    customers={customers}
                    onBatchAction={handleBatchAction}
                    selectedAppointments={selectedAppointments}
                    onSelectionChange={handleSelectionChange}
                    onSavePreset={handleSavePreset}
                    onLoadPreset={handleLoadPreset}
                    presets={filterPresets}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktopowe filtry */}
        <div className="hidden lg:block">
          <AppointmentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            appointments={calendarEvents.map(event => {
              const customer = customers.find(c => c.fullName === event.clientName);
              const employee = filteredEmployees.find(e => e.name === event.staffName);
              return {
                id: event.id,
                customerId: customer?.id || "",
                employeeId: employee?.id || "",
                serviceId: event.serviceId,
                start: event.start,
                end: event.end,
                status: event.status,
                notes: event.notes,
              };
            })}
            employees={filteredEmployees}
            services={calendarServices}
            customers={customers}
            onBatchAction={handleBatchAction}
            selectedAppointments={selectedAppointments}
            onSelectionChange={handleSelectionChange}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            presets={filterPresets}
          />
        </div>

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,1.1fr)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {view === "week" ? (
            <WeekBoard
              weekDays={days}
              events={positionedEvents}
              selectedDate={referenceDate}
              onSelectDate={setReferenceDate}
              selectedEmployee={
                selectedEmployeeId && selectedEmployeeId !== "all"
                  ? filteredEmployees.find(emp => emp.id === selectedEmployeeId)
                  : currentEmployee
              }
            />
          ) : null}
          {view === "day" ? <DayBoard
            date={referenceDate}
            events={dayEvents}
            onSelectAppointment={toggleAppointmentSelection}
            selectedAppointmentId={selectedAppointmentId}
            selectedEmployee={
              selectedEmployeeId && selectedEmployeeId !== "all"
                ? filteredEmployees.find(emp => emp.id === selectedEmployeeId)
                : currentEmployee
            }
          /> : null}
          {view === "month" ? (
            <div className="rounded-2xl sm:rounded-3xl border border-[#f2dcd4] bg-[#fdf7f3] p-2 sm:p-4">
              <div className="grid grid-cols-7 gap-1 sm:gap-3 text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground">
                {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((label) => (
                  <div key={label} className="text-center">
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.slice(0, 1)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 sm:mt-4 grid grid-cols-7 gap-1 sm:gap-3">
                {monthWeeks.flat().map((day, index) => {
                  const isCurrentMonth = day.getMonth() === referenceDate.getMonth();
                  const dayKey = toDateKey(day);
                  const dayEvents = positionedEvents.filter((event) => {
                    const eventDate = timestampToDate(event.start); // ✅ Użyj timestampToDate
                    return isSameLocalDay(eventDate, day); // ✅ Użyj isSameLocalDay
                  });
                  const hasConflict = dayEvents.some((event) => event.hasConflict);
                  return (
                    <button
                      key={`${dayKey}-${index}`}
                      type="button"
                      onClick={() => {
                        setReferenceDate(day);
                        setView("day");
                      }}
                      className={`flex h-16 sm:h-24 flex-col rounded-xl sm:rounded-2xl border p-1 sm:p-2 text-left transition-colors ${
                        isCurrentMonth ? "border-[#f2dcd4] bg-white hover:border-primary/40" : "border-transparent bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold">
                        <span>{day.getDate()}</span>
                        {hasConflict ? <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-rose-500" /> : null}
                      </div>
                      <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div key={event.id} className={`flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] ${STATUS_CLASSNAME[event.status].border} rounded px-0.5 sm:px-1 py-0.5 ${(event as any)._optimistic ? "opacity-70 animate-pulse" : ""}`}>
                            <span className={`h-1 w-1 sm:h-2 sm:w-2 rounded-full ${
                              event.status === "confirmed"
                                ? "bg-emerald-500"
                                : event.status === "pending"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            }`} />
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap lowercase hidden sm:inline">
                              {compactText(event.clientName, 5)}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length > 2 ? (
                          <span className="text-[8px] sm:text-[10px] text-muted-foreground">+{dayEvents.length - 2}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Panel boczny - desktop */}
          <div className="hidden lg:block">
            <DayAgenda
              events={dayEvents}
              onEditAppointment={handleOpenEditModal}
              onDeleteAppointment={handleDeleteAppointment}
              onAdjustTime={adjustAppointmentTime}
              onCommitTimeChange={commitTimeChange}
              onRevertChange={revertChange}
              hasPendingChange={hasPendingChange}
              getPendingChange={getPendingChange}
              selectedAppointmentId={selectedAppointmentId}
              onSelectAppointment={toggleAppointmentSelection}
            />
          </div>
        </div>

        {/* Mobilny panel boczny - dolny */}
        <div className="lg:hidden">
          <DayAgenda
            events={dayEvents}
            onEditAppointment={handleOpenEditModal}
            onDeleteAppointment={handleDeleteAppointment}
            onAdjustTime={adjustAppointmentTime}
            onCommitTimeChange={commitTimeChange}
            onRevertChange={revertChange}
            hasPendingChange={hasPendingChange}
            getPendingChange={getPendingChange}
            selectedAppointmentId={selectedAppointmentId}
            onSelectAppointment={toggleAppointmentSelection}
          />
        </div>

        {isEmpty ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-background p-6 text-center text-sm text-muted-foreground">
            Brak zaplanowanych wizyt. Dodaj pierwszą rezerwację, aby wypełnić kalendarz.
          </div>
        ) : null}

        <div className="rounded-2xl sm:rounded-3xl border border-[#f2dcd4] bg-[#fdf7f3] p-3 sm:p-6 text-xs sm:text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Potwierdzone</span>
              <span className="sm:hidden">Potw.</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-amber-500" />
              <span className="hidden sm:inline">Oczekujące</span>
              <span className="sm:hidden">Oczek.</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-rose-500" />
              <span className="hidden sm:inline">No-show / anulowane</span>
              <span className="sm:hidden">Anul.</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="h-1.5 w-4 sm:h-2 sm:w-6 rounded-full bg-rose-500" />
              <span className="hidden sm:inline">Konflikt pedicure</span>
              <span className="sm:hidden">Konflikt</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="h-3 w-6 sm:h-4 sm:w-8 rounded bg-[#ffc7d3]/80" />
              <span className="hidden sm:inline">Godziny pracy</span>
              <span className="sm:hidden">Godz.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal dodawania wizyty */}
      {isAppointmentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Dodaj nową wizytę</h2>
              <button
                type="button"
                onClick={() => {
                  setIsAppointmentModalOpen(false);
                  setAppointmentFormError(null);
                  setAppointmentFormSuccess(null);
                }}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-6 py-6">
              {appointmentFormError ? (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {appointmentFormError}
                </div>
              ) : null}
              
              {appointmentFormSuccess ? (
                <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {appointmentFormSuccess}
                </div>
              ) : null}

              <div className="space-y-4">
                {/* Wybór usługi */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Usługa *
                  </label>
                  <select
                    value={appointmentForm.serviceId}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, serviceId: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Wybierz usługę</option>
                    {calendarServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.durationMin} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wybór klienta */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Klient *
                  </label>
                  <select
                    value={appointmentForm.clientId}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Wybierz klienta</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} {customer.phone ? `(${customer.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wybór pracownika */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pracownik *
                  </label>
                  <select
                    value={appointmentForm.staffName}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, staffName: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Wybierz pracownika</option>
                    {filteredEmployees.filter(emp => emp.isActive !== false).map((employee) => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name} ({employee.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wybór daty i godziny */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Godzina *
                    </label>
                    <input
                      type="time"
                      value={appointmentForm.time}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                {/* Notatki */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notatki
                  </label>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Dodatkowe informacje o wizycie"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAppointmentModalOpen(false);
                    setAppointmentFormError(null);
                    setAppointmentFormSuccess(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                  disabled={isPending}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Walidacja formularza
                    if (!appointmentForm.serviceId || !appointmentForm.clientId || !appointmentForm.staffName || !appointmentForm.date || !appointmentForm.time) {
                      setAppointmentFormError("Wszystkie pola oznaczone gwiazdką są wymagane.");
                      return;
                    }
                    
                    setAppointmentFormError(null);
                    
                    // Znajdź wybraną usługę, aby obliczyć czas trwania
                    const selectedService = calendarServices.find(service => service.id === appointmentForm.serviceId);
                    if (!selectedService) {
                      setAppointmentFormError("Wybrana usługa jest nieprawidłowa.");
                      return;
                    }
                    
                    // Znajdź wybranego klienta
                    const selectedCustomer = customers.find(customer => customer.id === appointmentForm.clientId);
                    if (!selectedCustomer) {
                      setAppointmentFormError("Wybrany klient jest nieprawidłowy.");
                      return;
                    }
                    
                    // Znajdź wybranego pracownika, aby uwzględnić jego bufory czasowe
                    const selectedEmployee = filteredEmployees.find(emp => emp.name === appointmentForm.staffName);
                    if (!selectedEmployee) {
                      setAppointmentFormError("Wybrany pracownik jest nieprawidłowy.");
                      return;
                    }
                    
                    // Utwórz obiekt daty początkowej i końcowej
                    const startDateTime = createLocalDate(appointmentForm.date, appointmentForm.time);
                    const endDateTime = new Date(startDateTime.getTime() + selectedService.durationMin * 60000);
                    
                    // Oblicz efektywny czas zakończenia z uwzględnieniem buforów
                    const effectiveEndDateTime = new Date(endDateTime.getTime() +
                      ((selectedEmployee.personalBuffers && selectedEmployee.personalBuffers[appointmentForm.serviceId]) || selectedEmployee.defaultBuffer || 0) * 60000);
                    
                    startTransition(async () => {
                      try {
                        const newAppointmentData = {
                          serviceId: appointmentForm.serviceId,
                          clientId: appointmentForm.clientId,
                          staffName: appointmentForm.staffName,
                          start: startDateTime,
                          end: effectiveEndDateTime,
                          status: "confirmed" as const,
                          notes: appointmentForm.notes?.trim() || "",
                          price: undefined,
                        };

                        // ✅ 1. OPTIMISTIC UPDATE - pokaż natychmiast
                        const tempId = generateTempId();
                        const optimisticAppointment: OptimisticAppointment = {
                          ...newAppointmentData,
                          id: tempId,
                          _optimistic: true,
                          _tempId: tempId,
                          createdAt: undefined,
                          updatedAt: undefined,
                          clientName: selectedCustomer?.fullName || "Nieznany klient",
                          googleCalendarEventId: undefined,
                          isGoogleSynced: false,
                          offline: false,
                          start: startDateTime.toISOString(),
                          end: effectiveEndDateTime.toISOString(),
                        };

                        setCalendarEvents(prev => [...prev, optimisticAppointment]);
                        setIsAppointmentModalOpen(false);
                        setAppointmentFormSuccess("✨ Wizyta dodawana...");
                        setAppointmentForm({
                          serviceId: "",
                          clientId: "",
                          staffName: "",
                          date: "",
                          time: "",
                          notes: ""
                        });

                        // ✅ 2. SAVE TO FIRESTORE (w tle)
                        const result = await createAppointment(newAppointmentData);

                        // ✅ 3. REPLACE OPTIMISTIC with REAL
                        setCalendarEvents(prev =>
                          replaceOptimistic(prev, tempId, {
                            id: result.id,
                            serviceId: newAppointmentData.serviceId,
                            clientName: selectedCustomer?.fullName || "Nieznany klient",
                            staffName: newAppointmentData.staffName,
                            start: startDateTime.toISOString(),
                            end: effectiveEndDateTime.toISOString(),
                            status: newAppointmentData.status,
                            price: newAppointmentData.price,
                            offline: false,
                            notes: newAppointmentData.notes,
                            googleCalendarEventId: undefined,
                            isGoogleSynced: false,
                          })
                        );

                        setAppointmentFormSuccess("✅ Wizyta dodana pomyślnie!");
                        
                        // ✅ 4. GOOGLE CALENDAR SYNC happens automatically via Firestore Trigger!
                        
                        // Wyczyść komunikat po 2 sekundach
                        setTimeout(() => {
                          setAppointmentFormSuccess(null);
                        }, 2000);
                      } catch (error: any) {
                        console.error("Błąd podczas dodawania wizyty:", error);
                        
                        // ✅ ROLLBACK OPTIMISTIC UPDATE on error
                        setCalendarEvents(prev =>
                          prev.filter(appt => !appt._optimistic)
                        );
                        
                        setAppointmentFormError(error.message || "Nie udało się dodać wizyty.");
                      }
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-70"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Dodaj wizytę
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal edycji wizyty */}
      {isEditModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Edytuj wizytę</h2>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-6 py-6">
              {editFormError ? (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {editFormError}
                </div>
              ) : null}
              
              {editFormSuccess ? (
                <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                  {editFormSuccess}
                </div>
              ) : null}

              <div className="space-y-4">
                {/* Wybór usługi */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Usługa *
                  </label>
                  <select
                    value={editForm.serviceId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, serviceId: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Wybierz usługę</option>
                    {calendarServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.durationMin} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wybór klienta */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Klient *
                  </label>
                  <select
                    value={editForm.clientId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Wybierz klienta</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} {customer.phone ? `(${customer.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wybór pracownika */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pracownik *
                  </label>
                  <select
                    value={editForm.staffName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, staffName: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Wybierz pracownika</option>
                    {filteredEmployees.filter(emp => emp.isActive !== false).map((employee) => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name} ({employee.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Wybór daty i godziny */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Godzina *
                    </label>
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                {/* Notatki */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notatki
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Dodatkowe informacje o wizycie"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteAppointment(editingAppointmentId)}
                  className="rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
                  disabled={isPending}
                >
                  <Trash2 className="inline h-4 w-4 mr-2" />
                  Usuń wizytę
                </button>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                    disabled={isPending}
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-70"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                    Zapisz zmiany
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
