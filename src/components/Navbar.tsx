"use client";

import Link from "next/link";
import { env } from "@/env";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { Logo } from "@/components/Logo";

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  const isStaff = ["SUPERADMIN", "ADMIN", "GUARDIA"].includes(user?.role ?? "");

  return (
    <>
      <header className="navbar border-b dark:border-neutral-800">
        <div className="container-max flex h-16 items-center justify-between px-3 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90">
            <div className="logo-navbar-animated">
              <Logo className="h-8 sm:h-10 w-auto text-[--fg-light] dark:text-[--fg-dark]" />
            </div>
            <span className="sr-only">{env.APP_NAME}</span>
          </Link>

          {/* Right side */}
          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isAuthenticated && user ? (
              <>
                {/* ======================= INICIO DE CAMBIOS ======================= */}

                {/* Lógica para la página de INICIO ("/") */}
                {pathname === "/" && (
                  <>
                    {/* El Staff ve ambos enlaces */}
                    {isStaff && (
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium
                                   border border-[var(--brand-primary)] text-[var(--brand-primary)]
                                   hover:bg-[var(--brand-primary)] hover:text-white
                                   dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)]
                                   dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)]
                                   transition"
                      >
                        Dashboard 📋
                      </Link>
                    )}
                    {/* Todos los usuarios logueados ven SirenaStation en el Home */}
                    <Link
                      href="/sirenastation"
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium
                                   border border-[var(--brand-primary)] text-[var(--brand-primary)]
                                   hover:bg-[var(--brand-primary)] hover:text-white
                                   dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)]
                                   dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)]
                                   transition"
                    >
                      SirenaStation 📢
                    </Link>
                  </>
                )}

                {/* Lógica para la página de SIRENASTATION */}
                {pathname.startsWith("/sirenastation") && isStaff && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium
                                   border border-[var(--brand-primary)] text-[var(--brand-primary)]
                                   hover:bg-[var(--brand-primary)] hover:text-white
                                   dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)]
                                   dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)]
                                   transition"
                  >
                    Dashboard 📋
                  </Link>
                )}

                {/* Lógica para la página de DASHBOARD */}
                {pathname.startsWith("/dashboard") && isStaff && (
                  <Link
                    href="/sirenastation"
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium
                                   border border-[var(--brand-primary)] text-[var(--brand-primary)]
                                   hover:bg-[var(--brand-primary)] hover:text-white
                                   dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)]
                                   dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)]
                                   transition"
                  >
                    SirenaStation 📢
                  </Link>
                )}

                {/* ======================== FIN DE CAMBIOS ======================== */}

                <span className="hidden sm:inline text-sm opacity-80">
                  {user.username}
                </span>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
                               border border-[var(--brand-primary)] text-[var(--brand-primary)]
                               hover:bg-[var(--brand-primary)] hover:text-white
                               dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)]
                               dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)]
                               transition"
              >
                Iniciar sesión
              </Link>
            )}

            {/* Tema */}
            <button
              onClick={toggle}
              className="rounded-lg p-2 cursor-pointer hover:bg-[color-mix(in_oklab,transparent,black_10%)] dark:hover:bg-[color-mix(in_oklab,transparent,white_10%)]"
              aria-label="Cambiar tema"
            >
              {mounted ? (
                isDark ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )
              ) : (
                <span className="inline-block w-[18px] h-[18px]" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Estilos de animación */}
      <style jsx global>{`
        .logo-navbar-animated .wave1,
        .logo-navbar-animated .wave2 {
          transform-box: fill-box;
          transform-origin: center;
        }
        .logo-navbar-animated .wave1 {
          animation: wavePropagate 2.5s ease-out infinite;
        }
        .logo-navbar-animated .wave2 {
          animation: wavePropagate 2.5s ease-out 1.25s infinite;
        }
        @keyframes wavePropagate {
          0% {
            opacity: 0;
            transform: translateX(0) scale(0.9);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(12px) scale(1.15);
          }
        }
      `}</style>
    </>
  );
}
