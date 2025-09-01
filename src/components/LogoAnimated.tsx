"use client";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export function LogoAnimated() {
  return (
    <motion.div
      className="flex justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: [1, 1.05, 1] }}
      transition={{
        opacity: { duration: 1.1, ease: "easeOut" },
        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <div className="relative w-full max-w-[420px] mx-auto flex justify-center pointer-events-none logo-animated">
        {/* Halo animado detrás */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[min(60vw,20rem)] rounded-full bg-[radial-gradient(circle,var(--brand-primary)_0%,transparent_70%)] opacity-25 animate-background-pulse pointer-events-none" />

        {/* Logo */}
        <div className="relative mx-auto w-[min(80vw,420px)] h-auto text-[--fg-light] dark:text-[--fg-dark] pointer-events-none">
          <Logo className="w-full h-auto" />
        </div>

        {/* Estilos para las animaciones sincronizadas */}
        <style jsx global>{`
          .logo-animated .wave1,
          .logo-animated .wave2 {
            transform-box: fill-box;
            transform-origin: center;
            will-change: opacity, transform, stroke-width;
          }

          /* Animación del pulso de fondo, sincronizada con las ondas */
          .animate-background-pulse {
            animation: backgroundPulse 2.5s ease-in-out infinite;
          }

          @keyframes backgroundPulse {
            0%,
            100% {
              opacity: 0.25;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.05);
            }
          }

          /* Animación de PROPAGACIÓN para las ondas */
          .logo-animated .wave1 {
            animation: wavePropagate 2.5s ease-out infinite; /* Usamos ease-out para que el inicio sea rápido */
          }
          .logo-animated .wave2 {
            animation: wavePropagate 2.5s ease-out 1.25s infinite; /* Desfasada por la mitad del tiempo */
          }

          @keyframes wavePropagate {
            0% {
              opacity: 0;
              transform: translateX(0) scale(0.9);
              stroke-width: 2.5;
            }
            50% {
              opacity: 1;
              stroke-width: 3.2;
            }
            100% {
              opacity: 0;
              /* La onda se ha movido 12px a la derecha y es un 15% más grande */
              transform: translateX(12px) scale(1.15);
              stroke-width: 2;
            }
          }

          /* Respeta usuarios con reduced-motion */
          @media (prefers-reduced-motion: reduce) {
            .logo-animated .wave1,
            .logo-animated .wave2,
            .animate-background-pulse {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </motion.div>
  );
}
