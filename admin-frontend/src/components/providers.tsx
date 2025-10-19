"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts";
import { ThemeProvider } from "@/contexts/theme-context";
import { EmployeeProvider } from "@/contexts/employee-context";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EmployeeProvider>{children}</EmployeeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
