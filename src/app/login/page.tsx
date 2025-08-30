"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import axios from "@/lib/api";
import { LogIn } from "lucide-react";
import { LogoAnimated } from "@/components/LogoAnimated";
import { useForm } from "react-hook-form";

type LoginForm = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  async function onSubmit(data: LoginForm) {
    try {
      const res = await axios.post("/auth/login/web", data, {
        withCredentials: true,
      });
      setAuth(res.data.user, res.data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
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

        {/* Contenido central con fade-in */}
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
            <input
              type="text"
              placeholder="Usuario o Email"
              {...register("username", {
                required: "Usuario o email requerido",
              })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[var(--bg-dark)] text-[var(--fg-light)] dark:text-[var(--fg-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
            />
            {errors.username && (
              <p className="text-sm text-[var(--danger)]">
                {errors.username.message}
              </p>
            )}

            <input
              type="password"
              placeholder="Contraseña"
              {...register("password", { required: "Contraseña requerida" })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[var(--bg-dark)] text-[var(--fg-light)] dark:text-[var(--fg-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
            />
            {errors.password && (
              <p className="text-sm text-[var(--danger)]">
                {errors.password.message}
              </p>
            )}

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
            <a
              href="/forgot-password"
              className="text-[var(--accent)] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
