"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestPasswordReset } from "@/services/password";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { ForgotPasswordSchema } from "@/lib/validators";
import { AxiosError } from "axios";
import { LogoAnimated } from "@/components/LogoAnimated";
import { motion } from "framer-motion";

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      const response = await requestPasswordReset(values);
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
          <h1 className="text-3xl sm:text-4xl font-bold">
            {isSuccess ? "¡Revisa tu correo!" : "Restablecer Contraseña"}
          </h1>

          {isSuccess ? (
            <div className="grid gap-4 text-center">
              <p className="text-sm opacity-70">
                Hemos enviado las instrucciones para restablecer tu contraseña a
                tu correo electrónico. Por favor, revisa tu bandeja de entrada
                (y la carpeta de spam).
              </p>
              <Link
                href="/login"
                className="btn-primary justify-center mx-auto text-base sm:text-lg px-6 py-3 rounded-xl cursor-pointer"
              >
                <ArrowLeft size={20} />
                <span className="ml-2">Volver a Iniciar Sesión</span>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm opacity-70">
                Ingresa tu correo electrónico y te enviaremos un enlace para
                restablecer tu contraseña.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid gap-4 text-left"
              >
                <div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    {...register("email")}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[var(--bg-dark)] text-[var(--fg-light)] dark:text-[var(--fg-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-[var(--danger)]">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary justify-center mx-auto text-base sm:text-lg px-6 py-3 rounded-xl cursor-pointer"
                >
                  <Mail size={20} />
                  <span className="ml-2">
                    {isSubmitting ? "Enviando..." : "Enviar Enlace"}
                  </span>
                </button>
              </form>

              <p className="text-sm opacity-70">
                <Link
                  href="/login"
                  className="text-[var(--accent)] hover:underline"
                >
                  ¿Recordaste tu contraseña? Inicia sesión
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
