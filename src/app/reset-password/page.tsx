"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/services/password";
import { toast } from "sonner";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Key, CheckCircle } from "lucide-react";
import { ResetPasswordSchema } from "@/lib/validators";
import { useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { LogoAnimated } from "@/components/LogoAnimated";
import { motion } from "framer-motion";

type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: token || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      const response = await resetPassword(values);
      toast.success(response.message);
      setIsSuccess(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError?.response?.data?.message ||
        "Ocurrió un error. Por favor, inténtalo de nuevo.";
      toast.error(message);
    }
  };

  if (!token) {
    return (
      <div className="grid gap-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--danger)]">
          Enlace Inválido
        </h1>
        <p className="text-sm opacity-70">
          El enlace para restablecer la contraseña es incorrecto o está
          incompleto. Por favor, solicita uno nuevo.
        </p>
        <Link
          href="/forgot-password"
          className="btn-primary justify-center mx-auto text-base sm:text-lg px-6 py-3 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span className="ml-2">Solicitar Nuevo Enlace</span>
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="grid gap-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--success)]">
          ¡Contraseña Actualizada!
        </h1>
        <p className="text-sm opacity-70">
          Tu contraseña ha sido cambiada exitosamente.
        </p>
        <Link
          href="/login"
          className="btn-primary justify-center mx-auto text-base sm:text-lg px-6 py-3 rounded-xl cursor-pointer"
        >
          <CheckCircle size={20} />
          <span className="ml-2">Ir a Iniciar Sesión</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-bold">
        Define tu Nueva Contraseña
      </h1>
      <p className="text-sm opacity-70">
        Ingresa tu nueva contraseña dos veces para confirmarla.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 text-left">
        <input type="hidden" {...register("token")} />

        <div>
          <input
            id="newPassword"
            type="password"
            placeholder="Nueva Contraseña"
            {...register("newPassword")}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[var(--bg-dark)] text-[var(--fg-light)] dark:text-[var(--fg-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
          {errors.newPassword && (
            <p className="mt-2 text-sm text-[var(--danger)]">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirmar Nueva Contraseña"
            {...register("confirmPassword")}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[var(--bg-dark)] text-[var(--fg-light)] dark:text-[var(--fg-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-[var(--danger)]">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary justify-center mx-auto text-base sm:text-lg px-6 py-3 rounded-xl cursor-pointer"
        >
          <Key size={20} />
          <span className="ml-2">
            {isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
          </span>
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="min-h-[100svh] grid place-items-center overflow-x-hidden">
      <div className="w-full max-w-5xl px-4 py-10 grid gap-10 text-center">
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: [1, 1.06, 1] }}
          transition={{
            opacity: { duration: 1.1, ease: "easeOut" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <LogoAnimated />
        </motion.div>

        <motion.div
          className="max-w-md mx-auto grid gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.5 }}
        >
          <Suspense
            fallback={<div className="text-center opacity-70">Cargando...</div>}
          >
            <ResetPasswordForm />
          </Suspense>
        </motion.div>
      </div>
    </section>
  );
}
