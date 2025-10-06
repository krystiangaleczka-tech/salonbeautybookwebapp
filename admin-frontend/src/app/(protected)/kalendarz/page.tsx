'use client';

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlarmClock,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { ToneKey } from "@/lib/dashboard-theme";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { createAppointment, subscribeToAppointments, type Appointment } from "@/lib/appointments-service";
import { subscribeToCustomers, type Customer } from "@/lib/customers-service";
import { subscribeToEmployees, type Employee } from "@/lib/employees-service";

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
}

export interface WorkingHours {
  start: string; // HH:mm
  end: string; // HH:mm
}

export type WeeklyHours = Record<number, WorkingHours | null>;

const baseSalonHours: WeeklyHours = {
  0: null,
  1: { start: "09:00", end: "17:00" },
  2: { start: "09:00", end: "17:00" },
  3: { start: "09:00", end: "17:00" },
  4: { start: "09:00", end: "17:30" },
  5: { start: "10:00", end: "16:00" },
  6: null,
};

const dailyOverrides: Record<string, WorkingHours> = {
  "2024-01-17": { start: "11:00", end: "17:00" },
  "2024-01-18": { start: "09:00", end: "15:00" },
};

function toIsoString(value: unknown) {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return new Date().toISOString();
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

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function compactText(value: string, maxLength: number) {
  return value.replace(/\s+/g, "").toLowerCase().slice(0, maxLength);
}

function parseIsoDate(iso: string) {
  return new Date(iso);
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

function getWorkingWindow(day: Date): WorkingHours | null {
  const override = dailyOverrides[toDateKey(day)];
  if (override) {
    return override;
  }
  const base = baseSalonHours[day.getDay()];
  return base ?? null;
}

function buildEventsForRange(
  events: CalendarEvent[],
  weekStart: Date,
  services: CalendarService[],
  minutesWindow: TimeRange
) {
  const pedicureIds = new Set(services.filter((service) => service.noParallel).map((service) => service.id));
  const serviceLookup = new Map(services.map((service) => [service.id, service]));

  const eventsInRange = events.filter((event) => {
    const start = parseIsoDate(event.start);
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
    const workingWindow = getWorkingWindow(start);
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
  start: 7 * 60,
  end: 20 * 60,
};

const PIXELS_PER_MINUTE = 1;
const DAY_PIXELS_PER_MINUTE = 1.5;

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

function WeekBoard({
  weekDays,
  events,
  selectedDate,
  onSelectDate,
}: {
  weekDays: Date[];
  events: PositionedEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
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
      entries.set(toDateKey(day), getWorkingWindow(day));
    });
    return entries;
  }, [weekDays]);

  return (
    <div className="rounded-3xl border border-[#f2dcd4] bg-[#f8f3ec] p-4">
      <div className="flex gap-4">
        <div className="w-14 shrink-0 text-right text-xs font-semibold text-muted-foreground">
          {hours.map((hour) => (
            <div key={hour} className="flex h-[60px] items-start justify-end pr-2">
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div className="relative grid flex-1 grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const key = toDateKey(day);
            const window = workingWindows.get(key);
            const selected = toDateKey(selectedDate) === key;
            const dayEvents = events.filter((event) => toDateKey(parseIsoDate(event.start)) === key);
            const workingStart = window ? timeStringToMinutes(window.start) - minutesWindow.start : null;
            const workingEnd = window ? timeStringToMinutes(window.end) - minutesWindow.start : null;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDate(day)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-2 text-left transition-colors ${
                  selected ? "border-primary bg-[#fdf7f3]" : "border-transparent bg-[#fdf7f3]/70 hover:border-primary/40"
                }`}
              >
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>
                    {day.toLocaleDateString("pl-PL", { weekday: "short" })}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {day.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })}
                  </span>
                </div>

                <div className="relative h-[780px]">
                  <div className="absolute inset-0 grid grid-rows-[repeat(13,60px)]">
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
                      className={`absolute inset-x-2 flex h-full flex-col justify-between overflow-hidden rounded-xl border bg-card p-2 shadow-lg transition-transform hover:-translate-y-1 ${
                        STATUS_CLASSNAME[event.status].border
                      } ${event.isOutsideWorkingHours ? "ring-2 ring-amber-400" : ""}`}
                      style={{
                        top: Math.max(0, event.top * PIXELS_PER_MINUTE),
                        height: Math.max(52, event.height * PIXELS_PER_MINUTE),
                      }}
                    >
                      <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground">
                        <span>{formatTimeRange(parseIsoDate(event.start), parseIsoDate(event.end))}</span>
                        <span className={`h-2 w-2 rounded-full ${
                          event.status === "confirmed"
                            ? "bg-emerald-500"
                            : event.status === "pending"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`} />
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[11px] font-semibold lowercase text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                          {compactText(event.clientName, 5)}
                        </p>
                        <p className="text-[10px] lowercase text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                          {compactText(event.serviceName, 7)}
                        </p>
                      </div>
                      {event.hasConflict ? (
                        <span className="absolute inset-x-0 bottom-0 h-1 rounded-b-xl bg-rose-500" title="Pedicure nie może się nakładać" />
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
}: {
  date: Date;
  events: PositionedEvent[];
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

  const timelineWidth = (minutesWindow.end - minutesWindow.start) * DAY_PIXELS_PER_MINUTE;
  const hourWidth = 60 * DAY_PIXELS_PER_MINUTE;
  const workingWindow = getWorkingWindow(date);
  const workingLeft = workingWindow
    ? clamp((timeStringToMinutes(workingWindow.start) - minutesWindow.start) * DAY_PIXELS_PER_MINUTE, 0, timelineWidth)
    : 0;
  const workingWidth = workingWindow
    ? clamp((timeStringToMinutes(workingWindow.end) - timeStringToMinutes(workingWindow.start)) * DAY_PIXELS_PER_MINUTE, 0, timelineWidth)
    : timelineWidth;

  const horizontalEvents = useMemo(() => buildHorizontalPositions(events), [events]);

  return (
    <div className="rounded-3xl border border-[#f2dcd4] bg-[#fdf7f3] p-4 min-h-[640px]">
      <div className="flex flex-col gap-4">
        <div className="text-sm font-semibold text-foreground">
          {date.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full" style={{ minWidth: timelineWidth + 160, minHeight: 520 }}>
            <div className="pl-16">
              <div className="flex items-end gap-0 text-[11px] uppercase text-muted-foreground" style={{ width: timelineWidth }}>
                {hours.map((hour, index) => (
                  <div key={hour} className="relative flex items-center justify-center" style={{ width: hourWidth }}>
                    <span>{hour.toString().padStart(2, "0")}:00</span>
                    {index < hours.length - 1 ? (
                      <span className="absolute bottom-0 right-0 h-3 w-px bg-[#ead9d1]" />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="relative mt-4 h-[520px] rounded-2xl border border-[#f2dcd4]/60 bg-[#fdf1eb]" style={{ width: timelineWidth }}>
                <div className="absolute inset-0">
                  <div className="absolute inset-y-0 rounded-2xl bg-[#e7d7ff]/30" />
                  <div
                    className="absolute inset-y-4 rounded-2xl bg-[#ffc7d3]/60"
                    style={{ left: workingLeft, width: workingWidth }}
                  />
                  {hours.map((hour, index) => (
                    <div
                      key={`grid-${hour}`}
                      className="absolute top-0 bottom-0 border-l border-dashed border-[#ead9d1]/80"
                      style={{ left: index * hourWidth }}
                    />
                  ))}
                </div>

                {horizontalEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`absolute top-10 flex h-24 w-48 flex-col justify-between overflow-hidden rounded-2xl border bg-card p-3 text-left text-xs shadow-lg transition-transform hover:-translate-y-1 ${
                        STATUS_CLASSNAME[event.status].border
                      } ${event.isOutsideWorkingHours ? "ring-2 ring-amber-400" : ""}`}
                    style={{
                      left: clamp(event.left, 0, Math.max(0, timelineWidth - 160)),
                      width: clamp(event.width, 90, 200),
                    }}
                  >
                    <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground">
                      <span>{formatTimeRange(parseIsoDate(event.start), parseIsoDate(event.end))}</span>
                      <span className={`h-2 w-2 rounded-full ${
                        event.status === "confirmed"
                          ? "bg-emerald-500"
                          : event.status === "pending"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold lowercase text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                        {compactText(event.clientName, 5)}
                      </p>
                      <p className="text-[10px] lowercase text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                        {compactText(event.serviceName, 7)}
                      </p>
                      <p className="text-[10px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                        {event.staffName}
                      </p>
                    </div>
                    {event.hasConflict ? (
                      <span className="absolute inset-x-0 bottom-0 h-1 rounded-b-2xl bg-rose-500" title="Pedicure nie może się nakładać" />
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

function DayAgenda({ events }: { events: PositionedEvent[] }) {
  return (
    <aside className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card/90 p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Wizyty dnia</h2>
        <p className="text-sm text-muted-foreground">Kliknij kartę, aby zobaczyć szczegóły i edytować.</p>
      </div>
      <div className="space-y-3 overflow-y-auto pr-2">
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
            Brak wizyt w wybranym dniu.
          </p>
        ) : null}
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md ${
              STATUS_CLASSNAME[event.status].border
            }`}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTimeRange(parseIsoDate(event.start), parseIsoDate(event.end))}</span>
              {event.price ? <span className="font-semibold text-foreground">{event.price}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  event.status === "confirmed"
                    ? "bg-emerald-500"
                    : event.status === "pending"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
              />
              <p className="text-sm font-semibold text-foreground">{event.clientName}</p>
            </div>
            <p className="text-xs text-muted-foreground">{event.staffName}</p>
            <p className="text-xs text-muted-foreground">{event.serviceName}</p>
            {event.hasConflict ? (
              <span className="text-xs font-semibold text-rose-500">Konflikt: pedicure nakłada się w tym czasie.</span>
            ) : null}
            {event.isOutsideWorkingHours ? (
              <span className="text-xs font-semibold text-amber-500">
                ⚠ Poza godzinami pracy – rozważ korektę grafiku.
              </span>
            ) : null}
          </button>
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

function CalendarToolbar({ onOpenAppointmentModal }: { onOpenAppointmentModal: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5"
        onClick={onOpenAppointmentModal}
      >
        <Plus className="h-4 w-4" />
        Dodaj wizytę
      </button>
      <button className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground">
        <Pencil className="h-4 w-4" />
        Edytuj
      </button>
      <button className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-destructive px-4 text-sm font-semibold text-destructive shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-destructive hover:text-destructive-foreground">
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
  const [view, setView] = useState<typeof VIEW_OPTIONS[number]["value"]>("week");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [calendarServices, setCalendarServices] = useState<CalendarService[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
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
  
  // Dane dla formularza
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);

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

    // Pobierz listę wizyt z nowego serwisu
    const unsubscribeAppointments = subscribeToAppointments(
      (fetchedAppointments) => {
        // Mapowanie z Appointment na CalendarEvent
        const fetchedEvents = fetchedAppointments.map((appointment) => {
          // Znajdź nazwę klienta
          const customer = customers.find(c => c.id === appointment.clientId);
          const clientName = customer ? customer.fullName : "Nieznany klient";
          
          // Znajdź nazwę usługi
          const service = calendarServices.find(s => s.id === appointment.serviceId);
          
          return {
            id: appointment.id,
            serviceId: appointment.serviceId,
            clientName,
            staffName: appointment.staffName,
            start: appointment.start.toDate().toISOString(),
            end: appointment.end.toDate().toISOString(),
            status: appointment.status,
            price: appointment.price ? formatPrice(appointment.price) : undefined,
            offline: false, // Nowe wizyty nie są offline
            notes: appointment.notes,
          } satisfies CalendarEvent;
        });
        setCalendarEvents(fetchedEvents);
        setEventsLoaded(true);
      },
      (error) => {
        console.error("Nie udało się pobrać listy wizyt", error);
        setEventsLoaded(true);
        setDataError((current) => current ?? "Nie udało się pobrać listy wizyt");
      }
    );

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
  }, [customers, calendarServices]);

  const loadingData = !servicesLoaded || !eventsLoaded;

  const { start, days } = useWeek(referenceDate);
  const positionedEvents = useMemo(
    () => buildEventsForRange(calendarEvents, start, calendarServices, minutesWindow),
    [calendarEvents, calendarServices, start]
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

  const dayEvents = useMemo(
    () =>
      positionedEvents
        .filter((event) => toDateKey(parseIsoDate(event.start)) === toDateKey(referenceDate))
        .sort((a, b) => parseIsoDate(a.start).getTime() - parseIsoDate(b.start).getTime()),
    [positionedEvents, referenceDate]
  );

  const isEmpty = !loadingData && calendarEvents.length === 0;

  return (
    <DashboardLayout
      active="calendar"
      header={{
        title: "Kalendarz",
        subtitle: "Dotykowy harmonogram salonu z walidacją pedicure",
      }}
    >
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
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#f2dcd4] bg-[#fdf7f3] p-4 shadow-sm">
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
          <ViewSwitcher value={view} onChange={(next) => {
            setView(next);
            setReferenceDate((prev) => new Date(prev));
          }} />
          <CalendarToolbar onOpenAppointmentModal={() => setIsAppointmentModalOpen(true)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,1.1fr)]">
          {view === "week" ? (
            <WeekBoard weekDays={days} events={positionedEvents} selectedDate={referenceDate} onSelectDate={setReferenceDate} />
          ) : null}
          {view === "day" ? <DayBoard date={referenceDate} events={dayEvents} /> : null}
          {view === "month" ? (
            <div className="rounded-3xl border border-[#f2dcd4] bg-[#fdf7f3] p-4">
              <div className="grid grid-cols-7 gap-3 text-xs font-semibold uppercase text-muted-foreground">
                {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((label) => (
                  <div key={label} className="text-center">
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-7 gap-3">
                {monthWeeks.flat().map((day, index) => {
                  const isCurrentMonth = day.getMonth() === referenceDate.getMonth();
                  const dayKey = toDateKey(day);
                  const dayEvents = positionedEvents.filter((event) => toDateKey(parseIsoDate(event.start)) === dayKey);
                  const hasConflict = dayEvents.some((event) => event.hasConflict);
                  return (
                    <button
                      key={`${dayKey}-${index}`}
                      type="button"
                      onClick={() => {
                        setReferenceDate(day);
                        setView("day");
                      }}
                      className={`flex h-24 flex-col rounded-2xl border p-2 text-left transition-colors ${
                        isCurrentMonth ? "border-[#f2dcd4] bg-white hover:border-primary/40" : "border-transparent bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{day.getDate()}</span>
                        {hasConflict ? <span className="h-2 w-2 rounded-full bg-rose-500" /> : null}
                      </div>
                      <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div key={event.id} className={`flex items-center gap-1 text-[10px] ${STATUS_CLASSNAME[event.status].border} rounded px-1 py-0.5`}> 
                            <span className={`h-2 w-2 rounded-full ${
                              event.status === "confirmed"
                                ? "bg-emerald-500"
                                : event.status === "pending"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            }`} />
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap lowercase">
                              {compactText(event.clientName, 5)}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length > 3 ? (
                          <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} więcej</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <DayAgenda events={dayEvents} />
        </div>

        {isEmpty ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-background p-6 text-center text-sm text-muted-foreground">
            Brak zaplanowanych wizyt. Dodaj pierwszą rezerwację, aby wypełnić kalendarz.
          </div>
        ) : null}

        <div className="rounded-3xl border border-[#f2dcd4] bg-[#fdf7f3] p-6 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Potwierdzone
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              Oczekujące
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              No-show / anulowane
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-rose-500" />
              Konflikt pedicure
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded bg-[#ffc7d3]/80" />
              Godziny pracy
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
                    {employees.filter(emp => emp.isActive).map((employee) => (
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
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
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
                    
                    // Utwórz obiekt daty początkowej i końcowej
                    const startDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
                    const endDateTime = new Date(startDateTime.getTime() + selectedService.durationMin * 60000);
                    
                    startTransition(async () => {
                      try {
                        // Utwórz wizytę w Firebase
                        await createAppointment({
                          serviceId: appointmentForm.serviceId,
                          clientId: appointmentForm.clientId,
                          staffName: appointmentForm.staffName,
                          start: startDateTime,
                          end: endDateTime,
                          status: "confirmed",
                          notes: appointmentForm.notes.trim() || undefined,
                        });
                        
                        setAppointmentFormSuccess("Wizyta została pomyślnie dodana.");
                        
                        // Czyszczenie formularza po 2 sekundach
                        setTimeout(() => {
                          setIsAppointmentModalOpen(false);
                          setAppointmentForm({
                            serviceId: "",
                            clientId: "",
                            staffName: "",
                            date: "",
                            time: "",
                            notes: ""
                          });
                          setAppointmentFormSuccess(null);
                        }, 2000);
                      } catch (error) {
                        console.error("Błąd podczas dodawania wizyty:", error);
                        setAppointmentFormError("Nie udało się dodać wizyty. Spróbuj ponownie.");
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
    </DashboardLayout>
  );
}
