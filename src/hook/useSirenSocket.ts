import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";

// ------------------ Tipos ------------------
type SirenState = {
  deviceId: string;
  online: boolean;
  relay: "ON" | "OFF";
  siren: "ON" | "OFF";
  updatedAt: string;
};

type AckPayload = {
  deviceId: string;
  action: "ON" | "OFF";
  result: "OK" | "ERROR";
};

// ------------------ Hook ------------------
export function useSirenSocket(deviceId: string) {
  const [state, setState] = useState<SirenState | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Countdown helpers ---
  const stopCountdown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(0);
  }, []);

  const startCountdown = useCallback(
    (seconds: number) => {
      stopCountdown();
      setCountdown(seconds);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopCountdown();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [stopCountdown]
  );

  // --- useEffect principal ---
  useEffect(() => {
    if (!deviceId) return;

    // 🔹 Estado inicial desde API
    (async () => {
      try {
        const res = await api.get(`/mqtt/state/${deviceId}`);
        setState(res.data);
      } catch {
        console.warn("No hay estado inicial de la sirena");
        setState(null); // marca "Sin datos"
      }
    })();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const socket = io(`${apiUrl.replace("/api", "")}/ws`, {
      withCredentials: true,
    });
    socketRef.current = socket;

    // --- Handlers ---
    const updateState = (payload: SirenState) => {
      if (payload.deviceId === deviceId) {
        setState(payload);
      }
    };

    socket.on("device.state", updateState);
    socket.on("device.lwt", updateState);

    // 🔹 Heartbeat
    socket.on("device.heartbeat", (payload: SirenState) => {
      if (payload.deviceId === deviceId) {
        setState({ ...payload, online: true });

        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }
        heartbeatTimeoutRef.current = setTimeout(() => {
          setState((prev) => (prev ? { ...prev, online: false } : prev));
        }, 30_000); // 30s sin heartbeat => offline
      }
    });

    // 🔹 ACK comandos
    socket.on("device.ack", (ack: AckPayload) => {
      if (ack.deviceId === deviceId) {
        if (ack.action === "ON" && ack.result === "OK") {
          startCountdown(
            process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF
              ? parseInt(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) / 1000
              : 300
          );
        }
        if (ack.action === "OFF" && ack.result === "OK") {
          stopCountdown();
        }
      }
    });

    return () => {
      socket.disconnect();
      stopCountdown();
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, [deviceId, startCountdown, stopCountdown]);

  return { state, countdown };
}
