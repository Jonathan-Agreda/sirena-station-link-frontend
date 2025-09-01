"use client";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

type LogoAnimatedProps = {
  className?: string;
};

export function LogoAnimated({ className }: LogoAnimatedProps) {
  return (
    <motion.div
      className={`flex justify-center items-center ${className ?? ""}`} // Añadimos items-center para centrar verticalmente
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: [1, 1.05, 1] }}
      transition={{
        opacity: { duration: 1.1, ease: "easeOut" },
        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {/* El div principal que antes era "relative w-full max-w-[420px]..." */}
      {/* Le damos un tamaño generoso para que el halo tenga espacio */}
      <div className="relative w-full max-w-[420px] h-[64px] flex justify-center items-center pointer-events-none logo-animated">
        {/* Halo animado detrás */}
        {/* Aquí es donde hacemos el cambio clave para el tamaño del halo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[min(60vw,20rem)] rounded-full bg-[radial-gradient(circle,var(--brand-primary)_0%,transparent_70%)] opacity-25 animate-background-pulse pointer-events-none" />

        {/* Logo (El logo en sí mismo puede tener un tamaño más flexible) */}
        <div className="relative mx-auto w-[min(80vw,420px)] h-auto text-[--fg-light] dark:text-[--fg-dark] pointer-events-none">
          <Logo className="w-full h-auto" />
        </div>

        {/* Estilos para las animaciones sincronizadas (sin cambios) */}
        <style jsx global>{`
          .logo-animated .wave1,
          .logo-animated .wave2 {
            transform-box: fill-box;
            transform-origin: center;
            will-change: opacity, transform, stroke-width;
          }
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
          .logo-animated .wave1 {
            animation: wavePropagate 2.5s ease-out infinite;
          }
          .logo-animated .wave2 {
            animation: wavePropagate 2.5s ease-out 1.25s infinite;
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
              transform: translateX(12px) scale(1.15);
              stroke-width: 2;
            }
          }
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
