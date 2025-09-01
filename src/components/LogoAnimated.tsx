"use client";
import { motion } from "framer-motion";
import { env } from "@/env";

export function LogoAnimated() {
  return (
    <motion.div
      className="flex justify-center"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: [1, 1.06, 1] }}
      transition={{
        opacity: { duration: 1.1, ease: "easeOut" },
        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <div className="relative w-full max-w-[560px] mx-auto flex justify-center pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[min(70vw,28rem)] rounded-full bg-[radial-gradient(circle,var(--brand-primary)_0%,transparent_70%)] opacity-30 animate-pulse pointer-events-none" />

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 500 120"
          className="relative mx-auto w-[min(92vw,520px)] h-auto text-[--fg-light] dark:text-[--fg-dark] pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--brand-primary)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
            <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="shine-mask">
              <rect width="100%" height="100%" fill="url(#shine)">
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="-500 0"
                  to="500 0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </rect>
            </mask>
          </defs>

          {/* Ícono (altavoz 📢) */}
          <g transform="translate(20,28)">
            {/* Caja del altavoz */}
            <rect
              x="0"
              y="32"
              width="14"
              height="20"
              rx="3"
              fill="var(--brand-primary)"
            />
            {/* Trompeta */}
            <polygon
              points="14,32 36,20 36,64 14,52"
              fill="var(--brand-primary)"
            />

            {/* Ondas sonoras */}
            <path
              d="M44,28 C58,34 58,50 44,56"
              fill="none"
              stroke="url(#g)"
              strokeWidth="4"
              strokeLinecap="round"
              mask="url(#shine-mask)"
            />
            <path
              d="M52,22 C72,34 72,50 52,62"
              fill="none"
              stroke="url(#g)"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.7"
              mask="url(#shine-mask)"
            />
          </g>

          {/* Marca */}
          <g transform="translate(90,55)">
            <text
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="38"
              fontWeight="700"
              fill="currentColor"
            >
              {env.APP_NAME}
            </text>
            <text
              y="32"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="18"
              fill="currentColor"
              opacity="0.7"
            >
              {env.SLOGAN}
            </text>
          </g>
        </svg>
      </div>
    </motion.div>
  );
}
