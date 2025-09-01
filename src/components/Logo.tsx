"use client";
import * as React from "react";

// Se añade la prop opcional `animateWaves`
type LogoProps = React.SVGProps<SVGSVGElement> & {
  className?: string;
  animateWaves?: boolean;
};

export function Logo({
  className,
  animateWaves = false, // Se establece un valor por defecto
  ...props
}: LogoProps) {
  return (
    <>
      {/* Se añade una clase condicional para activar la animación */}
      <svg
        viewBox="0 0 256 64"
        className={`${className} ${animateWaves ? "logo-waves-animated" : ""}`}
        {...props}
      >
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--brand-primary)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <g transform="translate(8,8)">
          {/* Caja del altavoz */}
          <rect
            x="0"
            y="22"
            width="12"
            height="16"
            rx="2"
            fill="var(--brand-primary)"
          />
          {/* Trompeta */}
          <polygon
            points="12,22 26,14 26,46 12,38"
            fill="var(--brand-primary)"
          />
          {/* Ondas de sonido con clases */}
          <path
            className="wave1"
            d="M32,20 C42,26 42,36 32,42"
            fill="none"
            stroke="url(#g)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            className="wave2"
            d="M38,16 C52,26 52,36 38,46"
            fill="none"
            stroke="url(#g)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
        <g transform="translate(64,16)">
          <text
            x="0"
            y="18"
            fontFamily="Inter, system-ui, sans-serif"
            fontSize="20"
            fontWeight="700"
            fill="currentColor"
          >
            SirenaStationLink
          </text>
          <text
            x="0"
            y="40"
            fontFamily="Inter, system-ui, sans-serif"
            fontSize="13"
            fill="currentColor"
            opacity="0.7"
          >
            Alerta comunitaria al instante
          </text>
        </g>
      </svg>

      {/* Estilos JSX que contienen la animación de las ondas */}
      <style jsx>{`
        .logo-waves-animated .wave1,
        .logo-waves-animated .wave2 {
          transform-box: fill-box;
          transform-origin: center;
        }

        .logo-waves-animated .wave1 {
          animation: wavePropagate 2.5s ease-out infinite;
        }

        .logo-waves-animated .wave2 {
          animation: wavePropagate 2.5s ease-out 1.25s infinite;
        }

        @keyframes wavePropagate {
          0% {
            opacity: 0;
            transform: translateX(0) scale(0.9);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(12px) scale(1.15);
          }
        }
      `}</style>
    </>
  );
}
