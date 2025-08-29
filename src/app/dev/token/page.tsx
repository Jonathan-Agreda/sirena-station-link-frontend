"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import keycloak from "@/lib/keycloak";
import { env } from "@/env";
import { useAuthStore } from "@/store/auth";

type TokenPayload = {
  sub: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

export default function DevToken() {
  const [payload, setPayload] = useState<TokenPayload | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const { isAuthenticated } = useAuthStore();

  const load = () => {
    if (!keycloak.token) {
      setPayload(null);
      setRoles([]);
      return;
    }
    const p = jwtDecode<TokenPayload>(keycloak.token);
    const realm = p.realm_access?.roles ?? [];
    const client = p.resource_access?.[env.KC_CLIENT_ID]?.roles ?? [];
    setRoles(Array.from(new Set([...realm, ...client])));
    setPayload(p);
  };

  // Refresca cuando cambia el estado de auth
  useEffect(() => {
    if (!isAuthenticated) return;
    load();
  }, [isAuthenticated]);

  // Escucha eventos de KC (si entras directo a /dev/token)
  useEffect(() => {
    const onOk = () => load();
    const onRefresh = (refreshed: boolean) => refreshed && load();

    keycloak.onAuthSuccess = onOk;
    keycloak.onAuthRefreshSuccess = onOk;
    keycloak.onTokenExpired = () =>
      keycloak
        .updateToken(40)
        .then(onRefresh)
        .catch(() => {});

    return () => {
      keycloak.onAuthSuccess = undefined;
      keycloak.onAuthRefreshSuccess = undefined;
      keycloak.onTokenExpired = undefined;
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="container-max py-8">
        <h1 className="text-2xl font-bold mb-4">Token Debug</h1>
        <p className="mb-4">
          No hay sesión. Inicia sesión para inspeccionar el token.
        </p>
        <button
          className="btn-primary"
          onClick={() =>
            keycloak.login({
              scope: "openid profile email roles",
              redirectUri:
                typeof window !== "undefined"
                  ? `${window.location.origin}/dev/token`
                  : undefined,
            })
          }
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="container-max py-8">
      <h1 className="text-2xl font-bold mb-4">Token Debug</h1>
      <p className="mb-2">
        Roles detectados:{" "}
        <strong>{roles.length > 0 ? roles.join(", ") : "(ninguno)"}</strong>
      </p>
      <pre className="rounded-xl border p-4 text-xs overflow-auto">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}
