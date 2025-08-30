"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, CheckCircle } from "lucide-react";
import { LogoAnimated } from "@/components/LogoAnimated";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { loginWeb, homeFor } from "@/services/auth";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth"; // 👈 importamos el store

// ------------------ Zod Schema ------------------
const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Usuario o email requerido")
    .max(100, "Máximo 100 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [rememberActive, setRememberActive] = useState(false);
  const { isAuthenticated, user } = useAuthStore(); // 👈 usamos el store

  // 🔹 Si ya hay sesión → redirigir según rol
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(homeFor(user.role));
    }
  }, [isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // 🔹 Al montar, precargar usuario si estaba guardado
  useEffect(() => {
    const savedUser = localStorage.getItem("rememberUser");
    if (savedUser) {
      setValue("username", savedUser);
      setValue("remember", true);
      setRememberActive(true);
    }
  }, [setValue]);

  // Escuchar cambios de "remember"
  const remember = watch("remember");
  useEffect(() => {
    setRememberActive(!!remember);
  }, [remember]);

  async function onSubmit(data: LoginForm) {
    try {
      const res = await loginWeb(data.username, data.password);

      toast.success(`Bienvenido ${res.user.username} 👋`);

      if (data.remember) {
        localStorage.setItem("rememberUser", data.username);
      } else {
        localStorage.removeItem("rememberUser");
      }

      router.push(homeFor(res.user.role));
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (axiosErr.response) {
        const msg =
          axiosErr.response.data?.message ||
          "Credenciales inválidas o error en login";
        toast.error(msg);
        console.error("Error login:", axiosErr);
      } else {
        toast.error("Error inesperado en login");
        console.error("Error login (desconocido):", err);
      }
    }
  }

  return (
    <section className="min-h-[100svh] grid place-items-center overflow-x-hidden">
      <div className="w-full max-w-5xl px-4 py-10 grid gap-10 text-center">
        {/* Logo con animaciones */}
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

        {/* Contenido central */}
        <motion.div
          className="max-w-md mx-auto grid gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold">Bienvenid@</h1>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4 text-left"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Usuario o Email"
                {...register("username")}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-[var(--bg-dark)] 
                           text-[var(--fg-light)] dark:text-[var(--fg-dark)] 
                           focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
              {rememberActive && (
                <CheckCircle
                  size={20}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
                />
              )}
            </div>
            {errors.username && (
              <p className="text-sm text-[var(--danger)]">
                {errors.username.message}
              </p>
            )}

            <input
              type="password"
              placeholder="Contraseña"
              {...register("password")}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-[var(--bg-dark)] 
                         text-[var(--fg-light)] dark:text-[var(--fg-dark)] 
                         focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
            />
            {errors.password && (
              <p className="text-sm text-[var(--danger)]">
                {errors.password.message}
              </p>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("remember")} />
              <span>Recuérdame</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary justify-center mx-auto text-base sm:text-lg px-6 py-3 rounded-xl cursor-pointer"
            >
              <LogIn size={20} />
              <span className="ml-2">
                {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
              </span>
            </button>
          </form>

          <p className="text-sm opacity-70">
            <Link
              href="/forgot-password"
              className="text-[var(--accent)] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
