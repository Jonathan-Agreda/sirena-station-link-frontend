"use client";

import { useDashboardSirens } from "@/hook/useDashboardSirens";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSirenTimerStore } from "@/store/sirenTimer";

/* ---------- Utilidades ---------- */
function formatTime(sec?: number) {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/** Detecta Android + Chrome (donde el constructor de Notification puede lanzar excepción) */
const isAndroidChrome =
  typeof navigator !== "undefined" &&
  /Android/i.test(navigator.userAgent) &&
  /Chrome\/\d+/i.test(navigator.userAgent) &&
  !/Firefox/i.test(navigator.userAgent);

/* ---------- Tipo extendido (no toca el hook) ---------- */
type SirenItem = {
  deviceId: string;
  siren: "ON" | "OFF";
  online: boolean;
  pending?: boolean;
  ip?: string;
  countdown?: number; // del socket actual
  updatedAt?: string; // ISO
  autoOffAt?: string; // ISO (si backend lo aporta)
};

export default function DashboardSirens() {
  const { sirens, sendCommand } = useDashboardSirens() as {
    sirens: SirenItem[];
    sendCommand: (deviceId: string, action: "ON" | "OFF") => void;
  };

  /* ---------- Persistencia de contadores ---------- */
  const AUTO_OFF_MS = Number(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) || 300000; // ms

  const timers = useSirenTimerStore((s) => s.timers);
  const setTimer = useSirenTimerStore((s) => s.setTimer);
  const clearTimer = useSirenTimerStore((s) => s.clearTimer);
  const getTimer = useSirenTimerStore((s) => s.getTimer);

  // Rehidratar/actualizar timers cuando cambia el listado recibido por socket
  useEffect(() => {
    const now = Date.now();
    for (const s of sirens) {
      const existing = getTimer(s.deviceId);

      if (s.siren === "ON") {
        // 1) usa autoOffAt si viene del backend
        const autoOffAt = s.autoOffAt
          ? new Date(s.autoOffAt).getTime()
          : undefined;
        // 2) si no, usa updatedAt + AUTO_OFF_MS
        const updatedAtMs = s.updatedAt
          ? new Date(s.updatedAt).getTime()
          : undefined;
        // 3) si tampoco, usa countdown del socket como respaldo
        const fromCountdown =
          typeof s.countdown === "number" && s.countdown > 0
            ? now + s.countdown * 1000
            : undefined;

        const expiresAt =
          autoOffAt ??
          (updatedAtMs
            ? updatedAtMs + AUTO_OFF_MS
            : fromCountdown ?? now + AUTO_OFF_MS);

        // evita escribir en cada render: solo si no existe o cambió de forma significativa
        if (!existing || Math.abs(existing.expiresAt - expiresAt) > 1500) {
          setTimer(s.deviceId, expiresAt, Math.floor(AUTO_OFF_MS / 1000));
        }
      } else if (existing) {
        clearTimer(s.deviceId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sirens]);

  // Tick 1s para calcular restantes persistidos
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const getDisplayCountdown = useCallback(
    (deviceId: string, fallback?: number) => {
      const t = timers[deviceId];
      if (t?.expiresAt) {
        return Math.max(0, Math.floor((t.expiresAt - nowTs) / 1000));
      }
      return fallback ?? 0;
    },
    [timers, nowTs]
  );

  /* ----------------------- Orden y métricas ----------------------- */
  const sortedSirens = useMemo(
    () =>
      [...sirens].sort((a, b) =>
        a.deviceId.localeCompare(b.deviceId, "en", { numeric: true })
      ),
    [sirens]
  );

  const total = sortedSirens.length;
  const online = useMemo(
    () => sortedSirens.filter((s) => s.online),
    [sortedSirens]
  );
  const onCount = useMemo(
    () => sortedSirens.filter((s) => s.siren === "ON").length,
    [sortedSirens]
  );
  const anyPending = sortedSirens.some((s) => s.pending);

  const allOnlineOn =
    online.length > 0 && online.every((s) => s.siren === "ON");
  const bulkTarget: "ON" | "OFF" = allOnlineOn ? "OFF" : "ON";
  const canBulk = online.length > 0 && !anyPending;

  const handleBulkToggle = () => {
    if (!canBulk) return;
    for (const s of online) {
      if (s.pending) continue;
      sendCommand(s.deviceId, bulkTarget);
    }
  };

  /* ----------------------- Alertas del dashboard ----------------------- */
  const activeOnline = useMemo(
    () => online.filter((s) => s.siren === "ON"),
    [online]
  );

  // En Android/Chrome desactivamos notifs por defecto
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined" || isAndroidChrome) return false;
    return "Notification" in window && Notification.permission === "granted";
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);
  const intervalMs = 20000;

  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureAudioCtx = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          (typeof window !== "undefined" &&
            (window.AudioContext ||
              (window as WindowWithAudioContext).webkitAudioContext)) ||
          undefined;
        if (typeof Ctx === "function") {
          audioCtxRef.current = new Ctx();
        }
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const safeBeep = useCallback(() => {
    try {
      const ctx = ensureAudioCtx();
      if (!ctx || ctx.state !== "running") return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.001;
      osc.connect(gain).connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      /* no-op */
    }
  }, [ensureAudioCtx]);

  // Desbloquear audio con gesto del usuario
  useEffect(() => {
    if (!soundEnabled) return;
    const resume = () => {
      try {
        ensureAudioCtx()?.resume?.();
      } catch {}
    };
    window.addEventListener("click", resume, { once: true });
    window.addEventListener("touchstart", resume, { once: true });
    return () => {
      window.removeEventListener("click", resume);
      window.removeEventListener("touchstart", resume);
    };
  }, [soundEnabled, ensureAudioCtx]);

  // Pedir permiso de notifs (no en Android/Chrome)
  useEffect(() => {
    try {
      if (typeof window === "undefined" || isAndroidChrome) return;
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") {
        Notification.requestPermission()
          .then((p) => {
            if (p === "granted") setAlertsEnabled(true);
          })
          .catch(() => {});
      }
    } catch {
      /* no-op */
    }
  }, []);

  async function requestNotifPermission() {
    try {
      if (isAndroidChrome) return; // deshabilitado en Android/Chrome
      if (!(typeof window !== "undefined" && "Notification" in window)) return;
      const p = await Notification.requestPermission();
      if (p === "granted") setAlertsEnabled(true);
    } catch {
      /* no-op */
    }
  }

  /** Notificación segura: no lanza en Android/Chrome ni en navegadores sin soporte */
  const showNotificationSafe = useCallback(
    (title: string, options?: NotificationOptions) => {
      try {
        if (isAndroidChrome) return false;
        if (typeof window === "undefined" || !("Notification" in window))
          return false;
        if (Notification.permission !== "granted") return false;
        if (typeof window.Notification !== "function") return false;

        const n = new window.Notification(title, options) as Notification & {
          close?: () => void;
        };

        setTimeout(() => {
          try {
            n.close?.(); // <-- sin any, tipado seguro
          } catch {}
        }, 6000);

        return true;
      } catch {
        // Si algo explota, apagamos alertas para que no vuelva a intentar
        setAlertsEnabled(false);
        return false;
      }
    },
    []
  );

  /** Memoizamos para satisfacer react-hooks/exhaustive-deps */
  const notifyAggregate = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const title =
        ids.length === 1 ? "Sirena ACTIVA" : `Sirenas ACTIVAS (${ids.length})`;
      const MAX = 8;
      const shown = ids.slice(0, MAX).join(", ");
      const rest = ids.length > MAX ? `, +${ids.length - MAX} más` : "";
      const body = shown + rest;
      showNotificationSafe(title, { body, tag: "sirena-aggregate" });
    },
    [showNotificationSafe]
  );

  const prevActiveIdsRef = useRef<string[]>([]);
  useEffect(() => {
    const current = activeOnline.map((s) => s.deviceId);
    const previous = prevActiveIdsRef.current;
    const newlyOn = current.filter((id) => !previous.includes(id));

    if (newlyOn.length > 0 && alertsEnabled && !muted) {
      notifyAggregate(current);
      if (soundEnabled) {
        try {
          ensureAudioCtx()?.resume?.();
          safeBeep();
        } catch {}
      }
    }

    prevActiveIdsRef.current = current;
  }, [
    activeOnline,
    alertsEnabled,
    muted,
    soundEnabled,
    safeBeep,
    ensureAudioCtx,
    notifyAggregate, // <-- agregado
  ]);

  useEffect(() => {
    if (!alertsEnabled || muted || activeOnline.length === 0) return;
    const tick = () => {
      const ids = activeOnline.map((s) => s.deviceId);
      notifyAggregate(ids);
      if (soundEnabled) {
        try {
          ensureAudioCtx()?.resume?.();
          safeBeep();
        } catch {}
      }
    };
    const t = setInterval(tick, intervalMs);
    return () => clearInterval(t);
  }, [
    alertsEnabled,
    muted,
    soundEnabled,
    activeOnline,
    intervalMs,
    safeBeep,
    ensureAudioCtx,
    notifyAggregate, // <-- agregado
  ]);

  const hasNotifs =
    typeof window !== "undefined" &&
    "Notification" in window &&
    !isAndroidChrome;
  const notifGranted = hasNotifs && Notification.permission === "granted";
  const notifTitle = notifGranted
    ? alertsEnabled
      ? "Notificaciones activadas"
      : "Notificaciones desactivadas"
    : isAndroidChrome
    ? "Notificaciones deshabilitadas en Android/Chrome"
    : "Activar notificaciones del navegador";

  /* ----------------------- UI ----------------------- */
  return (
    <div className="space-y-3">
      {/* Header: estado + acciones */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Estado */}
        <div className="text-sm text-neutral-500">
          <span className="font-medium">{online.length}</span> / {total} online
          · <span className="font-medium">{onCount}</span> activas
          {sortedSirens.some((s) => s.pending) && (
            <span className="ml-2 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-600">
              ejecutando…
            </span>
          )}
        </div>

        {/* Acciones: bulk + alertas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBulkToggle}
            disabled={!canBulk}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white transition
              ${
                allOnlineOn
                  ? "bg-red-gradient hover:brightness-110"
                  : "bg-green-gradient hover:brightness-110"
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={allOnlineOn ? "Apagar todas" : "Encender todas"}
            title={allOnlineOn ? "Apagar todas" : "Encender todas"}
          >
            {allOnlineOn ? "Apagar todas" : "Encender todas"}
          </button>

          {/* Panel de alertas */}
          <div className="ml-2 flex items-center gap-2 rounded-xl border px-2 py-1 text-sm">
            {/* Notificaciones */}
            <button
              onClick={() =>
                notifGranted
                  ? setAlertsEnabled((v) => !v)
                  : requestNotifPermission()
              }
              disabled={!hasNotifs}
              className={`cursor-pointer flex items-center gap-1 rounded-lg px-2 py-1 transition ${
                alertsEnabled
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={notifTitle}
            >
              {alertsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              <span className="hidden sm:inline">
                {notifGranted
                  ? alertsEnabled
                    ? "Notifs ON"
                    : "Notifs OFF"
                  : hasNotifs
                  ? "Permitir notifs"
                  : "Notifs no disponibles"}
              </span>
            </button>

            {/* Sonido */}
            <button
              onClick={() => {
                try {
                  ensureAudioCtx()?.resume?.();
                } catch {}
                setSoundEnabled((v) => !v);
              }}
              className={`cursor-pointer flex items-center gap-1 rounded-lg px-2 py-1 transition ${
                soundEnabled
                  ? "bg-indigo-500/15 text-indigo-600"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title="Alternar sonido"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline">
                {soundEnabled ? "Sonido" : "Silencio"}
              </span>
            </button>

            {/* Mute global */}
            <button
              onClick={() => setMuted((v) => !v)}
              className={`cursor-pointer rounded-lg px-2 py-1 transition ${
                muted
                  ? "bg-red-500/15 text-red-600"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title="Silenciar/activar alertas"
            >
              {muted ? "Mutear: ON" : "Mutear: OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Grid de sirenas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedSirens.map((s) => {
          const isOn = s.siren === "ON";
          const disabled = !s.online || s.pending;

          // ⬇️ contador a mostrar: persistido si existe, si no el del socket
          const displayCountdown = getDisplayCountdown(s.deviceId, s.countdown);

          return (
            <div
              key={s.deviceId}
              className={`group rounded-2xl border p-4 shadow-sm bg-card transition
                hover:shadow-md hover:-translate-y-[2px]
                ${isOn ? "ring-1 ring-green-600/20" : "ring-1 ring-white/5"}`}
            >
              {/* Header */}
              <div className="mb-2 text-center">
                <p className="font-semibold tracking-wide">{s.deviceId}</p>
                <p className="text-xs opacity-70">IP: {s.ip || "—"}</p>
              </div>

              {/* Botón principal */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => sendCommand(s.deviceId, isOn ? "OFF" : "ON")}
                  disabled={disabled}
                  className={`relative mt-2 h-28 w-28 rounded-full grid place-items-center text-white font-bold transition
                    ${
                      !s.online
                        ? "bg-gray-400 cursor-not-allowed"
                        : s.pending
                        ? "bg-gray-500 cursor-wait"
                        : isOn
                        ? "bg-red-gradient animate-pulse cursor-pointer"
                        : "bg-green-gradient hover:brightness-110 cursor-pointer"
                    }`}
                >
                  <span className="text-base">
                    {!s.online
                      ? "Offline"
                      : s.pending
                      ? "Enviando…"
                      : isOn
                      ? "Apagar"
                      : "Encender"}
                  </span>

                  {displayCountdown > 0 && !s.pending && (
                    <span className="absolute bottom-2 text-xs">
                      {formatTime(displayCountdown)}
                    </span>
                  )}
                </button>
              </div>

              {/* Footer / estado */}
              <div className="mt-3 text-center text-sm">
                <span
                  className={`mr-1 rounded-full px-2 py-0.5 text-xs font-medium
                    ${
                      s.online
                        ? "bg-green-500/15 text-green-600"
                        : "bg-red-500/15 text-red-600"
                    }`}
                >
                  {s.online ? "Online" : "Offline"}
                </span>
                <span className="opacity-70">·</span>
                <span className="ml-1">
                  Sirena:{" "}
                  <strong className={isOn ? "text-green-600" : "text-red-600"}>
                    {s.siren}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
