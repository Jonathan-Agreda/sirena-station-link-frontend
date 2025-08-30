"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchActivationLogs,
  LogsFilters,
  ActivationLogsResponse,
} from "@/services/activationLogs";
import { Skeleton } from "@/components/ui/Skeleton";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${color}`}
    >
      {text}
    </span>
  );
}

export default function ActivationLogsTable() {
  const [filters, setFilters] = useState<LogsFilters>({
    q: "",
    action: "",
    page: 1,
    perPage: 25,
    includeRejected: false,
  });
  const [showFilters, setShowFilters] = useState(false); // 👈 para acordeón en móvil

  const { data, isLoading, isFetching } = useQuery<ActivationLogsResponse>({
    queryKey: ["activationLogs", filters],
    queryFn: () => fetchActivationLogs(filters),
    keepPreviousData: true,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
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

  const resetFilters = () =>
    setFilters({
      q: "",
      action: "",
      page: 1,
      perPage: 25,
      includeRejected: false,
    });

  // 🔹 Exportar Excel (simplificado)
  const exportExcel = async () => {
    try {
      const allData = await fetchActivationLogs({
        ...filters,
        page: 1,
        perPage: 100000,
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Logs");

      const header = [
        "Fecha",
        "Sirena",
        "Usuario",
        "Nombre",
        "E/M/V",
        "Acción",
        "Resultado",
        "Razón",
        "IP",
      ];
      worksheet.addRow(header);

      allData.data.forEach((r) => {
        worksheet.addRow([
          fmt(r.createdAt),
          r.deviceId,
          r.user.username,
          r.user.fullName,
          `${r.user.etapa ?? "-"} / ${r.user.manzana ?? "-"} / ${
            r.user.villa ?? "-"
          }`,
          r.action,
          r.result,
          r.reason ?? "-",
          r.ip ?? "-",
        ]);
      });

      const buf = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buf], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `activation_logs_${Date.now()}.xlsx`
      );
    } catch (err) {
      console.error("❌ Error exportando Excel", err);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Toggle en móvil */}
      <div className="sm:hidden">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="w-full rounded-xl border px-3 py-2 text-sm font-medium 
               bg-neutral-100 text-neutral-900 hover:bg-neutral-200
               dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800
               transition cursor-pointer"
        >
          {showFilters ? "Ocultar filtros ▲" : "Mostrar filtros ▼"}
        </button>
      </div>

      {/* Filtros */}
      <div
        className={`grid gap-3 sm:grid-cols-8 items-center transition-all ${
          showFilters ? "grid" : "hidden sm:grid"
        }`}
      >
        <input
          className="rounded-xl border px-3 py-2 outline-none focus:ring sm:col-span-2 cursor-pointer w-full"
          placeholder="Buscar (sirena, usuario, nombre)"
          value={filters.q}
          onChange={(e) => patch({ q: e.target.value })}
        />
        <select
          className="rounded-xl border px-3 py-2 outline-none focus:ring cursor-pointer w-full"
          value={filters.action}
          onChange={(e) =>
            patch({ action: (e.target.value as LogsFilters["action"]) || "" })
          }
        >
          <option value="">Acción (todas)</option>
          <option value="ON">ON</option>
          <option value="OFF">OFF</option>
        </select>
        <input
          type="datetime-local"
          className="rounded-xl border px-3 py-2 outline-none focus:ring cursor-pointer w-full"
          value={filters.from ?? ""}
          onChange={(e) => patch({ from: e.target.value })}
        />
        <input
          type="datetime-local"
          className="rounded-xl border px-3 py-2 outline-none focus:ring cursor-pointer w-full"
          value={filters.to ?? ""}
          onChange={(e) => patch({ to: e.target.value })}
        />
        <label className="flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer w-full sm:w-auto">
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={!!filters.includeRejected}
            onChange={(e) => patch({ includeRejected: e.target.checked })}
          />
          <span className="text-sm">Incluir rechazados</span>
        </label>
        <button
          onClick={resetFilters}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer w-full sm:w-auto"
        >
          Limpiar filtros
        </button>
        <button
          onClick={exportExcel}
          className="rounded-xl border px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 cursor-pointer w-full sm:w-auto"
        >
          Exportar Excel
        </button>
      </div>

      {/* Tabla responsive */}
      <div className="overflow-x-auto rounded-2xl border shadow-sm">
        <table className="min-w-max w-full text-sm">
          <thead className="bg-neutral-950/5 dark:bg-neutral-50/5">
            <tr>
              <th className="px-3 py-2 text-left">Fecha y Hora</th>
              <th className="px-3 py-2 text-left">Sirena</th>
              <th className="px-3 py-2 text-left">Usuario</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">E/M/V</th>
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
                  <td className="px-3 py-2">
                    {r.action === "ON" && (
                      <Badge text="ON" color="bg-green-600" />
                    )}
                    {r.action === "OFF" && (
                      <Badge text="OFF" color="bg-red-600" />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.result === "ACCEPTED" && (
                      <Badge text="ACCEPTED" color="bg-green-600" />
                    )}
                    {r.result === "REJECTED" && (
                      <Badge text="REJECTED" color="bg-red-600" />
                    )}
                    {r.result === "FAILED" && (
                      <Badge text="FAILED" color="bg-yellow-600" />
                    )}
                    {r.result === "EXECUTED" && (
                      <Badge text="EXECUTED" color="bg-blue-600" />
                    )}
                  </td>
                  <td className="px-3 py-2">{r.reason ?? "-"}</td>
                  <td className="px-3 py-2">{r.ip ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-neutral-500">
          Página {page} de {totalPages} • {total} registros
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={disablePrev}
            onClick={() => patch({ page: Math.max(1, page - 1) })}
            className={`rounded-lg border px-3 py-1 disabled:opacity-50 ${
              disablePrev ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            aria-label="Anterior"
          >
            ← Anterior
          </button>
          <button
            disabled={disableNext}
            onClick={() => patch({ page: Math.min(totalPages, page + 1) })}
            className={`rounded-lg border px-3 py-1 disabled:opacity-50 ${
              disableNext ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            aria-label="Siguiente"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
