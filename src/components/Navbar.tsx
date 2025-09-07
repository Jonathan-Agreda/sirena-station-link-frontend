"use client";

import Link from "next/link";
import { env } from "@/env";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  User,
  KeyRound,
  HelpCircle,
  FileDown,
  ExternalLink,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import { Logo } from "@/components/Logo";
import ManualChangePasswordModal from "@/components/ManualChangePasswordModal";

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const pathname = usePathname();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const helpRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  const isStaff = ["SUPERADMIN", "ADMIN", "GUARDIA"].includes(user?.role ?? "");

  // Cerrar menús al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t))
        setUserMenuOpen(false);
      if (helpRef.current && !helpRef.current.contains(t))
        setHelpMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cerrar menús/modales al cambiar ruta o auth
  useEffect(() => {
    if (userMenuOpen) setUserMenuOpen(false);
    if (helpMenuOpen) setHelpMenuOpen(false);
    if (changePassOpen) setChangePassOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isAuthenticated]);

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
                {/* Links */}
                {pathname === "/" && (
                  <>
                    {isStaff && (
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)] dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)] transition"
                      >
                        Dashboard 📋
                      </Link>
                    )}
                    <Link
                      href="/sirenastation"
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)] dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)] transition"
                    >
                      SirenaStation 📢
                    </Link>
                  </>
                )}

                {/* --- Username + menú --- */}
                <div className="relative" ref={menuRef}>
                  {/* Desktop: username visible */}
                  <button
                    onClick={() => {
                      setUserMenuOpen((v) => !v);
                      setHelpMenuOpen(false);
                    }}
                    title={user.username}
                    className="hidden cursor-pointer sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:text-sm font-medium border-[color-mix(in_oklab,var(--brand-primary),transparent_60%)] bg-[color-mix(in_oklab,transparent,var(--brand-primary)_12%)] text-[color-mix(in_oklab,var(--brand-primary),black_30%)] dark:text-[color-mix(in_oklab,var(--brand-primary),white_20%)] transition hover:opacity-100"
                    aria-expanded={userMenuOpen}
                  >
                    <User size={14} className="opacity-70" />
                    {user.username}
                  </button>

                  {/* Mobile: solo icono */}
                  <button
                    onClick={() => {
                      setUserMenuOpen((v) => !v);
                      setHelpMenuOpen(false);
                    }}
                    className="sm:hidden cursor-pointer flex items-center justify-center rounded-full border p-2 text-sm border-[color-mix(in_oklab,var(--brand-primary),transparent_60%)] bg-[color-mix(in_oklab,transparent,var(--brand-primary)_12%)] text-[var(--brand-primary)] hover:opacity-100"
                    aria-label="Menú de usuario"
                    aria-expanded={userMenuOpen}
                  >
                    <User size={18} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 min-w-56 rounded-xl border border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1 z-50">
                      {/* Header con username (nuevo) */}
                      <div className="px-3 py-2 mb-1 flex items-center gap-2 rounded-lg bg-neutral-50/80 dark:bg-white/5">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                          <User size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {user.email || user.role}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setChangePassOpen(true);
                        }}
                        className="w-full cursor-pointer text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
                      >
                        <KeyRound
                          size={16}
                          className="shrink-0 text-[var(--brand-primary)] opacity-90"
                        />
                        Cambiar contraseña
                      </button>

                      <div className="my-1 h-px bg-neutral-200 dark:bg-white/10" />

                      <div className="px-3 pb-1">
                        <LogoutButton />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)] dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)] transition"
              >
                Iniciar sesión
              </Link>
            )}

            {/* --- Menú de Ayuda (?) visible para todos --- */}
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => {
                  setHelpMenuOpen((v) => !v);
                  setUserMenuOpen(false);
                }}
                className="cursor-pointer rounded-lg p-2 hover:bg-[color-mix(in_oklab,transparent,black_10%)] dark:hover:bg-[color-mix(in_oklab,transparent,white_10%)]"
                aria-label="Ayuda"
                aria-expanded={helpMenuOpen}
                title="Ayuda"
              >
                <HelpCircle size={18} />
              </button>

              {helpMenuOpen && (
                <div className="absolute right-0 mt-2 min-w-56 rounded-xl border border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1 z-50">
                  <a
                    href="/manuals/manual.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setHelpMenuOpen(false)}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
                  >
                    <ExternalLink size={16} className="shrink-0 opacity-90" />
                    Ver en el navegador
                  </a>
                  <a
                    href="/manuals/manual.pdf"
                    download
                    onClick={() => setHelpMenuOpen(false)}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10"
                  >
                    <FileDown size={16} className="shrink-0 opacity-90" />
                    Descargar manual (PDF)
                  </a>
                </div>
              )}
            </div>

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

      {/* Modal manual montado aquí */}
      <ManualChangePasswordModal
        open={changePassOpen}
        onClose={() => setChangePassOpen(false)}
      />

      {/* Animación del logo */}
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
