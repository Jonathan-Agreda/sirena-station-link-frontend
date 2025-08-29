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
      <body className="app-shell">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
