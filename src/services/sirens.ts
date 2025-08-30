import api from "@/lib/api";

export async function toggleSiren(deviceId: string, action: "ON" | "OFF") {
  const res = await api.post(`/devices/${deviceId}/cmd`, {
    action,
    ttlMs: Number(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) || 300000, // 5 minutos por defecto
    cause: "manual",
  });
  return res.data;
}
