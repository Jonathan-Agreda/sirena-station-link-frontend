import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { env } from "@/env";

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
      {/* Hacemos el layout de toda la página en columna para empujar el footer abajo */}
      <body className="min-h-dvh flex flex-col">
        <AuthProvider>
          <Navbar />
          {/* El main ocupa todo el alto restante */}
          <main className="container-max flex-1 py-8">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
