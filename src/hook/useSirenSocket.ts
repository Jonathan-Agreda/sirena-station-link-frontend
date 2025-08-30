import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";

type SirenState = {
  deviceId: string;
  online: boolean;
  relay: "ON" | "OFF";
  siren: "ON" | "OFF";
  updatedAt: string;
};

export function useSirenSocket(deviceId: string) {
  const [state, setState] = useState<SirenState | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    // 🔹 Estado inicial
    (async () => {
      try {
        const res = await api.get(`/mqtt/state/${deviceId}`);
        setState(res.data);
      } catch {
        console.warn("No hay estado inicial de la sirena");
        setState(null); // marca "Sin datos"
      }
    })();

    const socket = io(
      `${process.env.NEXT_PUBLIC_API_URL.replace("/api", "")}/ws`,
      { withCredentials: true }
    );
    socketRef.current = socket;

    // --- Handlers ---
    const updateState = (payload: SirenState) => {
      if (payload.deviceId === deviceId) {
        setState(payload);
      }
    };

    socket.on("device.state", updateState);
    socket.on("device.lwt", updateState);

    // 🔹 Heartbeat → actualiza y reinicia watchdog
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
    socket.on("device.ack", (ack: any) => {
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
  }, [deviceId]);

  // --- Countdown helpers ---
  const startCountdown = (seconds: number) => {
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
  };

  const stopCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(0);
  };

  return { state, countdown };
}
