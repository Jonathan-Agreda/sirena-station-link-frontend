"use client";

import keycloak from "@/lib/keycloak";
import { useAuthStore } from "@/store/auth";
import { LogIn } from "lucide-react";
import { env } from "@/env";
import { motion } from "framer-motion";

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section className="min-h-[100svh] grid place-items-center overflow-x-hidden">
      <div className="w-full max-w-5xl px-4 py-10 grid gap-10 text-center">
        {/* Logo con animaciones */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: [1, 1.06, 1] }}
          transition={{
            opacity: { duration: 1.1, ease: "easeOut" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {/* Glow recortado circular */}
          <div className="relative w-full max-w-[560px] mx-auto flex justify-center pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[min(70vw,28rem)] rounded-full bg-[radial-gradient(circle,var(--brand-primary)_0%,transparent_70%)] opacity-30 animate-pulse pointer-events-none" />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 500 120"
              className="relative mx-auto w-[min(92vw,520px)] h-auto text-[--fg-light] dark:text-[--fg-dark] pointer-events-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="var(--brand-primary)" />
                  <stop offset="1" stopColor="var(--accent)" />
                </linearGradient>
                <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="50%" stopColor="white" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <mask id="shine-mask">
                  <rect width="100%" height="100%" fill="url(#shine)">
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      from="-500 0"
                      to="500 0"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </rect>
                </mask>
              </defs>

              {/* Ícono */}
              <g transform="translate(20,28)">
                <rect
                  x="0"
                  y="20"
                  width="40"
                  height="32"
                  rx="6"
                  fill="var(--brand-primary)"
                />
                <rect
                  x="8"
                  y="12"
                  width="20"
                  height="12"
                  rx="3"
                  fill="var(--brand-primary)"
                />
                <circle cx="20" cy="36" r="5" fill="var(--brand-primary-fg)" />
                <path
                  d="M46,28 C60,20 60,60 46,52"
                  fill="none"
                  stroke="url(#g)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  mask="url(#shine-mask)"
                />
                <path
                  d="M52,24 C72,16 72,64 52,56"
                  fill="none"
                  stroke="url(#g)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.7"
                  mask="url(#shine-mask)"
                />
              </g>

              {/* Marca */}
              <g transform="translate(90,55)">
                <text
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="38"
                  fontWeight="700"
                  fill="currentColor"
                >
                  {env.APP_NAME}
                </text>
                <text
                  y="32"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="18"
                  fill="currentColor"
                  opacity="0.7"
                >
                  {env.SLOGAN}
                </text>
              </g>
            </svg>
          </div>
        </motion.div>

        {/* Contenido central con fade-in */}
        <motion.div
          className="max-w-md mx-auto grid gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold">Bienvenid@</h1>

          <button
            className="btn-primary justify-center mx-auto text-base sm:text-lg px-6 py-3 rounded-xl cursor-pointer"
            onClick={() =>
              keycloak.login({
                redirectUri:
                  typeof window !== "undefined"
                    ? window.location.origin
                    : undefined,
              })
            }
            disabled={isAuthenticated}
          >
            <LogIn size={20} />
            <span className="ml-2">
              {isAuthenticated ? "Sesión activa" : "Ingresar con Keycloak"}
            </span>
          </button>

          <p className="text-xs opacity-70">
            Al continuar aceptas los términos y autorizas el inicio de sesión
            mediante nuestro proveedor OIDC.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
