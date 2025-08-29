"use client";

import keycloak from "@/lib/keycloak";
import { useAuthStore } from "@/store/auth";
import { LogIn } from "lucide-react";
import { env } from "@/env";

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    // Centramos el contenido a pantalla completa menos navbar+footer
    <section className="min-h-[calc(100dvh-8rem)] grid place-items-center">
      <div className="max-w-md w-full grid gap-6 text-center">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold">Bienvenido a {env.APP_NAME}</h1>
          <p className="opacity-80">{env.SLOGAN}</p>
        </div>

        <button
          className="btn-primary justify-center mx-auto"
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
          <LogIn size={18} />{" "}
          {isAuthenticated ? "Sesión activa" : "Ingresar con Keycloak"}
        </button>

        <p className="text-xs opacity-70">
          Al continuar aceptas los términos y autorizas el inicio de sesión
          mediante nuestro proveedor OIDC.
        </p>
      </div>
    </section>
  );
}
