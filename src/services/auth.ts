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

/* ------------------ Helpers ------------------ */

// A qué página ir según rol (usar después del login)
export function homeFor(role: Role): "/dashboard" | "/sirenastation" {
  if (role === "ADMIN" || role === "SUPERADMIN") return "/dashboard";
  return "/sirenastation"; // RESIDENTE y GUARDIA
}

// Normaliza cualquier shape de user que venga del backend (roles[] o role)
function normalizeUser(raw: any): MeResponse {
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
    // 🔹 Si backend manda false, se respeta
    alicuota: raw.alicuota !== undefined ? raw.alicuota : true,
    urbanizacion: raw.urbanizacion ?? null,
    sirens: Array.isArray(raw.sirens) ? raw.sirens : [],
  };
}

/* ------------------ Auth API ------------------ */

// LOGIN: hace login, luego prefetch de /residents/me y guarda en el store
export async function loginWeb(usernameOrEmail: string, password: string) {
  // 1) Login (el backend setea cookie de refresh; aquí nos quedamos con accessToken)
  const res = await api.post("/auth/login/web", { usernameOrEmail, password });
  const { accessToken } = res.data;

  // 2) Perfil completo (usar token recién emitido)
  const meRes = await api.get<MeResponse>("/residents/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 3) Normalizar y guardar en store
  const user = normalizeUser(meRes.data);
  useAuthStore.getState().setAuth(user, accessToken);

  // 4) Devolver en un shape consistente
  return { accessToken, user };
}

// LOGOUT: cierra sesión en backend y limpia store
export async function logoutWeb() {
  try {
    await api.post("/auth/logout/web");
  } finally {
    useAuthStore.getState().logout();
  }
}

// ME: obtiene el perfil completo (útil en bootstrap o refrescos)
export async function fetchMe(): Promise<MeResponse> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("No token disponible");

  const res = await api.get<MeResponse>("/residents/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return normalizeUser(res.data);
}
