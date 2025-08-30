"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const api: any = (useAuthStore as any).persist;
    if (api?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }
    const unsub = api?.onFinishHydration?.(() => setHydrated(true));
    // fallback por si el api no existe (no debería)
    const t = setTimeout(() => setHydrated(true), 0);
    return () => {
      unsub?.();
      clearTimeout(t);
    };
  }, []);

  return hydrated;
}
