"use client";

import { useMemo, useState } from "react";
import { analysisTiles } from "@/lib/dashboard-data";
import type { WeeklyTrend } from "@/lib/dashboard-service";

interface AnalyticsPanelProps {
  weeklyTrends: WeeklyTrend[];
}

export function AnalyticsPanel({ weeklyTrends }: AnalyticsPanelProps) {
  const [activeTile, setActiveTile] = useState(analysisTiles[0]);
  const maxValue = useMemo(() => Math.max(...weeklyTrends.map((item) => item.appointments)), [weeklyTrends]);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {analysisTiles.map((tile) => {
          const isActive = tile === activeTile;
          return (
            <button
              key={tile}
              type="button"
              onClick={() => setActiveTile(tile)}
              className={`card flex h-24 flex-col justify-between border border-border p-4 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-card"
              }`}
            >
              <span className="text-sm font-semibold leading-tight">{tile}</span>
              <span className={`text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {isActive ? "Wybrano do analizy" : "Pokaż dane"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="card border border-border p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{activeTile}</h2>
            <p className="text-sm text-muted-foreground">
              Tygodniowa dynamika w ostatnich dwóch miesiącach.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Szczyt:</span> {maxValue} wizyt
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          {weeklyTrends.map(({ week, appointments }) => {
            const height = maxValue ? Math.round((appointments / maxValue) * 180) : 0;
            return (
              <div key={week} className="flex flex-1 flex-col items-center gap-3">
                <div
                  className="flex h-48 w-full items-end rounded-lg bg-gradient-to-t from-primary/10 to-transparent p-2"
                  aria-hidden="true"
                >
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-primary to-accent"
                    style={{ height: `${height}px` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{week}</span>
                <span className="text-sm font-semibold text-foreground">{appointments}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
