import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { env } from "@/env";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: `${env.APP_NAME} · ${env.SLOGAN}`,
  description: env.SLOGAN,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="es">
      <body className="app-shell">
        {/* Proveedor de temas */}
        <ThemeProvider
          attribute="class" // añade .dark al <html>
          defaultTheme="light" // arranca claro
          enableSystem={true} // opcional: respeta tema del sistema
          disableTransitionOnChange // evita flash
        >
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
