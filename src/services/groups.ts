import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Siren } from "@/services/auth";

export type Group = {
  id: string;
  name: string;
  urbanizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

function authHeader() {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("No token disponible");
  return { Authorization: `Bearer ${accessToken}` };
}

// 🔎 Listar grupos visibles para el usuario
export async function fetchGroups(): Promise<Group[]> {
  const res = await api.get<Group[]>("/groups", {
    headers: authHeader(),
  });
  return res.data;
}

// 🔎 Listar sirenas de un grupo
export async function fetchGroupSirens(groupId: string): Promise<Siren[]> {
  const res = await api.get<Siren[]>(`/groups/${groupId}/sirens`, {
    headers: authHeader(),
  });
  return res.data;
}
