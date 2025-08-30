"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, ResidentMeResponse } from "@/services/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import { motion } from "framer-motion";
import { LogoAnimated } from "@/components/LogoAnimated";

export default function ResidentPage() {
  // ✅ obtener perfil desde el backend
  const { data: user, isLoading } = useQuery<ResidentMeResponse>({
    queryKey: ["me"],
    queryFn: fetchMe as () => Promise<ResidentMeResponse>,
  });

  return (
    <RoleGate allowed={["RESIDENTE"]}>
      <section className="container-max page grid gap-8">
        {/* HERO con LogoAnimated */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: [1, 1.06, 1] }}
          transition={{
            opacity: { duration: 1, ease: "easeOut" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <LogoAnimated />
        </motion.div>

        {/* Banner urbanización + estado de alícuota */}
        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : user ? (
          <>
            <div className="rounded-xl border p-4 flex items-center justify-between bg-[color-mix(in_oklab,transparent,var(--brand-primary)_6%)] dark:bg-[color-mix(in_oklab,transparent,var(--brand-primary)_10%)]">
              <p className="text-sm sm:text-base">
                Urbanización:{" "}
                <strong>{user.urbanizacion?.name || "Sin asignar"}</strong>
              </p>

              {/* Badge Alicuota */}
              <span
                className={[
                  "px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border",
                  user.alicuota === false
                    ? "bg-[--danger]/10 text-[--danger] border-[--danger]"
                    : "bg-[--success]/10 text-[--success] border-[--success]",
                ].join(" ")}
              >
                {user.alicuota === false
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
                  alt={`Foto de ${user.urbanizacion?.name || "urbanización"}`}
                  width={1600}
                  height={900}
                  className="h-64 md:h-full w-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 text-white drop-shadow">
                  <p className="text-sm opacity-90">Vista de</p>
                  <p className="font-semibold">
                    {user.urbanizacion?.name || "Urbanización"}
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
                      <dd className="font-medium">{user.username || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Email</dt>
                      <dd className="font-medium">{user.email || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Etapa</dt>
                      <dd className="font-medium">{user.etapa || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Manzana</dt>
                      <dd className="font-medium">{user.manzana || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Villa</dt>
                      <dd className="font-medium">{user.villa || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="opacity-60">Rol</dt>
                      <dd className="font-medium">
                        {user.role || "Residente"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Botón ON/OFF */}
                <div
                  className={[
                    "rounded-xl p-6 grid place-items-center text-center border",
                    user.alicuota === false ? "border-[--danger]" : "",
                  ].join(" ")}
                >
                  {user.alicuota === false ? (
                    <p className="text-sm">
                      Tu alícuota está pendiente. La activación de la sirena
                      está <strong>bloqueada temporalmente</strong>.
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
