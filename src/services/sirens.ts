import api from "@/lib/api";

type ToggleCause = "manual" | "group" | "api";

export async function toggleSiren(
  deviceId: string,
  action: "ON" | "OFF",
  opts?: { cause?: ToggleCause; ttlMs?: number }
) {
  const ttlMs =
    opts?.ttlMs ?? (Number(process.env.NEXT_PUBLIC_SIRENA_AUTO_OFF) || 300_000); // 5 min
  const cause: ToggleCause = opts?.cause ?? "manual";

  const { data } = await api.post(`/devices/${deviceId}/cmd`, {
    action,
    ttlMs,
    cause,
  });
  return data;
}
