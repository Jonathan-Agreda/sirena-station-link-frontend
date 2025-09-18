// src/components/UserProfileCard.tsx
"use client";

import { useState } from "react";
import { MeResponse } from "@/services/auth";
import { getTelegramLink } from "@/services/users";
import { toast } from "sonner";
import { Send, CheckCircle2, BellOff } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import ConfirmDialog from "@/components/superadmin/modals/ConfirmDialog"; // Importa el confirm dialog

// Nueva función para desvincular Telegram
import api from "@/lib/api";

type Props = {
  user: MeResponse;
  onOpenContactModal: () => void;
};

export default function UserProfileCard({ user, onOpenContactModal }: Props) {
  // Estado y lógica de Telegram
  const [isLinking, setIsLinking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const queryClient = useQueryClient();

  // Mutación para desvincular Telegram
  const unlinkTelegramMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/residents/me/telegram", { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Notificaciones de Telegram desactivadas.");
    },
    onError: (error: unknown) => {
      let msg = "No se pudo desactivar Telegram.";
      if (error instanceof Error) msg = error.message;
      toast.error(msg);
    },
  });

  const handleLinkTelegram = async () => {
    setIsLinking(true);
    try {
      const { link } = await getTelegramLink();
      window.open(link, "_blank");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(
        'Se abrió una pestaña para vincular Telegram. Presiona "Start".',
        {
          description:
            "Al regresar a esta pestaña, tu estado se actualizará automáticamente.",
          duration: 8000,
        }
      );
    } catch (error: unknown) {
      let errorMessage = "No se pudo generar el link.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  // Handler para confirmar desvinculación
  const handleUnlinkTelegram = () => {
    unlinkTelegramMutation.mutate();
    setConfirmOpen(false);
  };

  return (
    <div className="rounded-xl border p-4 grid gap-4">
      {/* Perfil */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-70">Tu perfil</p>
          <button
            onClick={onOpenContactModal}
            className="cursor-pointer rounded-lg border border-neutral-300 dark:border-white/10 
           px-3 py-1.5 text-sm 
           bg-white text-neutral-700 hover:bg-neutral-100 
           dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800
           transition"
            title="Actualizar email, cédula y celular"
          >
            Actualizar datos
          </button>
        </div>

        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="opacity-60">Usuario</dt>
            <dd className="font-medium break-words">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username || "—"}
            </dd>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="opacity-60">Email</dt>
            <dd className="font-medium truncate" title={user.email || "—"}>
              {user.email || "—"}
            </dd>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="opacity-60">Etapa</dt>
            <dd className="font-medium">{user.etapa || "—"}</dd>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="opacity-60">Manzana</dt>
            <dd className="font-medium">{user.manzana || "—"}</dd>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="opacity-60">Villa</dt>
            <dd className="font-medium">{user.villa || "—"}</dd>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="opacity-60">Rol</dt>
            <dd className="font-medium">{user.role}</dd>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="opacity-60">Cédula</dt>
            <dd className="font-medium">{user.cedula || "—"}</dd>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="opacity-60">Celular</dt>
            <dd className="font-medium">{user.celular || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Notificaciones Telegram */}
      <div className="border-t border-neutral-200 dark:border-white/10 pt-4 grid gap-2">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          Notificaciones
        </h4>

        {user.telegramChatId ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
              <CheckCircle2 size={18} />
              <span>Notificaciones de Telegram activadas.</span>
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={unlinkTelegramMutation.isLoading}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <BellOff size={16} />
              <span>
                {unlinkTelegramMutation.isLoading
                  ? "Desactivando..."
                  : "Desactivar notificaciones"}
              </span>
            </button>
            {/* Confirmación modal */}
            <ConfirmDialog
              open={confirmOpen}
              title="Desactivar notificaciones"
              message="¿Seguro que quieres desactivar las notificaciones de Telegram? Podrás volver a activarlas cuando quieras."
              confirmText="Sí, desactivar"
              cancelText="Cancelar"
              loading={unlinkTelegramMutation.isLoading}
              onConfirm={handleUnlinkTelegram}
              onClose={() => setConfirmOpen(false)}
            />
          </div>
        ) : (
          <button
            onClick={handleLinkTelegram}
            disabled={isLinking}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-[var(--brand-primary,#e11d48)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
    </div>
  );
}
