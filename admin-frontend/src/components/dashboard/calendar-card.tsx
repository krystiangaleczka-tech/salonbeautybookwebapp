"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "STYCZEŃ",
  "LUTY",
  "MARZEC",
  "KWIECIEŃ",
  "MAJ",
  "CZERWIEC",
  "LIPIEC",
  "SIERPIEŃ",
  "WRZESIEŃ",
  "PAŹDZIERNIK",
  "LISTOPAD",
  "GRUDZIEŃ",
];

const WEEK_DAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

interface CalendarCardProps {
  occupancy: Record<string, number>;
  initialDate?: Date;
}

function buildKey(year: number, month: number, day: number) {
  const monthIndex = String(month + 1).padStart(2, "0");
  const dayIndex = String(day).padStart(2, "0");
  return `${year}-${monthIndex}-${dayIndex}`;
}

function getDotClass(percent: number) {
  if (percent <= 30) {
    return "occupancy-dot-low";
  }
  if (percent <= 60) {
    return "occupancy-dot-medium";
  }
  if (percent <= 90) {
    return "occupancy-dot-high";
  }
  return "occupancy-dot-critical";
}

export function CalendarCard({ occupancy, initialDate }: CalendarCardProps) {
  const [referenceDate, setReferenceDate] = useState(initialDate ?? new Date(2024, 0, 1));

  const { year, month, weeks } = useMemo(() => {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // convert Sunday-first to Monday-first

    const days: Array<number | null> = [];
    for (let i = 0; i < startOffset; i += 1) {
      days.push(null);
    }
    for (let day = 1; day <= totalDays; day += 1) {
      days.push(day);
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    const chunked: Array<Array<number | null>> = [];
    for (let i = 0; i < days.length; i += 7) {
      chunked.push(days.slice(i, i + 7));
    }

    return {
      year: currentYear,
      month: currentMonth,
      weeks: chunked,
    };
  }, [referenceDate]);

  const today = new Date();

  const getOccupancy = (day: number) => {
    const key = buildKey(year, month, day);
    if (occupancy[key] !== undefined) {
      return occupancy[key];
    }
    const fallback = (day * (month + 3) * 17) % 101;
    return Math.round(fallback);
  };

  const handlePrevious = () => {
    setReferenceDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNext = () => {
    setReferenceDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 text-sm text-muted-foreground">
        {WEEK_DAYS.map((day) => (
          <span key={day} className="text-center">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            if (!day) {
              return <div key={`${weekIndex}-${dayIndex}`} />;
            }

            const percent = getOccupancy(day);
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;

            return (
              <button
                key={`${weekIndex}-${day}`}
                type="button"
                className={`calendar-day flex flex-col items-center justify-center gap-2 py-3 ${
                  isToday ? "bg-primary text-primary-foreground" : ""
                }`}
                title={`Zajętość: ${percent}%`}
              >
                <span className="text-sm font-medium">{day}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${getDotClass(percent)}`} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
