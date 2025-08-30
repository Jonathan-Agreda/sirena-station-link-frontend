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
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import FirstPasswordDialog from "@/components/FirstPasswordDialog"; // 👈 Asegúrate de tener el componente

const loginSchema = z.object({
  username: z.string().min(1, "Usuario o email requerido").max(100),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [rememberActive, setRememberActive] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  // 👇 estado para primer login (modal)
  const [firstOpen, setFirstOpen] = useState(false);
  const [firstCreds, setFirstCreds] = useState<{
    username: string;
    password: string;
  }>({
    username: "",
    password: "",
  });

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

  useEffect(() => {
    const savedUser = localStorage.getItem("rememberUser");
    if (savedUser) {
      setValue("username", savedUser);
      setValue("remember", true);
      setRememberActive(true);
    }
  }, [setValue]);

  const remember = watch("remember");

  useEffect(() => {
    setRememberActive(!!remember);
  }, [remember]);

  async function onSubmit(data: LoginForm) {
    try {
      // 1) Prelogin: detecta si KC exige cambio de clave
      const pre = await api.post("/auth/prelogin", {
        usernameOrEmail: data.username,
        password: data.password,
      });

      if (
        pre.data?.ok === false &&
        pre.data?.code === "PASSWORD_CHANGE_REQUIRED"
      ) {
        // 👇 Abrimos modal y le pasamos el usuario + clave temporal
        setFirstCreds({ username: data.username, password: data.password });
        setFirstOpen(true);
        return;
      }

      // 2) Si no requiere cambio → login normal
      const res = await loginWeb(data.username, data.password);

      toast.success(`Bienvenido ${res.user.username} 👋`);
      if (data.remember) localStorage.setItem("rememberUser", data.username);
      else localStorage.removeItem("rememberUser");

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
    <>
      {/* Modal de primer login */}
      <FirstPasswordDialog
        open={firstOpen}
        onClose={() => setFirstOpen(false)}
        usernameOrEmail={firstCreds.username} // 👈 se pasa al modal
        currentPassword={firstCreds.password} // 👈 se pasa al modal
        onSuccess={(me) => {
          toast.success(`Bienvenido ${me.username} 👋`);
          router.push(homeFor(me.role));
        }}
      />

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
    </>
  );
}
