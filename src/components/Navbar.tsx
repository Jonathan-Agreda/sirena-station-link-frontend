"use client";

import Image from "next/image";
import Link from "next/link";
import { env } from "@/env";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <header className="navbar">
      <div className="container-max flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo.svg"
            alt={env.APP_NAME}
            width={128}
            height={32}
          />
          <span className="sr-only">{env.APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm hover:underline">
            Ingresar
          </Link>

          {/* Guard de montaje: mientras no monta, renderizamos un placeholder neutro */}
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
