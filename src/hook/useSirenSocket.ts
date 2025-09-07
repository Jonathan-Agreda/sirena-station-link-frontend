"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import api from "@/lib/api";
import { toggleSiren } from "@/services/sirens";

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

const HEARTBEAT_MS = 45_000;
const ACK_TIMEOUT_MS = 5_000;

export function useSirenSocket(deviceId: string) {
  const [state, setState] = useState<SirenState | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [pending, setPending] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (!deviceId) return;

    (async () => {
      try {
        const res = await api.get(`/mqtt/state/${deviceId}`);
        setState(res.data);
      } catch {
        console.warn("No hay estado inicial de la sirena");
        setState(null);
      }
    })();

    const socket = getSocket();
    socketRef.current = socket;

    const onState = (payload: SirenState) => {
      if (payload.deviceId === deviceId) {
        setState(payload);
        setPending(false);
      }
    };

    const onLwt = (payload: { deviceId: string }) => {
      if (payload.deviceId === deviceId) {
        setState((prev) => (prev ? { ...prev, online: false } : prev));
        setPending(false);
        stopCountdown();
      }
    };

    const onHeartbeat = (payload: SirenState) => {
      if (payload.deviceId === deviceId) {
        setState({ ...payload, online: true });

        if (heartbeatTimeoutRef.current)
          clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = setTimeout(() => {
          setState((prev) => (prev ? { ...prev, online: false } : prev));
          setPending(false);
          stopCountdown();
        }, HEARTBEAT_MS);
      }
    };

    const onAck = (ack: AckPayload) => {
      if (ack.deviceId !== deviceId) return;

      if (ackTimeoutRef.current) {
        clearTimeout(ackTimeoutRef.current);
        ackTimeoutRef.current = null;
      }

      if (ack.result !== "OK") {
        setPending(false);
        return;
      }

      setState((prev) => (prev ? { ...prev, siren: ack.action } : prev));
      setPending(false);

      if (ack.action === "ON") {
        startCountdown(
          process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF
            ? parseInt(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) / 1000
            : 300
        );
      } else {
        stopCountdown();
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
      stopCountdown();
      if (heartbeatTimeoutRef.current)
        clearTimeout(heartbeatTimeoutRef.current);
      if (ackTimeoutRef.current) clearTimeout(ackTimeoutRef.current);
    };
  }, [deviceId, startCountdown, stopCountdown]);

  // Enviar comando: pending + timeout de ACK
  const sendCommand = useCallback(
    async (action: "ON" | "OFF") => {
      if (!deviceId) return;
      setPending(true);

      if (ackTimeoutRef.current) clearTimeout(ackTimeoutRef.current);
      ackTimeoutRef.current = setTimeout(() => {
        setPending(false);
        console.warn(`ACK timeout ${deviceId} (${action})`);
      }, ACK_TIMEOUT_MS);

      try {
        await toggleSiren(deviceId, action);
      } catch (err) {
        setPending(false);
        if (ackTimeoutRef.current) {
          clearTimeout(ackTimeoutRef.current);
          ackTimeoutRef.current = null;
        }
        throw err;
      }
    },
    [deviceId]
  );

  return { state, countdown, pending, sendCommand };
}
