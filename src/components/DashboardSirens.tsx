"use client";

import { useDashboardSirens } from "@/hook/useDashboardSirens";
import { Bell, BellOff, Volume2, VolumeX, Vibrate } from "lucide-react";
// CAMBIO: Se importa useCallback para solucionar las advertencias de useEffect
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

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

// CAMBIO: Se define un tipo para window que incluye la propiedad vendor-prefixed
interface WindowWithAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export default function DashboardSirens() {
  const { sirens, sendCommand } = useDashboardSirens();

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

  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return "Notification" in window && Notification.permission === "granted";
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const intervalMs = 20000;

  const audioCtxRef = useRef<AudioContext | null>(null);

  // CAMBIO: Se envuelve `ensureAudioCtx` en useCallback para estabilizarla
  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      // CAMBIO: Se usa la nueva interfaz en lugar de `any` para evitar la advertencia
      const Ctx =
        window.AudioContext ||
        (window as WindowWithAudioContext).webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  }, []);

  // CAMBIO: Se envuelve `beep` en useCallback y se le añade su dependencia (`ensureAudioCtx`)
  const beep = useCallback(() => {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
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
  }, [ensureAudioCtx]);

  useEffect(() => {
    if (!soundEnabled) return;
    const resume = () => {
      ensureAudioCtx()?.resume?.();
    };
    window.addEventListener("click", resume, { once: true });
    window.addEventListener("touchstart", resume, { once: true });
    return () => {
      window.removeEventListener("click", resume);
      window.removeEventListener("touchstart", resume);
    };
  }, [soundEnabled, ensureAudioCtx]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") setAlertsEnabled(true);
      });
    }
  }, []);

  async function requestNotifPermission() {
    if (!(typeof window !== "undefined" && "Notification" in window)) return;
    const p = await Notification.requestPermission();
    if (p === "granted") setAlertsEnabled(true);
  }

  function notifyAggregate(ids: string[]) {
    if (!(typeof window !== "undefined" && "Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (ids.length === 0) return;

    const title =
      ids.length === 1 ? "Sirena ACTIVA" : `Sirenas ACTIVAS (${ids.length})`;
    const MAX = 8;
    const shown = ids.slice(0, MAX).join(", ");
    const rest = ids.length > MAX ? `, +${ids.length - MAX} más` : "";
    const body = shown + rest;

    const n = new Notification(title, {
      body,
      tag: "sirena-aggregate",
      // CAMBIO: Se elimina la propiedad no estándar `renotify` para solucionar el error de tipo.
    });
    setTimeout(() => n.close(), 6000);
  }

  function fireVibration() {
    if (!("vibrate" in navigator)) return;
    try {
      navigator.vibrate([220, 100, 220]);
    } catch {}
  }

  const prevActiveIdsRef = useRef<string[]>([]);
  useEffect(() => {
    const current = activeOnline.map((s) => s.deviceId);
    const previous = prevActiveIdsRef.current;
    const newlyOn = current.filter((id) => !previous.includes(id));

    if (newlyOn.length > 0 && alertsEnabled && !muted) {
      notifyAggregate(current);
      if (soundEnabled) {
        ensureAudioCtx()?.resume?.();
        beep();
      }
      if (vibrateEnabled) fireVibration();
    }

    prevActiveIdsRef.current = current;
    // CAMBIO: Se añaden `beep` y `ensureAudioCtx` a las dependencias.
  }, [
    activeOnline,
    alertsEnabled,
    muted,
    soundEnabled,
    vibrateEnabled,
    beep,
    ensureAudioCtx,
  ]);

  useEffect(() => {
    if (!alertsEnabled || muted || activeOnline.length === 0) return;
    const tick = () => {
      const ids = activeOnline.map((s) => s.deviceId);
      notifyAggregate(ids);
      if (soundEnabled) {
        ensureAudioCtx()?.resume?.();
        beep();
      }
      if (vibrateEnabled) fireVibration();
    };
    const t = setInterval(tick, intervalMs);
    return () => clearInterval(t);
    // CAMBIO: Se añaden `beep` y `ensureAudioCtx` a las dependencias.
  }, [
    alertsEnabled,
    muted,
    soundEnabled,
    vibrateEnabled,
    activeOnline,
    intervalMs,
    beep,
    ensureAudioCtx,
  ]);

  const hasNotifs = typeof window !== "undefined" && "Notification" in window;
  const notifGranted = hasNotifs && Notification.permission === "granted";
  const notifTitle = notifGranted
    ? alertsEnabled
      ? "Notificaciones activadas"
      : "Notificaciones desactivadas"
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
              className={`cursor-pointer flex items-center gap-1 rounded-lg px-2 py-1 transition ${
                alertsEnabled
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title={notifTitle}
            >
              {alertsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              <span className="hidden sm:inline">
                {notifGranted
                  ? alertsEnabled
                    ? "Notifs ON"
                    : "Notifs OFF"
                  : "Permitir notifs"}
              </span>
            </button>

            {/* Sonido */}
            <button
              onClick={() => {
                ensureAudioCtx()?.resume?.();
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

            {/* Vibración */}
            <button
              onClick={() => setVibrateEnabled((v) => !v)}
              className={`cursor-pointer flex items-center gap-1 rounded-lg px-2 py-1 transition ${
                vibrateEnabled
                  ? "bg-cyan-500/15 text-cyan-600"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title="Alternar vibración"
            >
              <Vibrate size={16} />
              <span className="hidden sm:inline">
                {vibrateEnabled ? "Vibrar" : "No vibrar"}
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
                  {s.countdown && s.countdown > 0 && !s.pending && (
                    <span className="absolute bottom-2 text-xs">
                      {formatTime(s.countdown)}
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
