import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

// ------------------ Tipos ------------------
export type UserBase = {
  id: string;
  username: string;
  email?: string;
  roles: string[];
};

export type ResidentMeResponse = {
  id: string;
  username: string;
  email: string;
  role: "RESIDENTE";
  firstName: string;
  lastName: string;
  etapa: string;
  manzana: string;
  villa: string;
  alicuota: boolean;
  urbanizacion: {
    id: string;
    name: string;
    maxUsers: number;
    createdAt: string;
    updatedAt: string;
  };
  siren: {
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
};

// ------------------ LOGIN ------------------
export async function loginWeb(usernameOrEmail: string, password: string) {
  const res = await api.post("/auth/login/web", { usernameOrEmail, password });
  const { user, accessToken } = res.data;

  useAuthStore.getState().setAuth(user, accessToken);
  return res.data;
}

// ------------------ LOGOUT ------------------
export async function logoutWeb() {
  try {
    await api.post("/auth/logout/web");
  } finally {
    useAuthStore.getState().logout();
  }
}

// ------------------ PROFILE (ME) ------------------
// Devuelve datos enriquecidos para RESIDENTE y datos básicos para otros roles
export async function fetchMe(): Promise<UserBase | ResidentMeResponse> {
  const store = useAuthStore.getState();
  if (!store.accessToken) throw new Error("No token disponible");

  // 1. Ver rol básico usando /auth/me
  const authRes = await api.get<UserBase>("/auth/me", {
    headers: { Authorization: `Bearer ${store.accessToken}` },
  });

  const roles = authRes.data.roles || [];
  if (roles.includes("RESIDENTE")) {
    // 2. Si es residente, llamar a /residents/me
    const residentRes = await api.get<ResidentMeResponse>("/residents/me", {
      headers: { Authorization: `Bearer ${store.accessToken}` },
    });
    return residentRes.data;
  }

  // 3. Caso ADMIN, SUPERADMIN, GUARDIA → devolver info básica
  return authRes.data;
}
