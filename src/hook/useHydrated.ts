"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

// CAMBIO 1: Se crea un tipo que describe la API interna del middleware `persist` de Zustand.
type StoreWithPersist = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void; // `unsub` function
  };
};

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // CAMBIO 2: Se usa el nuevo tipo para el "casting" en lugar de `any`.
    // El `unknown` es un paso intermedio más seguro que `any`.
    const api = (useAuthStore as unknown as StoreWithPersist).persist;

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
