// src/lib/device-feedback.ts
// Utilidades seguras para vibración, beep y notificaciones en navegadores móviles.
// No importa si el browser no soporta algo: NO rompe la app.

let primed = false;
let audioEl: HTMLAudioElement | null = null;

// Data URI con un beep corto (440Hz ~120ms)
const BEEP_DATA_URI =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAChAAAAAAAAgACAgICA//////////////////////////////////////////8AAAAA";

function primeAudioOnce() {
  if (primed) return;
  primed = true;
  try {
    audioEl = new Audio(BEEP_DATA_URI);
    audioEl.preload = "auto";
    // El intento de reproducción tras el primer gesto del usuario lo hace ClientInit.
  } catch {
    // silencio
  }
}

export function safeBeep() {
  try {
    if (!audioEl) return;
    audioEl.currentTime = 0;
    // No lanzamos error si el autoplay está bloqueado
    void audioEl.play().catch(() => {});
  } catch {
    // silencio
  }
}

export function safeVibrate(input?: number | number[]) {
  try {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate !== "function") return;

    // Sanitizar: solo números positivos, máx 10 entradas, máx 1000ms cada una
    const clamp = (n: number) => Math.max(0, Math.min(1000, Math.floor(n)));
    let pattern: number | number[] = 120;
    if (typeof input === "number") {
      pattern = clamp(input);
    } else if (Array.isArray(input) && input.length > 0) {
      pattern = input.slice(0, 10).map((n) => clamp(Number(n) || 0));
    }

    // Evitar vibrar en background (algunos Android lo odian)
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    // TS ya conoce navigator.vibrate; solo lo llamamos si es función.
    navigator.vibrate(pattern);
  } catch {
    // silencio
  }
}

export function primeFeedback() {
  primeAudioOnce();
}

export function safeNotify(title: string, opts?: NotificationOptions) {
  try {
    if (typeof Notification === "undefined") return;
    if (!("permission" in Notification)) return;
    if (Notification.permission === "granted") {
      new Notification(title, opts);
    }
  } catch {
    // silencio
  }
}
