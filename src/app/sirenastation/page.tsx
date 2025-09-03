"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, MeResponse } from "@/services/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import { motion } from "framer-motion";
import { LogoAnimated } from "@/components/LogoAnimated";
import { useSirenSocket } from "@/hook/useSirenSocket";
import { toggleSiren } from "@/services/sirens";
import { useState, useEffect } from "react";
import type { Role } from "@/services/auth";

export default function SirenaStationPage() {
  const { data: user, isLoading } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const [selectedSirenId, setSelectedSirenId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.sirens?.length) {
      setSelectedSirenId(user.sirens[0].deviceId);
    }
  }, [user]);

  const { state, countdown } = useSirenSocket(selectedSirenId || "");

  async function handleToggle() {
    if (!state || !state.online) return;
    const action = state.siren === "ON" ? "OFF" : "ON";
    try {
      await toggleSiren(state.deviceId, action);
    } catch (err) {
      console.error("Error enviando comando:", err);
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  // Imagen de urbanización (fallback seguro)
  let imageUrba = "/urbanitation/savali.jpeg";
  if (user?.urbanizacion?.name) {
    const transformedName = user.urbanizacion.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    imageUrba = `/urbanitation/${transformedName}.jpeg`;
  }

  return (
    <RoleGate
      allowed={["SUPERADMIN", "ADMIN", "GUARDIA", "RESIDENTE"] as Role[]}
    >
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
            {/* Urbanización */}
            <div className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[color-mix(in_oklab,transparent,var(--brand-primary)_6%)] dark:bg-[color-mix(in_oklab,transparent,var(--brand-primary)_10%)]">
              <p className="text-sm sm:text-base">
                Urbanización:{" "}
                <strong>{user.urbanizacion?.name || "Sin asignar"}</strong>
              </p>
            </div>

            {/* Main grid */}
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              {/* Columna izquierda (Perfil + Sirena) */}
              <div className="grid gap-6">
                {/* ─── Control Sirena: PRIMERO EN MÓVIL ───────────────────── */}
                <div
                  className={[
                    "order-1 md:order-2", // ⬅️ móvil primero, desktop segundo
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
                      <p className="text-lg font-bold">
                        {state?.deviceId ||
                          selectedSirenId ||
                          user.sirens?.[0]?.deviceId ||
                          "—"}
                      </p>

                      {/* Selector de sirena: DEBAJO DEL BOTÓN EN MÓVIL, ARRIBA EN DESKTOP */}
                      {user.sirens && user.sirens.length > 1 && (
                        <select
                          value={selectedSirenId || ""}
                          onChange={(e) => setSelectedSirenId(e.target.value)}
                          className="order-2 md:order-1 mb-0 md:mb-3 rounded-lg border px-3 py-2 text-sm bg-background w-full sm:w-auto"
                        >
                          {user.sirens.map((s) => (
                            <option key={s.deviceId} value={s.deviceId}>
                              {s.deviceId}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={handleToggle}
                        disabled={!state || !state.online}
                        className={`order-1 md:order-2 relative h-48 w-48 sm:h-64 sm:w-64 rounded-full grid place-items-center text-white font-bold transition ${
                          !state
                            ? "bg-gray-gradient cursor-not-allowed"
                            : !state.online
                            ? "bg-gray-gradient cursor-not-allowed"
                            : state.siren === "ON"
                            ? "bg-red-gradient animate-pulse cursor-pointer"
                            : "bg-green-gradient hover:brightness-110 cursor-pointer"
                        }`}
                        aria-live="polite"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xl sm:text-2xl font-bold">
                            {!state
                              ? "Sin datos"
                              : state.siren === "ON"
                              ? "Apagar"
                              : "Encender"}
                          </span>
                          {countdown > 0 && state?.online && (
                            <span className="text-base sm:text-lg opacity-80 mt-1">
                              {formatTime(countdown)}
                            </span>
                          )}
                        </div>
                      </button>

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

                {/* ─── Perfil: SEGUNDO EN MÓVIL, PRIMERO EN DESKTOP ───────── */}
                <div className="order-2 md:order-1 rounded-xl border p-4 grid gap-2">
                  <p className="text-sm opacity-70">Tu perfil</p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Usuario</dt>
                      <dd className="font-medium break-words">
                        {user.firstName + " " + user.lastName || "—"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Email</dt>
                      <dd
                        className="font-medium truncate"
                        title={user.email || "—"}
                      >
                        {user.email || "—"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Etapa</dt>
                      <dd className="font-medium">{user.etapa || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Manzana</dt>
                      <dd className="font-medium">{user.manzana || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Villa</dt>
                      <dd className="font-medium">{user.villa || "—"}</dd>
                    </div>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Rol</dt>
                      <dd className="font-medium">{user.role}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Imagen (se mantiene igual y queda tercera en móvil) */}
              <div className="rounded-xl border overflow-hidden relative">
                <Image
                  src={imageUrba}
                  alt={`Foto de ${user.urbanizacion?.name || "urbanización"}`}
                  width={1600}
                  height={900}
                  className="h-56 sm:h-64 md:h-full w-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 text-white drop-shadow">
                  <p className="text-xs sm:text-sm opacity-90">Vista de</p>
                  <p className="font-semibold">
                    {user.urbanizacion?.name || "Urbanización"}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </RoleGate>
  );
}
