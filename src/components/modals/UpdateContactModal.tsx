"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Mail, IdCard, Phone } from "lucide-react";
import { toast } from "sonner";

const TenDigits = /^\d{10}$/;

const FormSchema = z.object({
  email: z.string().min(1, "Requerido").email("Email no válido").max(120),
  cedula: z
    .union([
      z.literal(""),
      z.string().regex(TenDigits, "Debe tener 10 dígitos"),
    ])
    .optional(),
  celular: z
    .union([
      z.literal(""),
      z.string().regex(TenDigits, "Debe tener 10 dígitos"),
    ])
    .optional(),
});

export type UpdateContactInput = z.infer<typeof FormSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  initial: { email: string; cedula?: string | null; celular?: string | null };
  onSubmit: (
    data: Partial<{
      email: string;
      cedula: string | null;
      celular: string | null;
    }>
  ) => Promise<void>;
};

export default function UpdateContactModal({
  open,
  onClose,
  initial,
  onSubmit,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<UpdateContactInput>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      email: initial.email ?? "",
      cedula: initial.cedula ?? "",
      celular: initial.celular ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      email: initial.email ?? "",
      cedula: initial.cedula ?? "",
      celular: initial.celular ?? "",
    });
  }, [open, initial.email, initial.cedula, initial.celular, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  const emailVal = watch("email");
  const cedulaVal = watch("cedula");
  const celularVal = watch("celular");
  const trimOrNull = (v?: string) => (v && v.trim() ? v.trim() : null);

  const hasChanges = useMemo(() => {
    const eChanged = (emailVal ?? "").trim() !== (initial.email ?? "");
    const ceduChanged = trimOrNull(cedulaVal) !== (initial.cedula ?? null);
    const celuChanged = trimOrNull(celularVal) !== (initial.celular ?? null);
    return eChanged || ceduChanged || celuChanged;
  }, [
    emailVal,
    cedulaVal,
    celularVal,
    initial.email,
    initial.cedula,
    initial.celular,
  ]);

  const canSave = isValid && hasChanges && !isSubmitting;

  const submit = handleSubmit(async (values) => {
    setServerError(null);

    const nextEmail = values.email.trim();
    const nextCedula = trimOrNull(values.cedula);
    const nextCelular = trimOrNull(values.celular);

    const changes: Partial<{
      email: string;
      cedula: string | null;
      celular: string | null;
    }> = {};
    if (nextEmail !== (initial.email ?? "")) changes.email = nextEmail;
    if ((initial.cedula ?? null) !== nextCedula) changes.cedula = nextCedula;
    if ((initial.celular ?? null) !== nextCelular)
      changes.celular = nextCelular;

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    try {
      await onSubmit(changes);
      toast.success("Datos actualizados correctamente ✅");
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar tus datos";
      setServerError(message);
      toast.error(message);
    }
  });

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Actualizar datos de contacto"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background/95 shadow-2xl ring-1 ring-[--brand-primary]/20">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-base sm:text-lg font-semibold">
            Actualizar datos
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="grid gap-4 px-5 py-4">
          <p className="text-sm opacity-80">
            Edita tu <strong>email</strong>, <strong>cédula</strong> y{" "}
            <strong>celular</strong>.
          </p>

          {/* Email */}
          <div>
            <label className="text-sm opacity-70 flex items-center gap-2">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              {...register("email")}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[--brand-primary]"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Cédula & Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm opacity-70 flex items-center gap-2">
                <IdCard size={16} /> Cédula
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10 dígitos (opcional)"
                {...register("cedula", {
                  onChange: (e) => {
                    e.target.value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                  },
                })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[--brand-primary]"
              />
              {errors.cedula && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.cedula.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm opacity-70 flex items-center gap-2">
                <Phone size={16} /> Celular
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10 dígitos (opcional)"
                {...register("celular", {
                  onChange: (e) => {
                    e.target.value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                  },
                })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-[--brand-primary]"
              />
              {errors.celular && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.celular.message}
                </p>
              )}
            </div>
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Footer */}
          <div className="mt-1 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!canSave}
              aria-disabled={!canSave}
              title={
                canSave
                  ? "Guardar cambios"
                  : "Completa cambios válidos para guardar"
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-primary]
                ${
                  canSave
                    ? "cursor-pointer bg-[--brand-primary] hover:brightness-110 hover:shadow-md"
                    : "cursor-not-allowed bg-[--brand-primary]/60"
                }`}
            >
              {isSubmitting ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
