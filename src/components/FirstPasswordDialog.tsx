// components/FirstPasswordDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { completeFirstLoginWeb, homeFor } from "@/services/auth";
import { useRouter } from "next/navigation";
import type { MeResponse } from "@/services/auth";

type Props = {
  open: boolean;
  onClose: () => void;
  usernameOrEmail?: string; // 👈 nombre alineado con el backend
  currentPassword?: string; // temporal actual
  onSuccess?: (me: MeResponse) => void; // opcional, como lo usas en la page
};

export default function FirstPasswordDialog({
  open,
  onClose,
  usernameOrEmail,
  currentPassword,
  onSuccess,
}: Props) {
  const router = useRouter();

  // Permitimos editar el usuario si no vino desde el login
  const [userField, setUserField] = useState(usernameOrEmail ?? "");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUserField(usernameOrEmail ?? "");
  }, [usernameOrEmail]);

  if (!open) return null;

  const submit = async () => {
    if (!userField) {
      toast.error("Ingresa tu usuario o email");
      return;
    }
    if (!currentPassword) {
      toast.error(
        "No tengo tu contraseña actual. Vuelve a abrir el diálogo desde el login."
      );
      return;
    }
    if (!newPass || newPass.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPass !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      const { user } = await completeFirstLoginWeb(
        userField, // ✅ ahora sí se envía usernameOrEmail
        currentPassword,
        newPass
      );
      toast.success("Contraseña actualizada. ¡Bienvenido!");
      onClose();
      if (onSuccess) onSuccess(user);
      else router.replace(homeFor(user.role));
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo completar el primer inicio de sesión";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl">
        <h2 className="mb-2 text-xl font-semibold">
          Cambio de contraseña requerido
        </h2>
        <p className="mb-4 text-sm opacity-80">
          Tu cuenta requiere actualizar la contraseña para continuar.
        </p>

        <div className="grid gap-3">
          {/* Campo de usuario (prefill, editable si lo necesitas) */}
          <input
            type="text"
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder="Usuario o email"
            value={userField}
            onChange={(e) => setUserField(e.target.value)}
          />

          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder="Nueva contraseña"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            disabled={loading}
            onClick={submit}
            className="btn-primary rounded-xl px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Actualizar y entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
