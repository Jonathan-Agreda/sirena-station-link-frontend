import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { env } from "@/env";
import { Providers } from "@/components/Providers";
import AuthBootstrap from "@/components/AuthBootstrap"; // 👈 importa el bootstrap
import ClientInit from "@/components/ClientInit"; // 👈 NUEVO: arranque seguro móvil

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
        <Providers>
          {/* --- Arranque seguro móvil (Android/Chrome) --- */}
          <ClientInit />
          <AuthBootstrap /> {/* 👈 aquí se monta globalmente */}
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
