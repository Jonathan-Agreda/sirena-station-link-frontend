"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { completeFirstLoginWeb, homeFor } from "@/services/auth";
import { useRouter } from "next/navigation";
import type { MeResponse } from "@/services/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import { isAxiosError } from "axios";

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
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const strength = useMemo(() => {
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

  const submit = useCallback(async () => {
    if (!userField) return toast.error("Ingresa tu usuario o email");
    if (!currentPassword)
      return toast.error(
        "No tengo tu contraseña actual. Vuelve a abrir el diálogo desde el login."
      );
    if (!newPass || newPass.length < 6)
      return toast.error(
        "La nueva contraseña debe tener al menos 6 caracteres"
      );
    if (newPass !== confirm) return toast.error("Las contraseñas no coinciden");

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
    } catch (e: unknown) {
      let msg = "No se pudo completar el primer inicio de sesión";
      if (isAxiosError(e)) msg = e.response?.data?.message || e.message;
      else if (e instanceof Error) msg = e.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [
    userField,
    currentPassword,
    newPass,
    confirm,
    onClose,
    onSuccess,
    router,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) onClose();
      if (e.key === "Enter" && open && valid && !loading) submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, valid, loading, onClose, submit]);

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
            className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
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
                  <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                    Cambio de contraseña requerido
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Actualiza tu contraseña para continuar.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-lg p-2 text-sm text-neutral-700 dark:text-neutral-300 hover:opacity-100 disabled:opacity-40"
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
                <label className="text-xs text-neutral-700 dark:text-neutral-300">
                  Usuario o email
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  autoComplete="username"
                  className="w-full rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-[--brand-primary] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  placeholder="usuario@example.com"
                  value={userField}
                  onChange={(e) => setUserField(e.target.value)}
                />
              </div>

              {/* Nueva contraseña */}
              <div className="grid gap-1">
                <label className="text-xs text-neutral-700 dark:text-neutral-300">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-[--brand-primary] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    placeholder="Mínimo 6 caracteres"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-600 dark:text-neutral-300 hover:opacity-100"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? "Ocultar" : "Mostrar"}
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Barra de fuerza */}
                <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-500/20">
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
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  {newPass.length < 6
                    ? "Demasiado corta"
                    : newPass.length < 10
                    ? "Aceptable"
                    : "Fuerte"}
                </p>
              </div>

              {/* Confirmar contraseña */}
              <div className="grid gap-1">
                <label className="text-xs text-neutral-700 dark:text-neutral-300">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-[--brand-primary] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-600 dark:text-neutral-300 hover:opacity-100"
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
                className="cursor-pointer rounded-xl border border-neutral-300 dark:border-white/10 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={!valid || loading}
                onClick={submit}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-[var(--brand-primary,#e11d48)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
