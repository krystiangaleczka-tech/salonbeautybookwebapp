"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { NavKey } from "@/lib/dashboard-data";
import { sidebarNavItems } from "@/lib/dashboard-data";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface DashboardLayoutProps {
  active: NavKey;
  header: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
  };
  children: React.ReactNode;
}

export function DashboardLayout({ active, header, children }: DashboardLayoutProps) {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Błąd podczas wylogowywania", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="hidden min-h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar p-6 md:flex">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="ml-3 text-xl font-semibold text-sidebar-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            Salon Piękności
          </p>
        </div>

        <nav className="space-y-2">
          {sidebarNavItems.map(({ key, label, icon: Icon, href, disabled }) => {
            const isActive = key === active;
            const baseClasses = "flex w-full items-center rounded-lg px-3 py-3 text-left transition-colors";
            const activeClasses = "bg-sidebar-primary text-sidebar-primary-foreground";
            const inactiveClasses = "text-sidebar-foreground hover:bg-sidebar-accent";
            const className = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

            if (href && !disabled) {
              return (
                <Link key={key} href={href} className={className}>
                  <Icon className="mr-3 h-5 w-5" />
                  {label}
                </Link>
              );
            }

            return (
              <button
                key={key}
                type="button"
                className={`${className} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                disabled={disabled}
              >
                <Icon className="mr-3 h-5 w-5" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 space-y-3 border-t border-sidebar-border pt-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-medium text-foreground">{user?.displayName ?? user?.email ?? "Użytkownik"}</p>
              <p className="text-sm text-muted-foreground">Zalogowany</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent"
          >
            Wyloguj się
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
              {header.title}
            </h1>
            {header.subtitle ? <p className="text-muted-foreground">{header.subtitle}</p> : null}
          </div>
          {header.actions ? <div className="flex items-center gap-4">{header.actions}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
