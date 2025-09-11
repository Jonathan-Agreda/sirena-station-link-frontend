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

  // 👇 compatibilidad: el backend devuelve "urbanizationId",
  // pero en el frontend usamos "urbanizacionId"
  urbanizacionId: string | null;
  urbanizationId?: string | null; // opcional, para no romper tipado

  apiKey: string;

  online: boolean;
  relay: "ON" | "OFF";
  siren: "ON" | "OFF";

  lat: number;
  lng: number;
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

  // mismo caso que con Siren
  urbanizacionId: string | null;
  urbanizationId?: string | null;

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

/* ------------------ BULK Urbanizaciones ------------------ */
export type UrbanizationBulkImportItem = {
  name: string;
  status: "would_create" | "would_update" | "created" | "updated" | "error";
  error?: string;
};
export type UrbanizationBulkImportResult = {
  dryRun: boolean;
  toCreate: number;
  toUpdate: number;
  processed: number;
  report: UrbanizationBulkImportItem[];
};

export type UrbanizationBulkDeleteItem = {
  name: string;
  status: "deleted" | "not_found" | "error";
  error?: string;
};
export type UrbanizationBulkDeleteResult = {
  removed: number;
  processed: number;
  report: UrbanizationBulkDeleteItem[];
};

/* ------------------ BULK Sirenas ------------------ */
export type SirenBulkImportItem = {
  deviceId: string;
  status: "would_create" | "would_update" | "created" | "updated" | "error";
  error?: string;
};
export type SirenBulkImportResult = {
  dryRun: boolean;
  toCreate: number;
  toUpdate: number;
  processed: number;
  report: SirenBulkImportItem[];
};

export type SirenBulkDeleteItem = {
  deviceId: string;
  status: "deleted" | "not_found" | "error";
  error?: string;
};
export type SirenBulkDeleteResult = {
  removed: number;
  processed: number;
  report: SirenBulkDeleteItem[];
};
