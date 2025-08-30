"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { LogIn } from "lucide-react";
import { LogoAnimated } from "@/components/LogoAnimated";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";

// ------------------ Zod Schema ------------------
const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Usuario o email requerido")
    .max(100, "Máximo 100 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    try {
      const res = await api.post("/auth/login/web", data);
      setAuth(res.data.user, res.data.accessToken);

      toast.success(`Bienvenido ${res.data.user.username} 👋`);
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Credenciales inválidas o error en login";
      toast.error(msg);
      console.error("Error login:", err);
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
              {...register("username")}
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
              {...register("password")}
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
