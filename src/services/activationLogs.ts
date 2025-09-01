import api from "@/lib/api";

export type EnrichedLogUser = {
  id: string | null;
  username: string;
  fullName: string;
  etapa: string | null;
  manzana: string | null;
  villa: string | null;
};

export type EnrichedActivationLog = {
  id: string;
  deviceId: string;
  user: EnrichedLogUser;
  action: "ON" | "OFF" | "AUTO_OFF";
  result: "ACCEPTED" | "REJECTED" | "FAILED" | "EXECUTED";
  reason: string | null;
  ip: string | null;
  createdAt: string;
};

export type ActivationLogsResponse = {
  page: number;
  perPage: number;
  total: number;
  hasNext: boolean;
  data: EnrichedActivationLog[];
};

export type LogsFilters = {
  q?: string;
  from?: string;
  to?: string;
  action?: "ON" | "OFF" | "AUTO_OFF" | "";
  includeRejected?: boolean;
  page?: number;
  perPage?: number;
};

export async function fetchActivationLogs(filters: LogsFilters) {
  // CAMBIO: Se reemplaza `any` por un tipo más específico (`string | number`).
  const params: Record<string, string | number> = {
    page: filters.page ?? 1,
    perPage: filters.perPage ?? 25,
  };
  if (filters.q) params.q = filters.q;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.action) params.action = filters.action;
  if (filters.includeRejected) params.includeRejected = "true";

  const { data } = await api.get<ActivationLogsResponse>(
    "/activation-logs/enriched",
    { params }
  );
  // Asegurar string en createdAt
  data.data = data.data.map((d) => ({ ...d, createdAt: String(d.createdAt) }));
  return data;
}
