"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { LogoAnimated } from "@/components/LogoAnimated";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Mostrar toast al entrar
    toast.info(
      "La recuperación de contraseña estará disponible en próximas versiones."
    );

    // Redirigir automáticamente a Home en 6s
    const timer = setTimeout(() => router.push("/"), 6000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <section className="min-h-[100svh] grid place-items-center text-center px-4">
      <motion.div
        className="flex flex-col items-center gap-6 max-w-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <LogoAnimated />

        <h1 className="text-2xl font-bold">Funcionalidad en desarrollo</h1>
        <p className="opacity-80">
          La opción <strong>“¿Olvidaste tu contraseña?”</strong> estará
          disponible en una próxima actualización.
        </p>

        <p className="text-sm opacity-70">
          Serás redirigido automáticamente a la página principal en unos
          segundos.
        </p>

        <button onClick={() => router.push("/")} className="btn-primary mt-4">
          Volver al inicio
        </button>
      </motion.div>
    </section>
  );
}
