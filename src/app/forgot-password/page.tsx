"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestPasswordReset } from "@/services/password";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordSchema } from "@/lib/validators";
import { AxiosError } from "axios";

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
      // 👇 CORRECCIÓN: Tipado explícito del error
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError?.response?.data?.message ||
        "Ocurrió un error. Por favor, inténtalo de nuevo.";
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-white">
          Restablecer Contraseña
        </h2>

        {isSuccess ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Hemos enviado las instrucciones para restablecer tu contraseña a
              tu correo electrónico. Por favor, revisa tu bandeja de entrada (y
              la carpeta de spam).
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Correo Electrónico
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    {...register("email")}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Enviando..."
                  : "Enviar Enlace de Restablecimiento"}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                ¿Recordaste tu contraseña? Inicia sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
