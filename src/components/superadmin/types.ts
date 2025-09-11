// Tipos compartidos para el dashboard del SuperAdmin
export type TabKey =
  | "resumen"
  | "sirenas"
  | "usuarios"
  | "asignaciones"
  | "sesiones"
  | "bulk";

export function isTabKey(v: string): v is TabKey {
  return (
    v === "resumen" ||
    v === "sirenas" ||
    v === "usuarios" ||
    v === "asignaciones" ||
    v === "sesiones" ||
    v === "bulk"
  );
}
