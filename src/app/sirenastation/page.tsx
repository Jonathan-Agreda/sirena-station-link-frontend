// src/app/sirenastation/page.tsx
"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, MeResponse, type Role, type Siren } from "@/services/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import { motion } from "framer-motion";
import { LogoAnimated } from "@/components/LogoAnimated";
import { useSirenSocket } from "@/hook/useSirenSocket";
import { toggleSiren } from "@/services/sirens";
import { useState, useEffect, useMemo } from "react";
import { useSirenTimerStore } from "@/store/sirenTimer";
import UpdateContactModal from "@/components/modals/UpdateContactModal";
import { updateUserContact } from "@/services/users";

/* ---------- Tipo extendido para lo que puede traer el socket ---------- */
type SirenState = {
  deviceId: string;
  online: boolean;
  siren: "ON" | "OFF";
  updatedAt?: string; // ISO date
  autoOffAt?: string; // ISO date (opcional)
};

export default function SirenaStationPage() {
  const { data: user, isLoading } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const qc = useQueryClient();

  const [selectedSirenId, setSelectedSirenId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  // Seleccionar por defecto la primera sirena del usuario
  useEffect(() => {
    if (user?.sirens?.length) setSelectedSirenId(user.sirens[0].deviceId);
  }, [user]);

  // Valores iniciales del modal (memoizados para no re-crear objeto en cada render)
  const initialContact = useMemo(
    () => ({
      email: user?.email ?? "",
      cedula: user?.cedula ?? null,
      celular: user?.celular ?? null,
    }),
    [user?.email, user?.cedula, user?.celular]
  );

  // Mutación: actualizar email / cédula / celular
  const contactMutation = useMutation({
    mutationFn: async (payload: {
      email: string;
      cedula: string | null;
      celular: string | null;
    }) => {
      if (!user?.id) throw new Error("No se encontró tu id de usuario.");
      await updateUserContact(user.id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  // Estado en tiempo real de la sirena seleccionada
  const { state, countdown } = useSirenSocket(selectedSirenId || "") as {
    state: SirenState | undefined;
    countdown: number;
  };

  /* =================== Persistencia del contador (auto-off) =================== */
  const AUTO_OFF_MS = Number(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) || 300000; // 5 min

  const timers = useSirenTimerStore((s) => s.timers);
  const setTimer = useSirenTimerStore((s) => s.setTimer);
  const clearTimer = useSirenTimerStore((s) => s.clearTimer);
  const getTimer = useSirenTimerStore((s) => s.getTimer);

  useEffect(() => {
    if (!selectedSirenId || !state) return;

    if (state.siren === "ON") {
      const now = Date.now();
      const existing = getTimer(selectedSirenId);
      if (existing && existing.expiresAt > now) return;

      const autoOffAt = state.autoOffAt
        ? new Date(state.autoOffAt).getTime()
        : undefined;
      const updatedAtMs = state.updatedAt
        ? new Date(state.updatedAt).getTime()
        : undefined;

      const expiresAt =
        autoOffAt ??
        (updatedAtMs ? updatedAtMs + AUTO_OFF_MS : now + AUTO_OFF_MS);

      setTimer(selectedSirenId, expiresAt, Math.floor(AUTO_OFF_MS / 1000));
    } else {
      clearTimer(selectedSirenId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.siren, state?.updatedAt, selectedSirenId]);

  // Tick de 1s para calcular restante persistido
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const persistedRemainingSec =
    selectedSirenId && timers[selectedSirenId]?.expiresAt
      ? Math.max(
          0,
          Math.floor((timers[selectedSirenId].expiresAt - nowTs) / 1000)
        )
      : 0;

  // Mostrar persistido; si no existe, usa el del socket
  const displayCountdown =
    persistedRemainingSec > 0 ? persistedRemainingSec : countdown;

  async function handleToggle() {
    if (!state || !state.online) return;
    const action = state.siren === "ON" ? "OFF" : "ON";
    try {
      await toggleSiren(state.deviceId, action);
      if (action === "OFF" && selectedSirenId) clearTimer(selectedSirenId);
    } catch {
      // noop: error al enviar comando (evita warning por console)
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

  /* ================== Imagen de urbanización ================== */
  const baseUrbanName =
    user?.urbanizacion?.name?.trim().toLowerCase().replace(/\s+/g, "") ||
    "savali";
  const ASSET_VER = process.env.NEXT_PUBLIC_ASSET_VERSION ?? "1";
  const [imgSrc, setImgSrc] = useState<string>(
    `/urbanitation/${baseUrbanName}.jpg?v=${ASSET_VER}`
  );

  useEffect(() => {
    setImgSrc(`/urbanitation/${baseUrbanName}.jpg?v=${ASSET_VER}`);
  }, [baseUrbanName, ASSET_VER]);
  /* ========================================================================== */

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
                {/* ─── Control Sirena ─── */}
                <div
                  className={[
                    "order-1 md:order-2",
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

                      {/* Selector de sirena */}
                      {user.sirens && user.sirens.length > 1 && (
                        <select
                          value={selectedSirenId || ""}
                          onChange={(e) => setSelectedSirenId(e.target.value)}
                          className="order-2 md:order-1 mb-0 md:mb-3 rounded-lg border px-3 py-2 text-sm bg-background w-full sm:w-auto"
                        >
                          {user.sirens.map((s: Siren) => (
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
                          {displayCountdown > 0 && state?.online && (
                            <span className="text-base sm:text-lg opacity-80 mt-1">
                              {formatTime(displayCountdown)}
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

                {/* ─── Perfil ─── */}
                <div className="order-2 md:order-1 rounded-xl border p-4 grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm opacity-70">Tu perfil</p>
                    <button
                      onClick={() => setOpenModal(true)}
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Actualizar email, cédula y celular"
                    >
                      Actualizar datos
                    </button>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Usuario</dt>
                      <dd className="font-medium break-words">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username || "—"}
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

                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Cédula</dt>
                      <dd className="font-medium">{user.cedula || "—"}</dd>
                    </div>

                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="opacity-60">Celular</dt>
                      <dd className="font-medium">{user.celular || "—"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Imagen */}
              <div className="rounded-xl border overflow-hidden relative">
                <Image
                  src={imgSrc}
                  alt={`Foto de ${user.urbanizacion?.name || "urbanización"}`}
                  width={1600}
                  height={900}
                  className="h-56 sm:h-64 md:h-full w-full object-cover"
                  priority
                  onError={() => {
                    if (imgSrc.includes(".jpg")) {
                      setImgSrc(
                        `/urbanitation/${baseUrbanName}.jpeg?v=${ASSET_VER}`
                      );
                    } else if (!imgSrc.includes("/savali.")) {
                      setImgSrc(`/urbanitation/savali.jpg?v=${ASSET_VER}`);
                    }
                  }}
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

            {/* Modal de actualización de contacto */}
            <UpdateContactModal
              open={openModal}
              onClose={() => setOpenModal(false)}
              initial={initialContact}
              onSubmit={(p) => contactMutation.mutateAsync(p)}
            />
          </>
        ) : null}
      </section>
    </RoleGate>
  );
}
