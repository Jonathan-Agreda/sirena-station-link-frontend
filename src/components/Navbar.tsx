"use client";

import Link from "next/link";
import { env } from "@/env";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, profile } = useAuthStore();

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <header className="navbar">
      <div className="container-max flex h-16 items-center justify-between">
        {/* Logo inline SVG adaptado a modo claro/oscuro */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            width="160"
            height="48"
            viewBox="0 0 256 64"
            className="text-[--fg-light] dark:text-[--fg-dark]"
          >
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--brand-primary)" />
                <stop offset="1" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <g transform="translate(8,8)">
              <rect
                x="0"
                y="20"
                width="24"
                height="20"
                rx="4"
                fill="var(--brand-primary)"
              />
              <rect
                x="6"
                y="16"
                width="12"
                height="8"
                rx="2"
                fill="var(--brand-primary)"
              />
              <circle cx="12" cy="30" r="3" fill="var(--brand-primary-fg)" />
              <path
                d="M26,24 C34,20 34,40 26,36"
                fill="none"
                stroke="url(#g)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M30,22 C42,16 42,44 30,38"
                fill="none"
                stroke="url(#g)"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.7"
              />
            </g>
            {/* Texto ocultable en móviles */}
            <g transform="translate(64,16)" className="hidden sm:block">
              <text
                x="0"
                y="18"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="20"
                fontWeight="700"
                fill="currentColor"
              >
                {env.APP_NAME}
              </text>
              <text
                x="0"
                y="40"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="13"
                fill="currentColor"
                opacity="0.7"
              >
                {env.SLOGAN}
              </text>
            </g>
          </svg>
          <span className="sr-only">{env.APP_NAME}</span>
        </Link>

        {/* Right side nav */}
        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm opacity-80 hidden sm:inline">
                {profile?.username}
              </span>
              <LogoutButton />
            </>
          ) : null}

          {/* Toggle tema */}
          <button
            onClick={toggle}
            className="rounded-lg p-2 hover:bg-[color-mix(in_oklab,transparent,black_10%)] dark:hover:bg-[color-mix(in_oklab,transparent,white_10%)]"
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
  );
}
