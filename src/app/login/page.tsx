"use client";

import keycloak from "@/lib/keycloak";
import { useAuthStore } from "@/store/auth";
import { LogIn } from "lucide-react";
import { env } from "@/env";
import { motion } from "framer-motion";

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section className="min-h-[calc(100dvh-8rem)] grid place-items-center">
      <div className="w-full grid gap-10 text-center">
        {/* Logo con animaciones */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: [1, 1.08, 1] }}
          transition={{
            opacity: { duration: 1.2, ease: "easeOut" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="relative">
            {/* Glow detrás */}
            <div className="absolute inset-0 blur-3xl opacity-30 bg-[var(--brand-primary)] rounded-full scale-125 animate-pulse" />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="420"
              height="140"
              viewBox="0 0 500 120"
              className="relative text-[--fg-light] dark:text-[--fg-dark]"
            >
              <defs>
                {/* Gradiente principal */}
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="var(--brand-primary)" />
                  <stop offset="1" stopColor="var(--accent)" />
                </linearGradient>

                {/* Gradiente para efecto "shine" */}
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

              {/* Texto alineado bien */}
              <g transform="translate(100,55)">
                <text
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="40"
                  fontWeight="700"
                  fill="currentColor"
                >
                  {env.APP_NAME}
                </text>
                <text
                  y="32"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="20"
                  fill="currentColor"
                  opacity="0.7"
                >
                  {env.SLOGAN}
                </text>
              </g>
            </svg>
          </div>
        </motion.div>

        {/* Contenido central con fade-in descendente */}
        <motion.div
          className="max-w-md mx-auto grid gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
        >
          <h1 className="text-3xl font-bold">Bienvenid@</h1>

          {/* Botón de login */}
          <button
            className="btn-primary justify-center mx-auto text-lg px-6 py-3 rounded-xl"
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
            <LogIn size={20} />{" "}
            {isAuthenticated ? "Sesión activa" : "Ingresar con Keycloak"}
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
