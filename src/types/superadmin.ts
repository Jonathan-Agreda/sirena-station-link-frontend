// src/types/superadmin.ts

// ---------- Urbanizaciones ----------
export type Urbanizacion = {
  id: string;
  name: string;
  maxUsers: number;
  createdAt: string;
  updatedAt: string;
  telegramGroupId?: string | null;
};

// ---------- Sirenas ----------
export type Siren = {
  id: string;
  deviceId: string;
  alias: string;

  // Compatibilidad: el backend devuelve "urbanizationId",
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

// ---------- Usuarios ----------
export type User = {
  id: string;
  keycloakId?: string | null; // Para cruzar con /users/:id/sessions
  name: string;
  firstName: string;
  lastName: string;
  cedula: string;
  celular: string;
  villa: string;
  manzana: string;
  etapa: string;
  email: string;
  username: string;
  role: "SUPERADMIN" | "ADMIN" | "GUARDIA" | "RESIDENTE";
  alicuota: boolean;

  // Compatibilidad con backend
  urbanizacionId: string | null;
  urbanizationId?: string | null;

  createdAt: string;
  sessionLimit?: number | null; // Valor crudo desde backend
  sessions: number; // Valor efectivo (regla por rol)
  activo: boolean;
};

// ---------- Asignaciones ----------
export type Assignment = {
  id: string;
  userId: string;
  sirenId: string;
  createdAt: string;
};

// ---------- Sesiones activas ----------
export type ActiveSession = {
  id: string;
  userId: string; // Keycloak userId
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

/* ------------------ BULK Usuarios ------------------ */
export type UserBulkImportItem = {
  email?: string;
  username?: string;
  status: "would_create" | "would_update" | "created" | "updated" | "error";
  error?: string;
  note?: string;
};
export type UserBulkImportResult = {
  dryRun: boolean;
  toCreate: number;
  toUpdate: number;
  skipped: number;
  processed: number;
  report: UserBulkImportItem[];
};

export type UserBulkDeleteItem = {
  email?: string;
  username?: string;
  status: "deleted" | "not_found" | "forbidden" | "error";
  error?: string;
};
export type UserBulkDeleteResult = {
  removed: number;
  processed: number;
  report: UserBulkDeleteItem[];
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

/* ------------------ BULK Asignaciones ------------------ */
export type AssignmentBulkImportItem = {
  user?: string;
  siren?: string;
  status: "would_create" | "would_update" | "created" | "updated" | "error";
  error?: string;
};
export type AssignmentBulkImportResult = {
  dryRun: boolean;
  toCreate: number;
  toUpdate: number;
  processed: number;
  report: AssignmentBulkImportItem[];
};

export type AssignmentBulkDeleteItem = {
  user?: string;
  siren?: string;
  status: "deleted" | "not_found" | "forbidden" | "error";
  error?: string;
};
export type AssignmentBulkDeleteResult = {
  removed: number;
  processed: number;
  report: AssignmentBulkDeleteItem[];
};
