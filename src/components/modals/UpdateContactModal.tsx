"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  onSubmit: (data: {
    email: string;
    cedula: string | null;
    celular: string | null;
  }) => Promise<void>;
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
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateContactInput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: initial.email ?? "",
      cedula: initial.cedula ?? "",
      celular: initial.celular ?? "",
    },
  });

  useEffect(() => {
    reset({
      email: initial.email ?? "",
      cedula: initial.cedula ?? "",
      celular: initial.celular ?? "",
    });
  }, [initial, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const payload = {
      email: values.email.trim(),
      cedula: values.cedula?.trim() ? values.cedula.trim() : null,
      celular: values.celular?.trim() ? values.celular.trim() : null,
    };
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else if (typeof err === "object" && err && "message" in err) {
        setServerError(String((err as { message?: string }).message));
      } else {
        setServerError("No se pudo actualizar tus datos");
      }
    }
  });

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Actualizar datos de contacto"
    >
      <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-lg">
        <h3 className="text-lg font-semibold">Actualizar datos</h3>
        <p className="text-sm opacity-80 mt-1">
          Edita tu <strong>email</strong>, <strong>cédula</strong> y{" "}
          <strong>celular</strong>.
        </p>

        <form onSubmit={submit} className="mt-4 grid gap-3">
          <div>
            <label className="text-sm opacity-70">Email</label>
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm opacity-70">Cédula</label>
              <input
                inputMode="numeric"
                {...register("cedula")}
                placeholder="10 dígitos (opcional)"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
              />
              {errors.cedula && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.cedula.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm opacity-70">Celular</label>
              <input
                inputMode="numeric"
                {...register("celular")}
                placeholder="10 dígitos (opcional)"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
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

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="rounded-lg bg-[--brand-primary] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
