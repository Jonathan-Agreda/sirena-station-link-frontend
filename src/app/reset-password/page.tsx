"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/services/password";
import { toast } from "sonner";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { ResetPasswordSchema } from "@/lib/validators";
import { useSearchParams } from "next/navigation";
import { AxiosError } from "axios";

type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isSuccess, setIsSuccess] = useState(false);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: token || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    formState: { isSubmitting, errors },
    register,
    handleSubmit,
  } = form;

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
      <div className="text-center">
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
          Enlace Inválido
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          El enlace para restablecer la contraseña es incorrecto o está
          incompleto. Por favor, solicita uno nuevo.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Solicitar Nuevo Enlace
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
          ¡Contraseña Actualizada!
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Tu contraseña ha sido cambiada exitosamente.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Ir a Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register("token")} />
      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Nueva Contraseña
        </label>
        <div className="mt-1">
          <input
            id="newPassword"
            type="password"
            {...register("newPassword")}
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          {errors.newPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.newPassword.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirmar Nueva Contraseña
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="flex justify-center items-center mb-6">
          <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h2 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">
            Define tu Nueva Contraseña
          </h2>
        </div>
        <Suspense fallback={<div>Cargando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
