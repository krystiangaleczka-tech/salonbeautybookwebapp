export type ToneKey = "primary" | "chart3" | "chart4" | "chart5" | "destructive" | "accent";

export const toneColorMap: Record<ToneKey, string> = {
  primary: "var(--primary)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
  destructive: "var(--destructive)",
  accent: "var(--accent)",
};

export const toneTextClass: Record<ToneKey, string> = {
  primary: "text-primary",
  chart3: "text-chart-3",
  chart4: "text-chart-4",
  chart5: "text-chart-5",
  destructive: "text-destructive",
  accent: "text-accent",
};

export function getBubbleStyle(tone: ToneKey) {
  const color = toneColorMap[tone];
  return {
    background: `color-mix(in oklch, ${color} 20%, transparent)`,
  };
}

export function getAccentBorder(tone: ToneKey) {
  return {
    borderLeftColor: toneColorMap[tone],
  };
}

export function getSoftBadgeStyle(tone: ToneKey) {
  const color = toneColorMap[tone];
  return {
    background: `color-mix(in oklch, ${color} 18%, var(--card))`,
  };
}
