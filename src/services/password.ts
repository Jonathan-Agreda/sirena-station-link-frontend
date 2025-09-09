import api from "@/lib/api";
import {
  ForgotPasswordSchema,
  ResetPasswordSchema, // 👈 Se añade el import que falta
} from "@/lib/validators";
import { z } from "zod";

/**
 * Cambio de contraseña manual (usuario autenticado).
 * Esta función se mantiene intacta.
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
 * Esta función también se mantiene intacta.
 */
export async function requestPasswordReset(
  values: z.infer<typeof ForgotPasswordSchema>
): Promise<{ message: string }> {
  const { data } = await api.post("/auth/forgot-password", values);
  return data as { message: string };
}

/**
 * 👇 NUEVA FUNCIÓN AÑADIDA
 * Envía el token y la nueva contraseña al backend para completar el reseteo.
 */
export async function resetPassword(
  values: z.infer<typeof ResetPasswordSchema>
): Promise<{ message: string }> {
  const { data } = await api.post("/auth/reset-password", values);
  return data as { message: string };
}
