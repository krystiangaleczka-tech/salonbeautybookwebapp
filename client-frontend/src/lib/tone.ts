export type ToneKey = "primary" | "chart3" | "chart4" | "chart5" | "accent" | "destructive"

export const toneClassMap: Record<ToneKey, string> = {
  primary: "bg-indigo-100 text-indigo-700",
  chart3: "bg-emerald-100 text-emerald-700",
  chart4: "bg-amber-100 text-amber-700",
  chart5: "bg-rose-100 text-rose-700",
  accent: "bg-sky-100 text-sky-700",
  destructive: "bg-red-100 text-red-700",
}

export const toneBadgeClass: Record<ToneKey, string> = {
  primary: "text-indigo-600",
  chart3: "text-emerald-600",
  chart4: "text-amber-600",
  chart5: "text-rose-600",
  accent: "text-sky-600",
  destructive: "text-red-600",
}
