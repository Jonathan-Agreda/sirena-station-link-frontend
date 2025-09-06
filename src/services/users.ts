// src/services/users.ts
import api from "@/lib/api";

/**
 * Actualiza email / cédula / celular del usuario.
 * IMPORTANTE: `api` ya tiene baseURL '/api', así que NO anteponemos '/api' aquí.
 * Se envían solo los campos que realmente cambiaron.
 */
export async function updateUserContact(
  id: string,
  data: Partial<{
    email: string;
    cedula: string | null;
    celular: string | null;
  }>
) {
  // Construir payload parcial (solo claves presentes)
  const payload: Record<string, unknown> = {};
  if ("email" in data) payload.email = data.email;
  if ("cedula" in data) payload.cedula = data.cedula;
  if ("celular" in data) payload.celular = data.celular;

  const { data: res } = await api.put(`/users/${id}`, payload, {
    withCredentials: true,
  });
  return res;
}
