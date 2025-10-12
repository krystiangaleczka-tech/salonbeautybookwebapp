"use client";

import { useState, useEffect } from "react";
import { X, Clock, Save } from "lucide-react";

interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface ScheduleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: DaySchedule[]) => void;
  initialSchedule?: DaySchedule[];
}

const weekDays = [
  { key: "monday", label: "Poniedziałek" },
  { key: "tuesday", label: "Wtorek" },
  { key: "wednesday", label: "Środa" },
  { key: "thursday", label: "Czwartek" },
  { key: "friday", label: "Piątek" },
  { key: "saturday", label: "Sobota" },
  { key: "sunday", label: "Niedziela" },
];

const defaultSchedule: DaySchedule[] = weekDays.map(({ key, label }) => ({
  day: key,
  isOpen: key !== "saturday" && key !== "sunday",
  openTime: "08:00",
  closeTime: "16:00",
}));

export default function ScheduleEditorModal({
  isOpen,
  onClose,
  onSave,
  initialSchedule,
}: ScheduleEditorModalProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule || defaultSchedule);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSchedule) {
      setSchedule(initialSchedule);
    }
  }, [initialSchedule]);

  const handleDayToggle = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((day, index) =>
        index === dayIndex ? { ...day, isOpen: !day.isOpen } : day
      )
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((day, index) =>
        index === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(schedule);
      onClose();
    } catch (error) {
      console.error("Błąd podczas zapisywania grafiku:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyWeekdayToWeekend = () => {
    const weekdaySchedule = schedule.find((day) => day.day === "monday");
    if (weekdaySchedule) {
      setSchedule((prev) =>
        prev.map((day) =>
          day.day === "saturday" || day.day === "sunday"
            ? { ...day, isOpen: true, openTime: weekdaySchedule.openTime, closeTime: weekdaySchedule.closeTime }
            : day
        )
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Edycja grafiku pracy</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {weekDays.map(({ key, label }, index) => {
            const daySchedule = schedule[index];
            
            // Guard check - pomiń renderowanie jeśli daySchedule nie istnieje
            if (!daySchedule) {
              return null;
            }
            
            return (
              <div key={key} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    id={`day-${key}`}
                    checked={daySchedule?.isOpen || false}
                    onChange={() => handleDayToggle(index)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor={`day-${key}`} className="font-medium text-foreground min-w-[120px]">
                    {label}
                  </label>
                </div>

                {daySchedule?.isOpen && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">Od:</label>
                      <input
                        type="time"
                        value={daySchedule?.openTime || "08:00"}
                        onChange={(e) => handleTimeChange(index, "openTime", e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">Do:</label>
                      <input
                        type="time"
                        value={daySchedule?.closeTime || "16:00"}
                        onChange={(e) => handleTimeChange(index, "closeTime", e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {!daySchedule?.isOpen && (
                  <span className="text-sm text-muted-foreground">Zamknięte</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleCopyWeekdayToWeekend}
            className="text-sm font-medium text-primary hover:underline"
          >
            Kopiuj dzień powszedni na weekend
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Zapisywanie..." : "Zapisz grafik"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}