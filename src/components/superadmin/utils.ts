"use client";

/** Igual que tus helpers actuales, para reutilizar en tabs. */
export function formatDateTime(ms: number | string | null | undefined) {
  const n = typeof ms === "string" ? Number(ms) : (ms as number | undefined);
  if (!n || Number.isNaN(n)) return "—";
  try {
    return new Date(n).toLocaleString();
  } catch {
    return "—";
  }
}

export function errMsg(e: unknown) {
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
