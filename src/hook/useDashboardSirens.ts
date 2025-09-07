"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";

type OnOff = "ON" | "OFF";

export type DashboardSiren = {
  deviceId: string;
  ip?: string | null;
  online: boolean;
  relay: OnOff;
  siren: OnOff;
  updatedAt?: string;
  countdown?: number;
  pending?: boolean;
  // opcionales desde BD:
  lat?: number;
  lng?: number;
  urbanizationId?: string;
  groupId?: string | null;
};

type LastState = {
  deviceId: string;
  online: boolean;
  relay: OnOff;
  siren: OnOff;
  ip?: string;
  updatedAt: string;
  lastHeartbeatAt?: string;
};

// Respuesta de /sirens
type ApiSiren = {
  deviceId: string;
  ip: string | null;
  lat: number;
  lng: number;
  urbanizationId: string;
  groupId: string | null;
};

const HEARTBEAT_MS = 45_000;
const ACK_TIMEOUT_MS = 5_000;

export function useDashboardSirens() {
  const [items, setItems] = useState<DashboardSiren[]>([]);

  // ✅ Tipos de timers universales (web/node)
  const heartbeatTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const countdownTimers = useRef<
    Record<string, ReturnType<typeof setInterval>>
  >({});
  const ackTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 1) Hidratar: /sirens + /mqtt/state
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const sirensRes = await api.get("/sirens");
        const base: DashboardSiren[] = (sirensRes.data as ApiSiren[]).map(
          (s) => ({
            deviceId: s.deviceId,
            ip: s.ip ?? null,
            online: false,
            relay: "OFF",
            siren: "OFF",
            updatedAt: undefined,
            lat: s.lat,
            lng: s.lng,
            urbanizationId: s.urbanizationId,
            groupId: s.groupId ?? null,
            countdown: undefined,
            pending: false,
          })
        );

        let merged = base;
        try {
          const statesRes = await api.get("/mqtt/state");
          const states: LastState[] = statesRes.data?.items ?? [];
          const byId = new Map(states.map((st) => [st.deviceId, st]));

          merged = base.map((s) => {
            const st = byId.get(s.deviceId);
            return st
              ? {
                  ...s,
                  ip: st.ip ?? s.ip,
                  online: st.online,
                  relay: st.relay,
                  siren: st.siren,
                  updatedAt: st.updatedAt,
                }
              : s;
          });
        } catch {
          // /mqtt/state puede no existir aún
        }

        if (!mounted) return;
        setItems(merged);
      } catch (err) {
        console.error("❌ Dashboard: error hidratando sirenas", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 2) WebSocket: state/lwt/heartbeat/ack
  useEffect(() => {
    const socket = getSocket();

    const clearAckTimer = (id: string) => {
      const t = ackTimers.current[id];
      if (t) {
        clearTimeout(t);
        delete ackTimers.current[id];
      }
    };

    const onState = (payload: LastState) => {
      // 🔹 Si llega state, garantizamos quitar el ACK timeout de ese equipo
      clearAckTimer(payload.deviceId);

      setItems((prev) =>
        prev.map((s) =>
          s.deviceId === payload.deviceId
            ? {
                ...s,
                online: payload.online,
                relay: payload.relay,
                siren: payload.siren,
                ip: payload.ip ?? s.ip,
                updatedAt: payload.updatedAt,
                pending: false, // confirmación
              }
            : s
        )
      );
    };

    const onLwt = (payload: LastState) => {
      // 🔹 Si cae el dispositivo, también limpiamos su ACK timeout
      clearAckTimer(payload.deviceId);

      setItems((prev) =>
        prev.map((s) =>
          s.deviceId === payload.deviceId
            ? { ...s, online: false, pending: false, countdown: undefined }
            : s
        )
      );
    };

    const onHeartbeat = (payload: LastState) => {
      const id = payload.deviceId;

      setItems((prev) =>
        prev.map((s) => (s.deviceId === id ? { ...s, online: true } : s))
      );

      if (heartbeatTimers.current[id])
        clearTimeout(heartbeatTimers.current[id]);
      heartbeatTimers.current[id] = setTimeout(() => {
        setItems((prev) =>
          prev.map((s) =>
            s.deviceId === id
              ? { ...s, online: false, pending: false, countdown: undefined }
              : s
          )
        );
      }, HEARTBEAT_MS);
    };

    const onAck = (ack: {
      deviceId: string;
      commandId: string;
      action: OnOff;
      result: "OK" | "ERROR";
      ts: string;
    }) => {
      const id = ack.deviceId;

      // cualquier ACK limpia su timer
      clearAckTimer(id);

      if (ack.result !== "OK") {
        setItems((prev) =>
          prev.map((s) => (s.deviceId === id ? { ...s, pending: false } : s))
        );
        return;
      }

      setItems((prev) =>
        prev.map((s) =>
          s.deviceId === id ? { ...s, siren: ack.action, pending: false } : s
        )
      );

      if (ack.action === "ON") {
        const autoOffMs =
          Number(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) || 300_000;
        const ttlSec = Math.floor(autoOffMs / 1000);

        setItems((prev) =>
          prev.map((s) => (s.deviceId === id ? { ...s, countdown: ttlSec } : s))
        );

        if (countdownTimers.current[id]) {
          clearInterval(countdownTimers.current[id]);
        }
        countdownTimers.current[id] = setInterval(() => {
          setItems((prev) =>
            prev.map((s) => {
              if (s.deviceId !== id) return s;
              if (s.countdown === undefined) return s;
              if (s.countdown <= 1) {
                clearInterval(countdownTimers.current[id]);
                delete countdownTimers.current[id];
                return { ...s, countdown: undefined };
              }
              return { ...s, countdown: s.countdown - 1 };
            })
          );
        }, 1000);
      } else {
        if (countdownTimers.current[id]) {
          clearInterval(countdownTimers.current[id]);
          delete countdownTimers.current[id];
        }
        setItems((prev) =>
          prev.map((s) =>
            s.deviceId === id ? { ...s, countdown: undefined } : s
          )
        );
      }
    };

    socket.on("device.state", onState);
    socket.on("device.lwt", onLwt);
    socket.on("device.heartbeat", onHeartbeat);
    socket.on("device.ack", onAck);

    return () => {
      socket.off("device.state", onState);
      socket.off("device.lwt", onLwt);
      socket.off("device.heartbeat", onHeartbeat);
      socket.off("device.ack", onAck);

      Object.values(heartbeatTimers.current).forEach(clearTimeout);
      Object.values(countdownTimers.current).forEach(clearInterval);
      Object.values(ackTimers.current).forEach(clearTimeout);
      heartbeatTimers.current = {};
      countdownTimers.current = {};
      ackTimers.current = {};
    };
  }, []);

  const sendCommand = useCallback(async (deviceId: string, action: OnOff) => {
    setItems((prev) =>
      prev.map((s) => (s.deviceId === deviceId ? { ...s, pending: true } : s))
    );

    // (Re)programa timeout de ACK
    const existing = ackTimers.current[deviceId];
    if (existing) clearTimeout(existing);
    ackTimers.current[deviceId] = setTimeout(() => {
      setItems((prev) =>
        prev.map((s) =>
          s.deviceId === deviceId ? { ...s, pending: false } : s
        )
      );
      delete ackTimers.current[deviceId];
      console.warn(`ACK timeout ${deviceId} (${action})`);
    }, ACK_TIMEOUT_MS);

    try {
      await api.post(`/devices/${deviceId}/cmd`, {
        action,
        ttlMs: Number(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) || 300_000,
        cause: "manual",
      });
    } catch (err) {
      const t = ackTimers.current[deviceId];
      if (t) {
        clearTimeout(t);
        delete ackTimers.current[deviceId];
      }
      setItems((prev) =>
        prev.map((s) =>
          s.deviceId === deviceId ? { ...s, pending: false } : s
        )
      );
      throw err;
    }
  }, []);

  return { sirens: items, sendCommand };
}
