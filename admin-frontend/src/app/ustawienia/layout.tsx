import type { ReactNode } from "react";
import { SettingsShell } from "@/components/settings/settings-shell";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout
      active="settings"
      header={{
        title: "Ustawienia",
        subtitle: "Skonfiguruj salon, zespół i automatyzacje w jednym miejscu.",
      }}
    >
      <SettingsShell>{children}</SettingsShell>
    </DashboardLayout>
  );
}
