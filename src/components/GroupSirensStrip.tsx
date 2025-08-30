"use client";

import { useState } from "react";
import { useGroupSirensSocket } from "@/hook/useGroupSirensSocket";
import { toggleSiren } from "@/services/sirens";

export default function GroupSirensStrip() {
  const [groupId] = useState<string>("00780cdc-4d5d-47a0-8e64-2e05de1f3f69"); // 🔹 Ajusta o hazlo dinámico
  const { sirens } = useGroupSirensSocket(groupId);

  async function handleToggle(deviceId: string, current: "ON" | "OFF") {
    const action = current === "ON" ? "OFF" : "ON";
    try {
      await toggleSiren(deviceId, action);
    } catch (err) {
      console.error(`Error enviando comando a ${deviceId}`, err);
    }
  }

  return (
    <div className="w-full overflow-x-auto flex gap-4 pb-2">
      {sirens.map((s) => (
        <div
          key={s.deviceId}
          className="rounded-xl border p-4 min-w-[220px] text-center bg-card shadow-sm"
        >
          <p className="font-bold text-lg">{s.deviceId}</p>
          <p className="text-xs opacity-70">IP: {s.ip || "—"}</p>

          <button
            onClick={() => handleToggle(s.deviceId, s.siren)}
            disabled={!s.online}
            className={`relative mt-3 h-32 w-32 rounded-full grid place-items-center text-white font-bold mx-auto transition ${
              !s.online
                ? "bg-gray-400 cursor-not-allowed"
                : s.siren === "ON"
                ? "bg-red-gradient animate-pulse cursor-pointer"
                : "bg-green-gradient hover:brightness-110 cursor-pointer"
            }`}
          >
            <span className="text-lg">
              {!s.online
                ? "Sin conexión"
                : s.siren === "ON"
                ? "Apagar"
                : "Encender"}
            </span>
            {s.countdown && s.countdown > 0 && (
              <span className="absolute bottom-2 text-xs">{s.countdown}s</span>
            )}
          </button>

          <p className="mt-2 text-sm">
            Estado:{" "}
            <strong className={s.online ? "text-green-600" : "text-red-600"}>
              {s.online ? "Online" : "Offline"}
            </strong>
          </p>
          <p className="text-xs">
            Sirena: {s.siren === "ON" ? "Activada" : "Desactivada"}
          </p>
        </div>
      ))}
    </div>
  );
}
