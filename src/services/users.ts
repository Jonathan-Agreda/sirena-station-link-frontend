// src/services/users.ts
import api from "@/lib/api";

/**
 * Actualiza email / cédula / celular del usuario actual.
 * IMPORTANTE: `api` ya tiene baseURL '/api', así que NO anteponemos '/api' aquí.
 * Se envían solo los campos que realmente cambiaron.
 */
export async function updateMyContact(
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

  const { data: res } = await api.put("/residents/me/contact", payload, {
    withCredentials: true,
  });

  return res;
}

/**
 * Llama al backend para generar un link de vinculación de Telegram
 * para el usuario actualmente logueado.
 */
export const getTelegramLink = async (): Promise<{ link: string }> => {
  try {
    // Usamos withCredentials para enviar la cookie de sesión HTTP-Only
    const response = await api.get("/telegram/generate-link", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Telegram link:", error);
    throw new Error("No se pudo generar el link de Telegram.");
  }
};

/**
 * Desvincula Telegram del usuario actual.
 * Elimina el chatId en el backend y desactiva notificaciones.
 */
export const unlinkTelegram = async (): Promise<{ ok: boolean }> => {
  try {
    const response = await api.delete("/residents/me/telegram", {
      withCredentials: true,
    });
    return response.data as { ok: boolean };
  } catch (error) {
    console.error("Error desvinculando Telegram:", error);
    throw new Error("No se pudo desactivar Telegram.");
  }
};
