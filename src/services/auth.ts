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
  firstName?: string | null;
  lastName?: string | null;
  etapa?: string | null;
  manzana?: string | null;
  villa?: string | null;
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

// CAMBIO 1: Se crea un tipo para el objeto "raw" que viene del backend.
// Esto nos permite reemplazar `any` de forma segura.
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
// CAMBIO 2: Se usa el nuevo tipo `RawUser` en lugar de `any`.
function normalizeUser(raw: RawUser): MeResponse {
  const roleFromArray =
    Array.isArray(raw?.roles) &&
    (raw.roles as string[]).find((r) =>
      ["SUPERADMIN", "ADMIN", "GUARDIA", "RESIDENTE"].includes(r)
    );

  const role: Role = (raw?.role || roleFromArray || "RESIDENTE") as Role;

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

  const user = normalizeUser(meRes.data);
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
  return normalizeUser(res.data);
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

  const user = normalizeUser(meRes.data);
  useAuthStore.getState().setAuth(user, accessToken);

  return { accessToken, user };
}
