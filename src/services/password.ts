import api from "@/lib/api";
import { ForgotPasswordSchema } from "@/lib/validators";
import { z } from "zod";

/**
 * Cambio de contraseña manual (usuario autenticado).
 * Ajusta la URL si tu backend expone otra ruta (p.ej. "/change-password").
 */
export async function changePasswordManual(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const { data } = await api.post("/auth/change-password/web", {
    currentPassword,
    newPassword,
  });
  return data as { message: string };
}

/**
 * Solicita el enlace de restablecimiento de contraseña para un email.
 */
export async function requestPasswordReset(
  values: z.infer<typeof ForgotPasswordSchema>
): Promise<{ message: string }> {
  const { data } = await api.post("/auth/forgot-password", values);
  return data as { message: string };
}
