"use client";

import { useDashboardSirens } from "@/hook/useDashboardSirens";

function formatTime(sec?: number) {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function DashboardSirens() {
  const { sirens, sendCommand } = useDashboardSirens();

  // 🔹 Ordenar por deviceId (alfanumérico)
  const sortedSirens = [...sirens].sort((a, b) =>
    a.deviceId.localeCompare(b.deviceId, "en", { numeric: true })
  );

  // 🔹 Métricas para el botón global
  const total = sortedSirens.length;
  const online = sortedSirens.filter((s) => s.online);
  const onCount = sortedSirens.filter((s) => s.siren === "ON").length;
  const anyPending = sortedSirens.some((s) => s.pending);

  // “¿Todas ON?” (solo consideramos las que están online)
  const allOnlineOn =
    online.length > 0 && online.every((s) => s.siren === "ON");
  const bulkTarget: "ON" | "OFF" = allOnlineOn ? "OFF" : "ON";
  const canBulk = online.length > 0 && !anyPending;

  const handleBulkToggle = () => {
    if (!canBulk) return;
    // Enviamos a TODAS las online (si alguna está pending la saltamos)
    for (const s of online) {
      if (s.pending) continue;
      sendCommand(s.deviceId, bulkTarget);
    }
  };

  return (
    <div className="space-y-3">
      {/* Barra superior: estado + botón global */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-neutral-500">
          <span className="font-medium">{online.length}</span> / {total} online
          · <span className="font-medium">{onCount}</span> activas
          {anyPending && (
            <span className="ml-2 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-600">
              ejecutando…
            </span>
          )}
        </div>

        <button
          onClick={handleBulkToggle}
          disabled={!canBulk}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition
            ${
              allOnlineOn
                ? "bg-red-gradient hover:brightness-110"
                : "bg-green-gradient hover:brightness-110"
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={allOnlineOn ? "Apagar todas" : "Encender todas"}
          title={allOnlineOn ? "Apagar todas" : "Encender todas"}
        >
          {allOnlineOn ? "Apagar todas" : "Encender todas"}
        </button>
      </div>

      {/* Grid de sirenas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedSirens.map((s) => {
          const isOn = s.siren === "ON";
          const disabled = !s.online || s.pending;

          return (
            <div
              key={s.deviceId}
              className={`group rounded-2xl border p-4 shadow-sm bg-card transition
                hover:shadow-md hover:-translate-y-[2px]
                ${isOn ? "ring-1 ring-green-600/20" : "ring-1 ring-white/5"}`}
            >
              {/* Header */}
              <div className="mb-2 text-center">
                <p className="font-semibold tracking-wide">{s.deviceId}</p>
                <p className="text-xs opacity-70">IP: {s.ip || "—"}</p>
              </div>

              {/* Botón principal */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => sendCommand(s.deviceId, isOn ? "OFF" : "ON")}
                  disabled={disabled}
                  className={`relative mt-2 h-28 w-28 rounded-full grid place-items-center text-white font-bold transition
                    ${
                      !s.online
                        ? "bg-gray-400 cursor-not-allowed"
                        : s.pending
                        ? "bg-gray-500 cursor-wait"
                        : isOn
                        ? "bg-red-gradient animate-pulse cursor-pointer"
                        : "bg-green-gradient hover:brightness-110 cursor-pointer"
                    }`}
                >
                  <span className="text-base">
                    {!s.online
                      ? "Offline"
                      : s.pending
                      ? "Enviando…"
                      : isOn
                      ? "Apagar"
                      : "Encender"}
                  </span>
                  {s.countdown && s.countdown > 0 && !s.pending && (
                    <span className="absolute bottom-2 text-xs">
                      {formatTime(s.countdown)}
                    </span>
                  )}
                </button>
              </div>

              {/* Footer / estado */}
              <div className="mt-3 text-center text-sm">
                <span
                  className={`mr-1 rounded-full px-2 py-0.5 text-xs font-medium
                    ${
                      s.online
                        ? "bg-green-500/15 text-green-600"
                        : "bg-red-500/15 text-red-600"
                    }`}
                >
                  {s.online ? "Online" : "Offline"}
                </span>
                <span className="opacity-70">·</span>
                <span className="ml-1">
                  Sirena:{" "}
                  <strong className={isOn ? "text-green-600" : "text-red-600"}>
                    {s.siren}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
