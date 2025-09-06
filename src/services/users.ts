// src/services/users.ts

import * as API from "@/lib/api";

type AnyFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

// Utilidad de type guard para verificar si un valor es función con la firma esperada
function isAnyFetch(fn: unknown): fn is AnyFetch {
  return typeof fn === "function";
}

// Detecta wrapper de API si existe (apiFetch | api | default), si no usa fetch nativo
const pick = API as Record<string, unknown>;

const baseFetch: AnyFetch =
  (isAnyFetch(pick.apiFetch) && pick.apiFetch) ||
  (isAnyFetch(pick.api) && pick.api) ||
  (isAnyFetch(pick.default) && (pick.default as AnyFetch)) ||
  fetch;

/**
 * Actualiza email / cédula / celular del usuario actual
 */
export async function updateUserContact(
  id: string,
  data: { email: string; cedula: string | null; celular: string | null }
) {
  const res = await baseFetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let msg = "Error actualizando usuario";
    try {
      const j = await res.json();
      msg = j?.message || msg;
    } catch {
      /* silencio */
    }
    throw new Error(msg);
  }
  return res.json();
}
