import api from "@/lib/api";

export type MeResponse = {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  alicuota?: boolean;
  urbanizacion?: { id: string; nombre: string } | null;
  etapa?: string | null;
  manzana?: string | null;
  villa?: string | null;
};

/** Obtiene el perfil del usuario autenticado */
export async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data;
}

/** (futuro) logout API */
export async function logoutWeb() {
  return api.post("/auth/logout/web");
}

/** (futuro) refresh API */
export async function refreshWeb() {
  return api.post("/auth/refresh/web");
}
