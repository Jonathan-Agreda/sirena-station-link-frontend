"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchActivationLogs,
  LogsFilters,
  ActivationLogsResponse,
} from "@/services/activationLogs";
import { Skeleton } from "@/components/ui/Skeleton";

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function ActivationLogsTable() {
  const [filters, setFilters] = useState<LogsFilters>({
    q: "",
    action: "",
    page: 1,
    perPage: 25,
    includeRejected: false, // por defecto solo ACCEPTED
  });

  const { data, isLoading, isFetching } = useQuery<ActivationLogsResponse>({
    queryKey: ["activationLogs", filters],
    queryFn: () => fetchActivationLogs(filters),
    keepPreviousData: true,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? filters.page!;
  const perPage = data?.perPage ?? filters.perPage!;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const disablePrev = page <= 1 || isFetching;
  const disableNext = page >= totalPages || isFetching;

  const patch = (p: Partial<LogsFilters>) =>
    setFilters((f) => {
      const merged = { ...f, ...p };
      if (
        "q" in p ||
        "from" in p ||
        "to" in p ||
        "action" in p ||
        "includeRejected" in p
      ) {
        merged.page = 1;
      }
      return merged;
    });

  return (
    <div className="w-full space-y-4">
      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-6">
        <input
          className="rounded-xl border px-3 py-2 outline-none focus:ring sm:col-span-2"
          placeholder="Buscar (deviceId, usuario, nombre)"
          value={filters.q}
          onChange={(e) => patch({ q: e.target.value })}
        />
        <select
          className="rounded-xl border px-3 py-2 outline-none focus:ring"
          value={filters.action}
          onChange={(e) =>
            patch({ action: (e.target.value as LogsFilters["action"]) || "" })
          }
        >
          <option value="">Acción (todas)</option>
          <option value="ON">ON</option>
          <option value="OFF">OFF</option>
          <option value="AUTO_OFF">AUTO_OFF</option>
        </select>
        <input
          type="datetime-local"
          className="rounded-xl border px-3 py-2 outline-none focus:ring"
          value={filters.from ?? ""}
          onChange={(e) => patch({ from: e.target.value })}
        />
        <input
          type="datetime-local"
          className="rounded-xl border px-3 py-2 outline-none focus:ring"
          value={filters.to ?? ""}
          onChange={(e) => patch({ to: e.target.value })}
        />
        <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
          <input
            type="checkbox"
            checked={!!filters.includeRejected}
            onChange={(e) => patch({ includeRejected: e.target.checked })}
          />
          <span className="text-sm">Incluir rechazados</span>
        </label>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-950/5 dark:bg-neutral-50/5">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">DeviceID</th>
              <th className="px-3 py-2 text-left">Usuario</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Dirección</th>
              <th className="px-3 py-2 text-left">Acción</th>
              <th className="px-3 py-2 text-left">Resultado</th>
              <th className="px-3 py-2 text-left">Razón</th>
              <th className="px-3 py-2 text-left">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  <td className="px-3 py-2" colSpan={9}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-neutral-500"
                >
                  Sin resultados
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="odd:bg-neutral-950/2.5 dark:odd:bg-neutral-50/2.5"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmt(r.createdAt)}
                  </td>
                  <td className="px-3 py-2 font-medium">{r.deviceId}</td>
                  <td className="px-3 py-2">{r.user.username}</td>
                  <td className="px-3 py-2">{r.user.fullName}</td>
                  <td className="px-3 py-2">
                    {r.user.etapa ?? "-"} / {r.user.manzana ?? "-"} /{" "}
                    {r.user.villa ?? "-"}
                  </td>
                  <td className="px-3 py-2">{r.action}</td>
                  <td className="px-3 py-2">{r.result}</td>
                  <td className="px-3 py-2">{r.reason ?? "-"}</td>
                  <td className="px-3 py-2">{r.ip ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-neutral-500">
          Página {page} de {totalPages} • {total} registros
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={disablePrev}
            onClick={() => patch({ page: Math.max(1, page - 1) })}
            className="rounded-lg border px-3 py-1 disabled:opacity-50"
            aria-label="Anterior"
          >
            ← Anterior
          </button>
          <button
            disabled={disableNext}
            onClick={() => patch({ page: Math.min(totalPages, page + 1) })}
            className="rounded-lg border px-3 py-1 disabled:opacity-50"
            aria-label="Siguiente"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
