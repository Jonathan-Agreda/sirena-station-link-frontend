"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import keycloak from "@/lib/keycloak";
import { useAuthStore } from "@/store/auth";
import { jwtDecode } from "jwt-decode"; // <- named export
import { env } from "@/env";
import { useRouter, usePathname } from "next/navigation";

type Props = { children: ReactNode };

type TokenPayload = {
  sub: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
};

export default function AuthProvider({ children }: Props) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();
  const pathname = usePathname();

  const qc = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    let isMounted = true;

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
        if (!isMounted) return;

        if (authenticated && keycloak.token) {
          const decoded = jwtDecode<TokenPayload>(keycloak.token);
          const roles = decoded?.realm_access?.roles || [];

          setAuth(keycloak.token, {
            id: decoded.sub,
            username: decoded.preferred_username,
            email: decoded.email,
            roles,
          });

          if (pathname === "/" || pathname.startsWith("/login")) {
            if (roles.includes("RESIDENTE")) router.replace("/resident");
            else router.replace("/dashboard");
          }
        } else {
          clear();
          if (
            pathname.startsWith("/dashboard") ||
            pathname.startsWith("/resident")
          ) {
            router.replace("/login");
          }
        }
      })
      .catch(() => {
        clear();
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/resident")
        ) {
          router.replace("/login");
        }
      });

    const interval = setInterval(() => {
      keycloak
        .updateToken(40)
        .then((refreshed) => {
          if (refreshed && keycloak.token) {
            const decoded = jwtDecode<TokenPayload>(keycloak.token);
            const roles = decoded?.realm_access?.roles || [];
            setAuth(keycloak.token, {
              id: decoded.sub,
              username: decoded.preferred_username,
              email: decoded.email,
              roles,
            });
          }
        })
        .catch(() => {
          clear();
          router.replace("/login");
        });
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname, router, setAuth, clear]);

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
