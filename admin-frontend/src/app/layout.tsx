import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { StyledJsxRegistry } from "@/components/styled-jsx-registry";

const inter = Inter({ subsets: ["latin" as const], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin" as const], variable: "--font-playfair" });
const jetbrains = JetBrains_Mono({ subsets: ["latin" as const], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Salon Piękności – Panel zarządzania",
  description: "Panel administracyjny do zarządzania rezerwacjami w salonie piękności.",
  icons: {
    icon: '/favicon.ico'
  }
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pl" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <StyledJsxRegistry>
          <Providers>{children}</Providers>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
