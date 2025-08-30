// Reutiliza SIEMPRE el mismo socket en toda la app
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
    // backend ws namespace: /ws  (coincide con WsGateway)
    socket = io(`${base}/ws`, {
      withCredentials: true,
      transports: ["websocket"], // evita long polling
    });
  }
  return socket;
}
