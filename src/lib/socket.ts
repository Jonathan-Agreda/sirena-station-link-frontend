// src/lib/socket.ts
// Reutiliza SIEMPRE el mismo socket en toda la app
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Soporta ambos: NEXT_PUBLIC_API_URL (con /api) o NEXT_PUBLIC_API_BASE_URL (sin /api)
    const raw =
      process.env.NEXT_PUBLIC_API_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "";
    const base = raw.replace(/\/api\/?$/, "").replace(/\/$/, "");

    // Adjunta token en el handshake (opcional, útil si tu WS valida JWT en connect)
    const token =
      typeof window !== "undefined"
        ? useAuthStore.getState().accessToken
        : null;

    socket = io(`${base}/ws`, {
      withCredentials: true,
      transports: ["websocket"], // evita long-polling
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20_000,
      auth: token ? { token: `Bearer ${token}` } : undefined,
    });
  }
  return socket;
}

// Útil para logout o hot-reloads
export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
