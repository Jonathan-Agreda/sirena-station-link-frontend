"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, ResidentMeResponse } from "@/services/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import { motion } from "framer-motion";
import { LogoAnimated } from "@/components/LogoAnimated";
import { useSirenSocket } from "@/hook/useSirenSocket";
import { toggleSiren } from "@/services/sirens";

export default function ResidentPage() {
  const { data: user, isLoading } = useQuery<ResidentMeResponse>({
    queryKey: ["me"],
    queryFn: fetchMe as () => Promise<ResidentMeResponse>,
  });

  const { state, countdown } = useSirenSocket(user?.siren?.deviceId || "");

  async function handleToggle() {
    if (!state || !state.online) return; // 🔹 si está sin datos u offline → no hace nada
    const action = state.siren === "ON" ? "OFF" : "ON";
    try {
      await toggleSiren(state.deviceId, action);
    } catch (err) {
      console.error("Error enviando comando:", err);
    }
  }

  // 🔢 Formatear countdown a mm:ss
  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <RoleGate allowed={["RESIDENTE"]}>
      <section className="container-max page grid gap-8">
        {/* HERO */}
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

        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : user ? (
          <>
            {/* Urbanización + alícuota */}
            <div className="rounded-xl border p-4 flex items-center justify-between bg-[color-mix(in_oklab,transparent,var(--brand-primary)_6%)] dark:bg-[color-mix(in_oklab,transparent,var(--brand-primary)_10%)]">
              <p className="text-sm sm:text-base">
                Urbanización:{" "}
                <strong>{user.urbanizacion?.name || "Sin asignar"}</strong>
              </p>
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

            {/* Main grid */}
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              {/* Imagen */}
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

              {/* Perfil + Sirena */}
              <div className="grid gap-6">
                {/* Perfil */}
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

                {/* Control Sirena */}
                <div
                  className={[
                    "rounded-xl p-6 grid place-items-center text-center border gap-3",
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
                      {/* Nombre arriba */}
                      <p className="text-lg font-bold">
                        {state?.deviceId || user.siren?.deviceId || "—"}
                      </p>

                      {/* Botón enorme con gradientes */}
                      <button
                        onClick={handleToggle}
                        disabled={!state || !state.online}
                        className={`relative h-64 w-64 rounded-full grid place-items-center text-white font-bold transition ${
                          !state
                            ? "bg-gray-gradient cursor-not-allowed"
                            : !state.online
                            ? "bg-gray-gradient cursor-not-allowed"
                            : state.siren === "ON"
                            ? "bg-red-gradient animate-pulse cursor-pointer"
                            : "bg-green-gradient hover:brightness-110 cursor-pointer"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold">
                            {!state
                              ? "Sin datos"
                              : state.siren === "ON"
                              ? "Apagar"
                              : "Encender"}
                          </span>
                          {countdown > 0 && state.online && (
                            <span className="text-lg opacity-80 mt-1">
                              {formatTime(countdown)}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Estado debajo */}
                      <p className="text-sm opacity-80 mt-3">
                        Estado:{" "}
                        <strong>
                          {!state
                            ? "Sin datos"
                            : state.online
                            ? "Online"
                            : "Offline"}
                        </strong>{" "}
                        · Sirena:{" "}
                        <strong>
                          {state?.siren === "ON" ? "Activada" : "Desactivada"}
                        </strong>
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
