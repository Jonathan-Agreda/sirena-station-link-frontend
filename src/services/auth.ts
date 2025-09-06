// src/services/auth.ts
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

/* ------------------ Tipos ------------------ */

// Rol único y tipado (lo usaremos en todo el front)
export type Role = "SUPERADMIN" | "ADMIN" | "GUARDIA" | "RESIDENTE";

// Sirena (estructura mínima usada en el frontend)
export type Siren = {
  id: string;
  deviceId: string;
  apiKey: string;
  ip: string | null;
  online: boolean;
  relay: "ON" | "OFF";
  sirenState: "ON" | "OFF";
  lastSeen: string | null;
  lat: number;
  lng: number;
  urbanizationId: string;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
  urbanization: {
    id: string;
    name: string;
    maxUsers: number;
    createdAt: string;
    updatedAt: string;
  };
};

// Perfil completo → respuesta de /residents/me (para TODOS los roles)
export type MeResponse = {
  id: string;
  username: string;
  email?: string;
  role: Role;

  // Datos personales
  firstName?: string | null;
  lastName?: string | null;

  // Dirección
  etapa?: string | null;
  manzana?: string | null;
  villa?: string | null;

  // ➕ NUEVO: contacto
  cedula?: string | null;
  celular?: string | null;

  alicuota?: boolean;

  urbanizacion: {
    id: string;
    name: string;
    maxUsers: number;
    createdAt: string;
    updatedAt: string;
  } | null;

  sirens: Siren[];
};

// Objeto crudo que puede venir del backend (role o roles[], alias en nombres, etc.)
type RawUser = {
  id: string;
  username: string;
  email?: string;

  role?: string;
  roles?: string[];

  firstName?: string | null;
  firstname?: string | null;
  lastName?: string | null;
  lastname?: string | null;

  etapa?: string | null;
  manzana?: string | null;
  villa?: string | null;

  // ➕ posibles nombres para contacto
  cedula?: string | null;
  celular?: string | null;
  phone?: string | null;
  telefono?: string | null;

  alicuota?: boolean;

  urbanizacion?: MeResponse["urbanizacion"];
  sirens?: Siren[];
};

/* ------------------ Helpers ------------------ */

// A qué página ir según rol (usar después del login)
export function homeFor(role: Role): "/dashboard" | "/sirenastation" {
  if (role === "ADMIN" || role === "SUPERADMIN" || role === "GUARDIA")
    return "/dashboard";
  return "/sirenastation"; // RESIDENTE y GUARDIA
}

// Normaliza cualquier shape de user que venga del backend (roles[] o role)
function normalizeUser(raw: RawUser): MeResponse {
  const roleFromArray =
    Array.isArray(raw?.roles) &&
    (raw.roles as string[]).find((r) =>
      ["SUPERADMIN", "ADMIN", "GUARDIA", "RESIDENTE"].includes(r)
    );

  const role: Role = (raw?.role || roleFromArray || "RESIDENTE") as Role;

  // Utilidades de saneado suaves (sin romper datos)
  const toNullableString = (v: unknown) =>
    v === null || v === undefined ? null : String(v);

  return {
    id: raw.id,
    username: raw.username,
    email: raw.email ?? undefined,
    role,

    firstName: raw.firstName ?? raw.firstname ?? null,
    lastName: raw.lastName ?? raw.lastname ?? null,

    etapa: raw.etapa ?? null,
    manzana: raw.manzana ?? null,
    villa: raw.villa ?? null,

    // ➕ contacto
    cedula: toNullableString(raw.cedula),
    celular:
      toNullableString(raw.celular) ??
      toNullableString(raw.phone) ??
      toNullableString(raw.telefono),

    alicuota: raw.alicuota !== undefined ? raw.alicuota : true,

    urbanizacion: raw.urbanizacion ?? null,
    sirens: Array.isArray(raw.sirens) ? raw.sirens : [],
  };
}

/* ------------------ Auth API ------------------ */

export async function loginWeb(usernameOrEmail: string, password: string) {
  const res = await api.post("/auth/login/web", { usernameOrEmail, password });
  const { accessToken } = res.data;

  const meRes = await api.get<MeResponse>("/residents/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const user = normalizeUser(meRes.data as unknown as RawUser);
  useAuthStore.getState().setAuth(user, accessToken);

  return { accessToken, user };
}

export async function logoutWeb() {
  try {
    await api.post("/auth/logout/web");
  } finally {
    useAuthStore.getState().logout();
  }
}

export async function fetchMe(): Promise<MeResponse> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("No token disponible");

  const res = await api.get<MeResponse>("/residents/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return normalizeUser(res.data as unknown as RawUser);
}

/* ------------------ NUEVO: flujo primer login ------------------ */

export async function prelogin(
  usernameOrEmail: string,
  password: string
): Promise<{ ok: boolean; code?: string }> {
  const { data } = await api.post("/auth/prelogin", {
    usernameOrEmail,
    password,
  });
  return data;
}

export async function completeFirstLoginWeb(
  usernameOrEmail: string,
  currentPassword: string,
  newPassword: string
) {
  const res = await api.post("/auth/first-login/password", {
    usernameOrEmail,
    currentPassword,
    newPassword,
  });

  const { accessToken } = res.data as { accessToken: string };

  const meRes = await api.get<MeResponse>("/residents/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const user = normalizeUser(meRes.data as unknown as RawUser);
  useAuthStore.getState().setAuth(user, accessToken);

  return { accessToken, user };
}
