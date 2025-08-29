"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/services/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

export default function ResidentPage() {
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  return (
    <RoleGate allowed={["RESIDENTE"]}>
      <section className="container-max page grid gap-8">
        {/* HERO con el mismo logo animado del login */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: [1, 1.06, 1] }}
          transition={{
            opacity: { duration: 1, ease: "easeOut" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 blur-3xl opacity-25 bg-[var(--brand-primary)] rounded-full scale-125" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="380"
              height="120"
              viewBox="0 0 500 120"
              className="relative text-[--fg-light] dark:text-[--fg-dark]"
              aria-label="SirenaStationLink"
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

              {/* Ícono */}
              <g transform="translate(20,28)">
                <rect
                  x="0"
                  y="20"
                  width="40"
                  height="32"
                  rx="6"
                  fill="var(--brand-primary)"
                />
                <rect
                  x="8"
                  y="12"
                  width="20"
                  height="12"
                  rx="3"
                  fill="var(--brand-primary)"
                />
                <circle cx="20" cy="36" r="5" fill="var(--brand-primary-fg)" />
                <path
                  d="M46,28 C60,20 60,60 46,52"
                  fill="none"
                  stroke="url(#g)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  mask="url(#shine-mask)"
                />
                <path
                  d="M52,24 C72,16 72,64 52,56"
                  fill="none"
                  stroke="url(#g)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.7"
                  mask="url(#shine-mask)"
                />
              </g>

              {/* Marca */}
              <g transform="translate(100,55)">
                <text
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="40"
                  fontWeight="700"
                  fill="currentColor"
                >
                  SirenaStationLink
                </text>
                <text
                  y="32"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="20"
                  fill="currentColor"
                  opacity="0.7"
                >
                  Alerta comunitaria al instante
                </text>
              </g>
            </svg>
          </div>
        </motion.div>

        {/* Banner urbanización + estado de alícuota */}
        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : data ? (
          <>
            <div className="rounded-xl border p-4 flex items-center justify-between bg-[color-mix(in_oklab,transparent,var(--brand-primary)_6%)] dark:bg-[color-mix(in_oklab,transparent,var(--brand-primary)_10%)]">
              <p className="text-sm sm:text-base">
                Urbanización:{" "}
                <strong>{data.urbanizacion?.nombre || "Sin asignar"}</strong>
              </p>

              <span
                className={[
                  "px-3 py-1 rounded-full text-xs font-medium",
                  data.alicuota === false
                    ? "bg-[color-mix(in_oklab,white,#d22_10%)] text-[--danger] border border-[--danger]"
                    : "bg-[color-mix(in_oklab,white,#0a4_10%)] text-[--success] border border-[--success]",
                ].join(" ")}
                title="Estado de alícuota"
              >
                {data.alicuota === false
                  ? "Alícuota pendiente"
                  : "Alícuota al día"}
              </span>
            </div>

            {/* Grid principal */}
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              {/* Foto de la urbanización */}
              <div className="rounded-xl border overflow-hidden relative">
                <Image
                  src="/urbanitation/savali.jpeg"
                  alt={`Foto de ${data.urbanizacion?.nombre || "urbanización"}`}
                  width={1600}
                  height={900}
                  className="h-64 md:h-full w-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 text-white drop-shadow">
                  <p className="text-sm opacity-90">Vista de</p>
                  <p className="font-semibold">
                    {data.urbanizacion?.nombre || "Urbanización"}
                  </p>
                </div>
              </div>

              {/* Ficha de usuario + ON/OFF */}
              <div className="grid gap-6">
                <div className="rounded-xl border p-4 grid gap-2">
                  <p className="text-sm opacity-70">Tu perfil</p>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Usuario</dt>
                      <dd className="font-medium">{data.username || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Email</dt>
                      <dd className="font-medium">{data.email || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Dirección</dt>
                      <dd className="font-medium">
                        {[data.etapa, data.manzana, data.villa]
                          .filter(Boolean)
                          .join(" • ") || "—"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Rol</dt>
                      <dd className="font-medium">
                        {(data.roles && data.roles[0]) || "RESIDENTE"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Botón ON/OFF destacado */}
                <div
                  className={[
                    "rounded-xl p-6 grid place-items-center text-center border",
                    data.alicuota === false ? "border-[--danger]" : "",
                  ].join(" ")}
                >
                  {data.alicuota === false ? (
                    <p className="text-sm">
                      Tu alícuota está pendiente. La activación de la sirena
                      está
                      <strong> bloqueada temporalmente</strong>.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm opacity-80 mb-3">
                        Control ON/OFF (auto-off 5 minutos) — próximamente
                      </p>
                      <button
                        className="relative mx-auto h-28 w-28 rounded-full border-2 border-[--brand-primary] text-[--brand-primary] grid place-items-center disabled:opacity-60"
                        disabled
                        aria-disabled
                        aria-label="Activar / Desactivar sirena"
                      >
                        {/* anillo pulso */}
                        <span className="absolute inset-0 rounded-full ring-2 ring-[--brand-primary] animate-ping" />
                        <span className="absolute inset-0 rounded-full ring-2 ring-[--brand-primary] opacity-40" />
                        <span className="relative font-semibold">ON/OFF</span>
                      </button>
                      <p className="mt-3 text-xs opacity-70">
                        Estado: <strong>Desconocido</strong>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </RoleGate>
  );
}
