"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import { isAxiosError } from "axios";
import { changePasswordManual } from "@/services/password";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** ---------- Helpers typesafe para errores ---------- */
type ErrorPayload = {
  message?: string | string[];
};

function extractMessage(err: unknown): string {
  // axios error → intentar leer payload del backend
  if (isAxiosError(err)) {
    const data = err.response?.data;

    // algunos backends devuelven string directo
    if (typeof data === "string") return data;

    // si es objeto y tiene 'message' string o string[]
    if (typeof data === "object" && data !== null && "message" in data) {
      const msg = (data as ErrorPayload).message;
      if (Array.isArray(msg))
        return msg.filter((x): x is string => typeof x === "string").join(", ");
      if (typeof msg === "string") return msg;
    }
    // fallback a mensaje de axios
    return err.message ?? "Error de red";
  }

  // Error normal
  if (err instanceof Error) return err.message;

  return "No se pudo actualizar la contraseña";
}
/** --------------------------------------------------- */

export default function ManualChangePasswordModal({ open, onClose }: Props) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentPass("");
      setNewPass("");
      setConfirm("");
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open]);

  const strength = useMemo(() => {
    if (!newPass) return 0;
    if (newPass.length < 6) return 1;
    if (newPass.length < 10) return 2;
    return 3;
  }, [newPass]);

  const valid =
    !!currentPass &&
    !!newPass &&
    newPass.length >= 6 &&
    newPass === confirm &&
    newPass !== currentPass;

  const submit = useCallback(async () => {
    if (!valid) return;
    try {
      setLoading(true);
      await changePasswordManual(currentPass, newPass);
      toast.success("Contraseña actualizada");
      onClose();
    } catch (e: unknown) {
      toast.error(extractMessage(e));
    } finally {
      setLoading(false);
    }
  }, [valid, currentPass, newPass, onClose]);

  // ESC para cerrar, Enter para enviar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) onClose();
      if (e.key === "Enter" && open && valid && !loading) submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, valid, loading, submit, onClose]);

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
            className="w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-2xl"
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-primary,#e11d48)]/10 text-[var(--brand-primary,#e11d48)]">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
                  <p className="text-xs opacity-70">
                    Ingresa tu contraseña actual y la nueva.
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
              {/* Contraseña actual */}
              <div className="grid gap-1">
                <label className="text-xs opacity-70">Contraseña actual</label>
                <div className="relative">
                  <input
                    ref={firstInputRef}
                    type={showCurrent ? "text" : "password"}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 pr-10 outline-none focus:ring"
                    placeholder="Tu contraseña actual"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-70 hover:opacity-100"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? "Ocultar" : "Mostrar"}
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div className="grid gap-1">
                <label className="text-xs opacity-70">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 pr-10 outline-none focus:ring"
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

                {/* Barra fuerza simple */}
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
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 pr-10 outline-none focus:ring"
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
                {newPass && currentPass && newPass === currentPass && (
                  <p className="text-[11px] text-red-500/90">
                    La nueva contraseña no puede ser igual a la actual.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              <button
                disabled={loading}
                onClick={onClose}
                className="cursor-pointer rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={!valid || loading}
                onClick={submit}
                className="cursor-pointer rounded-xl bg-[var(--brand-primary,#e11d48)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando…" : "Actualizar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
