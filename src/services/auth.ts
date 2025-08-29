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

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get("/auth/me");
  return data;
}
