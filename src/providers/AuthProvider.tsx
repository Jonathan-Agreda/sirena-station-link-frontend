"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import keycloak from "@/lib/keycloak";
import { useAuthStore } from "@/store/auth";
import { jwtDecode } from "jwt-decode";
import { env } from "@/env";
import { useRouter } from "next/navigation";

type Props = { children: ReactNode };

type TokenPayload = {
  sub: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

declare global {
  interface Window {
    __kc_inited?: boolean;
    __kc_refresh_interval?: number;
  }
}

/** Extrae roles desde realm + client (frontend-spa) */
function extractRoles(p: TokenPayload) {
  const realm = p?.realm_access?.roles ?? [];
  const client = p?.resource_access?.[env.KC_CLIENT_ID]?.roles ?? [];
  return Array.from(new Set([...realm, ...client]));
}

/** Convierte el token en un perfil usable */
function parseToken(token: string) {
  const decoded = jwtDecode<TokenPayload>(token);
  return {
    id: decoded.sub,
    username: decoded.preferred_username,
    email: decoded.email,
    roles: extractRoles(decoded),
  };
}

export default function AuthProvider({ children }: Props) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();

  const qc = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Si ya está inicializado (hot reload), sincronizamos
    if (window.__kc_inited) {
      if (keycloak.token) {
        setAuth(keycloak.token, parseToken(keycloak.token));
      } else {
        clear();
      }
      return;
    }

    window.__kc_inited = true;

    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
        silentCheckSsoRedirectUri:
          typeof window !== "undefined"
            ? `${window.location.origin}/silent-check-sso.html`
            : undefined,
        redirectUri:
          typeof window !== "undefined" ? window.location.origin : undefined,
      })
      .then((authenticated) => {
        if (authenticated && keycloak.token) {
          setAuth(keycloak.token, parseToken(keycloak.token));

          // Redirigir a landing por rol solo si viene de "/" o "/login"
          const path = window.location.pathname;
          if (path === "/" || path.startsWith("/login")) {
            const { roles } = parseToken(keycloak.token);
            router.replace(
              roles.includes("RESIDENTE") ? "/resident" : "/dashboard"
            );
          }
        } else {
          clear();
        }
      })
      .catch(() => clear());

    // Refresh token cada 20s
    if (window.__kc_refresh_interval)
      clearInterval(window.__kc_refresh_interval);

    window.__kc_refresh_interval = window.setInterval(() => {
      keycloak
        .updateToken(40)
        .then((refreshed) => {
          if (refreshed && keycloak.token) {
            setAuth(keycloak.token, parseToken(keycloak.token));
          }
        })
        .catch(() => {
          clear();
          router.replace("/login");
        });
    }, 20000);
  }, [router, setAuth, clear]);

  // Variables de branding desde .env
  const cssVars = {
    ["--brand-primary" as any]: env.BRAND_PRIMARY,
    ["--brand-primary-fg" as any]: env.BRAND_PRIMARY_FG,
    ["--bg-light" as any]: env.BG_LIGHT,
    ["--fg-light" as any]: env.FG_LIGHT,
    ["--bg-dark" as any]: env.BG_DARK,
    ["--fg-dark" as any]: env.FG_DARK,
    ["--accent" as any]: env.ACCENT,
    ["--success" as any]: env.SUCCESS,
    ["--warning" as any]: env.WARNING,
    ["--danger" as any]: env.DANGER,
  } as React.CSSProperties;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div style={cssVars}>
        <QueryClientProvider client={qc}>
          {children}
          <Toaster richColors position="top-center" />
        </QueryClientProvider>
      </div>
    </ThemeProvider>
  );
}
