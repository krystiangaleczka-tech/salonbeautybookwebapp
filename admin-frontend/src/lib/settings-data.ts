import {
  Bell,
  Building2,
  CalendarX2,
  Clock7,
  Hourglass,
  Link2,
  Settings,
  ShieldCheck,
  Users2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SettingsNavKey =
  | "overview"
  | "profil-salonu"
  | "zespol-roles"
  | "godziny-pracy"
  | "swieta-wyjatki"
  | "bufory"
  | "powiadomienia"
  | "prywatnosc"
  | "integracje";

export interface SettingsNavItem {
  key: SettingsNavKey;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const settingsNavItems: SettingsNavItem[] = [
  {
    key: "overview",
    label: "Przegląd",
    description: "Start w konfiguracji salonu – skróty do kluczowych kart.",
    href: "/ustawienia",
    icon: Settings,
  },
  {
    key: "profil-salonu",
    label: "Profil salonu",
    description: "Dane identyfikacyjne, dane kontaktowe i branding.",
    href: "/ustawienia/profil-salonu",
    icon: Building2,
  },
  {
    key: "zespol-roles",
    label: "Zespół i role",
    description: "Zarządzanie personelem, rolami i bezpieczeństwem kont.",
    href: "/ustawienia/zespol-roles",
    icon: Users2,
  },
  {
    key: "godziny-pracy",
    label: "Godziny pracy",
    description: "Harmonogramy bazowe i szablony grafików.",
    href: "/ustawienia/godziny-pracy",
    icon: Clock7,
  },
  {
    key: "swieta-wyjatki",
    label: "Święta i wyjątki",
    description: "Globalne dni wolne i urlopy zespołu.",
    href: "/ustawienia/swieta-wyjatki",
    icon: CalendarX2,
  },
  {
    key: "bufory",
    label: "Bufory czasowe",
    description: "Sloty przed i po usługach, reguły domyślne i wyjątki.",
    href: "/ustawienia/bufory",
    icon: Hourglass,
  },
  {
    key: "powiadomienia",
    label: "Powiadomienia",
    description: "Kanały komunikacji, timing i szablony SMS.",
    href: "/ustawienia/powiadomienia",
    icon: Bell,
  },
  {
    key: "prywatnosc",
    label: "Prywatność",
    description: "Eksport danych i rejestr czynności.",
    href: "/ustawienia/prywatnosc",
    icon: ShieldCheck,
  },
  {
    key: "integracje",
    label: "Integracje",
    description: "Połączenia z kalendarzami i bramkami powiadomień.",
    href: "/ustawienia/integracje",
    icon: Link2,
  },
];
