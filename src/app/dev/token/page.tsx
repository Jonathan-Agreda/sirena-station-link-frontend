"use client";

import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Skeleton } from "@/components/ui/Skeleton";

type TokenPayload = {
  exp: number; // epoch seconds
  iat: number;
  [key: string]: unknown;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function DevToken() {
  const { isAuthenticated, profile, accessToken } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Evitar parpadeo inicial
  useEffect(() => setHydrated(true), []);

  // Calcular tiempo restante
  useEffect(() => {
    if (!accessToken) return;

    const decoded = jwtDecode<TokenPayload>(accessToken);
    if (!decoded?.exp) return;

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = decoded.exp - now;
      setTimeLeft(remaining > 0 ? remaining : 0);
    };

    tick(); // inicial
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [accessToken]);

  if (!hydrated) {
    return (
      <section className="min-h-[calc(100dvh-8rem)] container-max py-8 grid gap-6">
        <h1 className="text-2xl font-bold">Token Debug</h1>
        <div className="grid gap-4">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="min-h-[calc(100dvh-8rem)] container-max py-8 grid gap-6">
        <h1 className="text-2xl font-bold">Token Debug</h1>
        <p className="opacity-80">
          No hay sesión activa. Ingresa primero por <code>/login</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100dvh-8rem)] container-max py-8 grid gap-6">
      <h1 className="text-2xl font-bold">Token Debug</h1>

      <p className="opacity-80">
        Roles detectados:{" "}
        <strong>
          {profile?.roles?.length ? profile.roles.join(", ") : "(ninguno)"}
        </strong>
      </p>

      {timeLeft !== null && (
        <p className="text-sm opacity-70">
          ⏳ Tiempo restante del token: <strong>{formatTime(timeLeft)}</strong>
        </p>
      )}

      <div className="rounded-xl border p-4 text-xs overflow-auto">
        <pre>{JSON.stringify({ profile, accessToken }, null, 2)}</pre>
      </div>
    </section>
  );
}
