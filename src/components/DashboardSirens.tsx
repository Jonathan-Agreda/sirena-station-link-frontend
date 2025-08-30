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

  // 🔹 Ordenar por deviceId (alfabéticamente)
  const sortedSirens = [...sirens].sort((a, b) =>
    a.deviceId.localeCompare(b.deviceId, "en", { numeric: true })
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedSirens.map((s) => {
        const isOn = s.siren === "ON";
        const disabled = !s.online || s.pending;

        return (
          <div
            key={s.deviceId}
            className="rounded-xl border p-4 bg-card shadow-sm flex flex-col items-center"
          >
            <div className="text-center">
              <p className="font-bold text-lg">{s.deviceId}</p>
              <p className="text-xs opacity-70">IP: {s.ip || "—"}</p>
            </div>

            <button
              onClick={() => sendCommand(s.deviceId, isOn ? "OFF" : "ON")}
              disabled={disabled}
              className={`relative mt-3 h-28 w-28 rounded-full grid place-items-center text-white font-bold transition ${
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

            <div className="mt-2 text-sm">
              <span
                className={`font-medium ${
                  s.online ? "text-green-600" : "text-red-600"
                }`}
              >
                {s.online ? "Online" : "Offline"}
              </span>{" "}
              · Sirena: <strong>{s.siren}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
