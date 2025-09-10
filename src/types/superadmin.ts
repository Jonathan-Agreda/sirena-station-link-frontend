// src/types/superadmin.ts

export type Urbanizacion = {
  id: string;
  name: string;
  maxUsers: number;
  createdAt: string;
  updatedAt: string;
};

export type Siren = {
  id: string;
  deviceId: string;
  alias: string;
  urbanizacionId: string | null;
  online: boolean;
  relay: "ON" | "OFF";
  siren: "ON" | "OFF";
  ip: string | null;
  lastSeenAt: string | null;
};

export type User = {
  id: string;
  keycloakId?: string | null; // 👈 para cruzar con /users/:id/sessions
  name: string;
  email: string;
  username: string;
  role: "SUPERADMIN" | "ADMIN" | "GUARDIA" | "RESIDENTE";
  alicuota: boolean;
  urbanizacionId: string | null;
  createdAt: string;
  sessionLimit?: number | null; // valor crudo desde backend
  sessions: number; // valor efectivo (regla por rol)
};

export type Assignment = {
  id: string;
  userId: string;
  sirenId: string;
  createdAt: string;
};

export type ActiveSession = {
  id: string;
  userId: string; // <- Keycloak userId
  username: string;
  ipAddress: string | null;
  start: number; // epoch ms
  lastAccess: number; // epoch ms
  clients: Record<string, string> | null;
};
