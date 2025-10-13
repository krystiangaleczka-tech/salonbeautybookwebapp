"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Zapobiegaj błędom hydratacji
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="group flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground transition-all duration-300 ease-in-out hover:bg-accent/80 hover:-translate-y-1 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Przełącz tryb ciemny"
      >
        <div className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="group flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground transition-all duration-300 ease-in-out hover:bg-accent/80 hover:-translate-y-1 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Włącz tryb ciemny" : "Włącz tryb jasny"}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}