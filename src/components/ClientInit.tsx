// src/components/ClientInit.tsx
"use client";

import { useEffect } from "react";
import { primeFeedback, safeBeep, safeVibrate } from "@/lib/device-feedback";

// Parche defensivo en runtime para Android/Chrome.
// 1) "Primea" el audio tras el primer gesto del usuario.
// 2) Envuelve navigator.vibrate con try/catch y sanitización.
// 3) Evita que errores de promesas no manejadas crasheen la UI.

export default function ClientInit() {
  useEffect(() => {
    const prime = () => {
      primeFeedback();
      // Pequeña vibración y beep opcionales para “desbloquear” policies (no pasa nada si fallan)
      safeVibrate(10);
      safeBeep();
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("touchstart", prime);
      window.removeEventListener("click", prime);
    };
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("touchstart", prime, { once: true });
    window.addEventListener("click", prime, { once: true });

    // Blindaje global de errores no manejados (no rompe, solo loggea)
    const onRejection = (e: PromiseRejectionEvent) => {
      // Muchos browsers móviles lanzan DOMException por audio/vibrate; los ignoramos
      // y dejamos un log mínimo para diagnosticar si hace falta.
      console.debug("[Ignored unhandledrejection]", e?.reason);
      e.preventDefault();
    };
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
