"use client";

// Importa useMemo para calcular si hay filtros activos
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchActivationLogs,
  LogsFilters,
  ActivationLogsResponse,
} from "@/services/activationLogs";
import { Skeleton } from "@/components/ui/Skeleton";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ─── Config por .env con fallback ──────────────────────────────────────────────
const toMs = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};
const REFETCH_MS = toMs(process.env.NEXT_PUBLIC_LOGS_REFETCH_MS, 3000);
const HIGHLIGHT_MS = toMs(process.env.NEXT_PUBLIC_LOGS_HIGHLIGHT_MS, 20000);
// ───────────────────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-EC", { timeZone: "America/Guayaquil" });
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
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isFetching } = useQuery<ActivationLogsResponse>({
    queryKey: ["activationLogs", filters],
    queryFn: () => fetchActivationLogs(filters),
    placeholderData: keepPreviousData,
    refetchInterval: REFETCH_MS,
    refetchOnWindowFocus: true,
  });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const page = data?.page ?? filters.page!;
  const perPage = data?.perPage ?? filters.perPage!;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const disablePrev = page <= 1 || isFetching;
  const disableNext = page >= totalPages || isFetching;

  // ✅ Detecta si la vista es “sin filtros”
  const isUnfiltered = useMemo(() => {
    return (
      !filters.q &&
      !filters.action &&
      !filters.from &&
      !filters.to &&
      !filters.includeRejected
    );
  }, [
    filters.q,
    filters.action,
    filters.from,
    filters.to,
    filters.includeRejected,
  ]);

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

  // ========= Resaltar TODOS los registros nuevos (solo sin filtros) =========
  const seenIdsRef = useRef<Set<string>>(new Set()); // IDs ya vistos
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set()); // IDs con highlight
  const initializedRef = useRef(false); // evita highlight en primera carga post-cambio
  const filtersKey = `${filters.q}|${filters.from ?? ""}|${filters.to ?? ""}|${
    filters.action ?? ""
  }|${filters.includeRejected ? 1 : 0}|${filters.perPage}`;
  const lastFiltersKeyRef = useRef<string>(filtersKey);

  // Si cambian filtros (no solo page), reiniciamos detector
  useEffect(() => {
    if (lastFiltersKeyRef.current !== filtersKey) {
      seenIdsRef.current.clear();
      initializedRef.current = false;
      lastFiltersKeyRef.current = filtersKey;
    }
  }, [filtersKey]);

  // 🔒 Si hay filtros activos, desactiva y limpia cualquier highlight
  useEffect(() => {
    if (!isUnfiltered) {
      // limpiamos cualquier highlight activo para que no “parpadee” al filtrar
      if (highlighted.size > 0) setHighlighted(new Set());
      return;
    }
  }, [isUnfiltered, highlighted.size]);

  useEffect(() => {
    // Solo destacamos en vista sin filtros y en la página 1
    if (!isUnfiltered || page !== 1 || rows.length === 0) return;

    // Primera carga con estos filtros: marcar como vistos y no resaltar
    if (!initializedRef.current) {
      seenIdsRef.current = new Set(rows.map((r) => r.id));
      initializedRef.current = true;
      return;
    }

    // Detectar IDs nuevos desde el último render
    const seen = seenIdsRef.current;
    const newIds: string[] = [];
    for (const r of rows) {
      if (!seen.has(r.id)) {
        newIds.push(r.id);
        seen.add(r.id);
      }
    }

    if (newIds.length > 0) {
      setHighlighted((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });

      const timers: number[] = [];
      newIds.forEach((id) => {
        const timer = window.setTimeout(() => {
          setHighlighted((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, HIGHLIGHT_MS);
        timers.push(timer);
      });

      return () => timers.forEach((t) => clearTimeout(t));
    }
  }, [rows, page, isUnfiltered]);
  // ==========================================================================

  // Exportar Excel
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
    <>
      <div
        className="w-full space-y-4"
        style={{ "--highlight-ms": `${HIGHLIGHT_MS}ms` } as React.CSSProperties}
      >
        {/* Toggle móvil */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`w-full rounded-xl border px-3 py-2 text-sm font-medium 
               bg-neutral-100 text-neutral-900 hover:bg-neutral-200
               dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800
               transition cursor-pointer`}
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

        {/* Tabla */}
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
                    className={`odd:bg-neutral-950/2.5 dark:odd:bg-neutral-50/2.5 transition-colors ${
                      highlighted.has(r.id) ? "highlight-new-row" : ""
                    }`}
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

        {/* Paginación */}
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

      {/* Efecto de destaque sincronizado con HIGHLIGHT_MS */}
      <style jsx global>{`
        /* Glow de borde controlado por --highlight-ms */
        @keyframes row-glow {
          0% {
            outline-color: color-mix(
              in oklab,
              var(--brand-primary) 65%,
              transparent
            );
            filter: drop-shadow(
              0 0 18px
                color-mix(in oklab, var(--brand-primary) 55%, transparent)
            );
          }
          60% {
            outline-color: color-mix(
              in oklab,
              var(--brand-primary) 30%,
              transparent
            );
            filter: drop-shadow(
              0 0 10px
                color-mix(in oklab, var(--brand-primary) 30%, transparent)
            );
          }
          100% {
            outline-color: transparent;
            filter: drop-shadow(0 0 0 transparent);
          }
        }

        /* Zoom corto (3 latidos ~1.2s c/u) */
        @keyframes row-zoom {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.035);
          }
          100% {
            transform: scale(1);
          }
        }

        .highlight-new-row {
          outline: 2px solid transparent;
          outline-offset: -2px;
          will-change: transform, filter;
          transform-origin: center;
          animation: row-glow var(--highlight-ms) ease-out forwards,
            row-zoom 1.2s ease-out 0s 3 alternate none;
        }

        /* Fallback para engines donde <tr> no soporta filter/transform bien */
        @supports not (filter: drop-shadow(0 0 1px black)) {
          .highlight-new-row {
            animation: none;
          }
          .highlight-new-row > td {
            position: relative;
            transform-origin: center;
            will-change: transform, box-shadow;
            animation: cell-glow var(--highlight-ms) ease-out forwards,
              cell-zoom 1.2s ease-out 0s 3 alternate none;
          }

          @keyframes cell-glow {
            0% {
              box-shadow: inset 0 0 0 2px
                  color-mix(in oklab, var(--brand-primary) 55%, transparent),
                0 0 16px 2px
                  color-mix(in oklab, var(--brand-primary) 45%, transparent);
            }
            60% {
              box-shadow: inset 0 0 0 2px
                  color-mix(in oklab, var(--brand-primary) 28%, transparent),
                0 0 8px 1px
                  color-mix(in oklab, var(--brand-primary) 25%, transparent);
            }
            100% {
              box-shadow: inset 0 0 0 0 transparent, 0 0 0 0 transparent;
            }
          }

          @keyframes cell-zoom {
            0% {
              transform: scale(1);
            }
            40% {
              transform: scale(1.035);
            }
            100% {
              transform: scale(1);
            }
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .highlight-new-row {
            animation: none;
            filter: none;
          }
          .highlight-new-row > td {
            animation: none;
            box-shadow: none;
            transform: none;
          }
        }
      `}</style>
    </>
  );
}
