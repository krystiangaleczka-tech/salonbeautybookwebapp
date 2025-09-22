"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { settingsNavItems } from "@/lib/settings-data";

interface SettingsShellProps {
  children: ReactNode;
}

export function SettingsShell({ children }: SettingsShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur">
        <nav className="flex flex-wrap gap-2">
          {settingsNavItems.map(({ key, label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            const baseClasses =
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors";
            const activeClasses = "border-primary bg-primary text-primary-foreground shadow";
            const inactiveClasses =
              "border-transparent bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground";

            return (
              <Link key={key} href={href} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <section className="space-y-6">{children}</section>
    </div>
  );
}
