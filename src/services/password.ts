// src/services/password.ts
import api from "@/lib/api";

/**
 * Cambio de contraseña manual (usuario autenticado).
 * Ajusta la URL si tu backend expone otra ruta (p.ej. "/change-password").
 */
export async function changePasswordManual(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const { data } = await api.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
}
