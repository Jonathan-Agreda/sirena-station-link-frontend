"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";

export type SirenState = {
  deviceId: string;
  ip?: string;
  online: boolean;
  relay: "ON" | "OFF";
  siren: "ON" | "OFF";
  updatedAt: string;
  lastHeartbeatAt?: string;
  countdown?: number;
};

export function useGroupSirensSocket(groupId: string) {
  const [sirens, setSirens] = useState<SirenState[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const heartbeatTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const countdownTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!groupId) return;

    // Estado inicial desde REST (sirenas del grupo)
    (async () => {
      try {
        const res = await api.get(`/groups/${groupId}/sirens`);
        setSirens(
          res.data.map((s: any) => ({
            deviceId: s.deviceId,
            ip: s.ip,
            online: false,
            relay: "OFF",
            siren: "OFF",
            updatedAt: new Date().toISOString(),
          }))
        );
      } catch (err) {
        console.error("❌ Error cargando sirenas del grupo", err);
      }
    })();

    // Conectar socket
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const socket = io(`${apiUrl.replace("/api", "")}/ws`, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // --- STATE
    socket.on("device.state", (payload: SirenState) => {
      setSirens((prev) =>
        prev.map((s) =>
          s.deviceId === payload.deviceId ? { ...s, ...payload } : s
        )
      );
    });

    // --- LWT (offline forzado)
    socket.on("device.lwt", (payload: SirenState) => {
      setSirens((prev) =>
        prev.map((s) =>
          s.deviceId === payload.deviceId ? { ...s, online: false } : s
        )
      );
    });

    // --- HEARTBEAT
    socket.on("device.heartbeat", (payload: SirenState) => {
      setSirens((prev) =>
        prev.map((s) =>
          s.deviceId === payload.deviceId ? { ...s, online: true } : s
        )
      );

      // timeout → offline si no llega otro en 30s
      if (heartbeatTimers.current[payload.deviceId]) {
        clearTimeout(heartbeatTimers.current[payload.deviceId]);
      }
      heartbeatTimers.current[payload.deviceId] = setTimeout(() => {
        setSirens((prev) =>
          prev.map((s) =>
            s.deviceId === payload.deviceId ? { ...s, online: false } : s
          )
        );
      }, 30_000);
    });

    // --- ACK comandos
    socket.on("device.ack", (ack: any) => {
      if (ack.result !== "OK") return;
      if (ack.action === "ON") {
        // Iniciar countdown auto-off
        const ttlSec = process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF
          ? parseInt(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) / 1000
          : 300;

        setSirens((prev) =>
          prev.map((s) =>
            s.deviceId === ack.deviceId ? { ...s, countdown: ttlSec } : s
          )
        );

        if (countdownTimers.current[ack.deviceId]) {
          clearInterval(countdownTimers.current[ack.deviceId]);
        }
        countdownTimers.current[ack.deviceId] = setInterval(() => {
          setSirens((prev) =>
            prev.map((s) =>
              s.deviceId === ack.deviceId && s.countdown
                ? { ...s, countdown: s.countdown - 1 }
                : s
            )
          );
        }, 1000);
      }
      if (ack.action === "OFF") {
        clearInterval(countdownTimers.current[ack.deviceId]);
        setSirens((prev) =>
          prev.map((s) =>
            s.deviceId === ack.deviceId ? { ...s, countdown: 0 } : s
          )
        );
      }
    });

    return () => {
      socket.disconnect();
      Object.values(heartbeatTimers.current).forEach(clearTimeout);
      Object.values(countdownTimers.current).forEach(clearInterval);
    };
  }, [groupId]);

  return { sirens };
}
