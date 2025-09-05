"use client";

import { useEffect } from "react";
import { primeFeedback, safeBeep } from "@/lib/device-feedback";

// Parche defensivo en runtime para Android/Chrome.
// Quitamos cualquier intento de vibración.

export default function ClientInit() {
  useEffect(() => {
    const prime = () => {
      primeFeedback();
      // Intento de “desbloquear” audio; si falla, no rompe.
      safeBeep();
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("touchstart", prime);
      window.removeEventListener("click", prime);
    };
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("touchstart", prime, { once: true });
    window.addEventListener("click", prime, { once: true });

    const onRejection = (e: PromiseRejectionEvent) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[Ignored unhandledrejection]", e?.reason);
      }
      e.preventDefault();
    };
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
