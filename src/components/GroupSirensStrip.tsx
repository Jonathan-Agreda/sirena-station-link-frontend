"use client";

import { useEffect, useState } from "react";
import { useGroupSirensSocket } from "@/hook/useGroupSirensSocket";
import { toggleSiren } from "@/services/sirens";
import api from "@/lib/api";

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

export default function GroupSirensStrip() {
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const { sirens } = useGroupSirensSocket(groupId);

  // Cargar grupos disponibles (REST)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/groups");
        setGroups(res.data);
        if (res.data.length > 0 && !groupId) {
          setGroupId(res.data[0].id);
        }
      } catch (err) {
        console.error("❌ Error cargando grupos", err);
      }
    })();
  }, [groupId]);

  async function handleToggle(deviceId: string, current: "ON" | "OFF") {
    const action = current === "ON" ? "OFF" : "ON";
    try {
      await toggleSiren(deviceId, action);
    } catch (err) {
      console.error(`Error enviando comando a ${deviceId}`, err);
    }
  }

  // 🔹 Activar/desactivar todas las sirenas online del grupo
  async function handleGroupToggle(action: "ON" | "OFF") {
    for (const s of sirens) {
      if (s.online) {
        try {
          await toggleSiren(s.deviceId, action);
        } catch (err) {
          console.error(`Error grupo → ${s.deviceId}`, err);
        }
      }
    }
  }

  // 🔹 Ordenar sirenas por deviceId
  const sortedSirens = [...sirens].sort((a, b) =>
    a.deviceId.localeCompare(b.deviceId)
  );

  return (
    <div className="w-full">
      {/* Select de grupos */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium">Grupo:</label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Botones grupales */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => handleGroupToggle("ON")}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            Encender todas
          </button>
          <button
            onClick={() => handleGroupToggle("OFF")}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Apagar todas
          </button>
        </div>
      </div>

      {/* Sirenas */}
      <div className="w-full overflow-x-auto flex gap-4 pb-2">
        {sortedSirens.map((s) => (
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
                <span className="absolute bottom-2 text-xs">
                  {formatTime(s.countdown)}
                </span>
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
    </div>
  );
}
