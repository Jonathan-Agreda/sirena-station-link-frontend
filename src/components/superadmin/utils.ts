// src/components/superadmin/utils.ts

/**
 * Extrae un mensaje de error legible de una excepción desconocida.
 */
export function errMsg(e: unknown): string {
  if (typeof e === "string") return e;
  if (typeof e === "object" && e) {
    const r = e as {
      message?: string;
      response?: { data?: { message?: string } };
    };
    return r.response?.data?.message || r.message || "Ocurrió un error";
  }
  return "Ocurrió un error";
}

/**
 * Formatea una fecha a partir de un timestamp en milisegundos.
 */
export function formatDateTime(ms: number | string | null | undefined): string {
  const n = typeof ms === "string" ? Number(ms) : (ms as number | undefined);
  if (!n || Number.isNaN(n)) return "—";
  try {
    return new Date(n).toLocaleString();
  } catch {
    return "—";
  }
}
