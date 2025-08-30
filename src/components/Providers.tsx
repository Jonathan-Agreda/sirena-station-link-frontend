"use client";

import { ThemeProvider } from "next-themes";
import { ClientToaster } from "@/components/ClientToaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Instanciamos un QueryClient y lo memoizamos para que no se recree en cada render
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ClientToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
