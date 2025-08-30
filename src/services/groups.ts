import api from "@/lib/api";
import type { Siren } from "@/services/auth";

export type Group = {
  id: string;
  name: string;
  urbanizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

// 🔎 Listar grupos visibles para el usuario
export async function fetchGroups(): Promise<Group[]> {
  const { data } = await api.get<Group[]>("/groups");
  return data;
}

// 🔎 Listar sirenas de un grupo
export async function fetchGroupSirens(groupId: string): Promise<Siren[]> {
  const { data } = await api.get<Siren[]>(`/groups/${groupId}/sirens`);
  return data;
}
