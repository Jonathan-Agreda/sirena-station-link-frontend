"use client";

import { ThemeProvider } from "next-themes";
import { ClientToaster } from "@/components/ClientToaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange
    >
      {children}
      <ClientToaster />
    </ThemeProvider>
  );
}
