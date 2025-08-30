// components/FirstPasswordDialog.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { completeFirstLoginWeb, homeFor } from "@/services/auth";
import { useRouter } from "next/navigation";
import type { MeResponse } from "@/services/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  usernameOrEmail?: string;
  currentPassword?: string;
  onSuccess?: (me: MeResponse) => void;
};

export default function FirstPasswordDialog({
  open,
  onClose,
  usernameOrEmail,
  currentPassword,
  onSuccess,
}: Props) {
  const router = useRouter();

  const [userField, setUserField] = useState(usernameOrEmail ?? "");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setUserField(usernameOrEmail ?? "");
  }, [usernameOrEmail]);

  useEffect(() => {
    if (open) {
      // focus al primer campo vacío
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const strength = useMemo(() => {
    // métrica básica (solo longitud mínima 6)
    if (!newPass) return 0;
    if (newPass.length < 6) return 1;
    if (newPass.length < 10) return 2;
    return 3;
  }, [newPass]);

  const valid =
    !!userField &&
    !!currentPassword &&
    !!newPass &&
    newPass.length >= 6 &&
    newPass === confirm;

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
        userField,
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

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) onClose();
      if (e.key === "Enter" && open && valid && !loading) submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, valid, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !loading && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-card/95 shadow-2xl ring-1 ring-white/10"
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Cambio de contraseña requerido
                  </h2>
                  <p className="text-xs opacity-70">
                    Actualiza tu contraseña para continuar.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-lg p-2 text-sm opacity-70 hover:opacity-100 disabled:opacity-40"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 pt-4 grid gap-3">
              {/* Usuario */}
              <div className="grid gap-1">
                <label className="text-xs opacity-70">Usuario o email</label>
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                  placeholder="usuario@example.com"
                  value={userField}
                  onChange={(e) => setUserField(e.target.value)}
                />
              </div>

              {/* Nueva contraseña */}
              <div className="grid gap-1">
                <label className="text-xs opacity-70">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    className="w-full rounded-xl border px-3 py-2 pr-10 outline-none focus:ring"
                    placeholder="Mínimo 6 caracteres"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-70 hover:opacity-100"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? "Ocultar" : "Mostrar"}
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Barra de fuerza simple */}
                <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-500/20">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      strength === 0
                        ? "w-0"
                        : strength === 1
                        ? "w-1/3 bg-red-500/80"
                        : strength === 2
                        ? "w-2/3 bg-yellow-500/80"
                        : "w-full bg-green-500/80"
                    }`}
                  />
                </div>
                <p className="text-[11px] opacity-70">
                  {newPass.length < 6
                    ? "Demasiado corta"
                    : newPass.length < 10
                    ? "Aceptable"
                    : "Fuerte"}
                </p>
              </div>

              {/* Confirmación */}
              <div className="grid gap-1">
                <label className="text-xs opacity-70">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="w-full rounded-xl border px-3 py-2 pr-10 outline-none focus:ring"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-70 hover:opacity-100"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Ocultar" : "Mostrar"}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirm && newPass === confirm && (
                  <div className="mt-1 flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle2 size={14} />
                    <span>Coinciden</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              <button
                disabled={loading}
                onClick={onClose}
                className="cursor-pointer rounded-xl border px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={!valid || loading}
                onClick={submit}
                className="btn-primary cursor-pointer rounded-xl px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando…" : "Actualizar y entrar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
