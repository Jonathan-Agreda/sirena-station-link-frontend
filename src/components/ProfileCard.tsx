"use client";

import { MeResponse } from "@/services/auth";
import { useState } from "react"; // <-- NUEVA IMPORTACIÓN
import { getTelegramLink } from "@/services/users"; // <-- NUEVA IMPORTACIÓN
import { toast } from "sonner"; // <-- NUEVA IMPORTACIÓN
import { Send, CheckCircle2 } from "lucide-react"; // <-- NUEVA IMPORTACIÓN

type Props = {
  user: MeResponse;
};

function isResident(user: MeResponse): boolean {
  return user.role === "RESIDENTE";
}

export default function ProfileCard({ user }: Props) {
  const blocked = isResident(user) ? user.alicuota === false : false;

  // --- INICIO NUEVO CÓDIGO ---
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkTelegram = async () => {
    setIsLinking(true);
    try {
      const { link } = await getTelegramLink();
      window.open(link, "_blank");
      toast.success(
        'Se abrió una pestaña para vincular Telegram. Presiona "Start".',
        {
          description:
            "Deberás cerrar sesión y volver a entrar para ver el cambio reflejado aquí.",
          duration: 8000,
        }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "No se pudo generar el link.");
      } else {
        toast.error("No se pudo generar el link.");
      }
    } finally {
      setIsLinking(false);
    }
  };
  // --- FIN NUEVO CÓDIGO ---

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10 p-4 grid gap-4">
      {/* Sección de Bienvenida (existente) */}
      <p className="opacity-80 text-neutral-800 dark:text-neutral-100">
        Hola <strong>{user.username ?? "Usuario"}</strong>
        {isResident(user) && user.urbanizacion?.name && (
          <>
            {" "}
            — Urbanización: <strong>{user.urbanizacion.name}</strong>
          </>
        )}
      </p>

      {/* Bloqueo por Alícuota (existente) */}
      {blocked && (
        <div className="rounded-lg border border-[--danger] p-2 text-sm text-[--danger]">
          Tu alícuota está pendiente. La activación de sirena está bloqueada
          temporalmente.
        </div>
      )}

      {/* --- INICIO NUEVA SECCIÓN TELEGRAM --- */}
      <div className="border-t border-neutral-200 dark:border-white/10 pt-4 grid gap-2">
        <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">
          Notificaciones
        </h4>

        {user.telegramChatId ? (
          // Estado: VINCULADO
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
            <CheckCircle2 size={18} />
            <span>Notificaciones de Telegram activadas.</span>
          </div>
        ) : (
          // Estado: NO VINCULADO
          <button
            onClick={handleLinkTelegram}
            disabled={isLinking}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            <span>
              {isLinking
                ? "Generando..."
                : "Activar Notificaciones de Telegram"}
            </span>
          </button>
        )}
      </div>
      {/* --- FIN NUEVA SECCIÓN TELEGRAM --- */}
    </div>
  );
}
