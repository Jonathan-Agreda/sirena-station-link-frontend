"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Download,
  FileUp,
  FileX,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  sa_bulkImportUrbanizaciones,
  sa_bulkDeleteUrbanizaciones,
  sa_downloadUrbanizacionesTemplate,
  sa_bulkImportSirens,
  sa_bulkDeleteSirens,
  sa_downloadSirensTemplate,
} from "@/services/superadmin";
import type {
  UrbanizationBulkImportResult,
  UrbanizationBulkDeleteResult,
  SirenBulkImportResult,
  SirenBulkDeleteResult,
} from "@/types/superadmin";
import CardShell from "../CardShell";
import { errMsg } from "../utils";

type Props = {
  toasts: {
    success: (m: string) => void;
    error: (m: string) => void;
    info: (m: string) => void;
  };
};

export default function BulkTab({ toasts }: Props) {
  // --- Urbanizaciones ---
  const [fileImportUrb, setFileImportUrb] = useState<File | null>(null);
  const [fileDeleteUrb, setFileDeleteUrb] = useState<File | null>(null);
  const [lastImportUrb, setLastImportUrb] =
    useState<UrbanizationBulkImportResult | null>(null);
  const [lastDeleteUrb, setLastDeleteUrb] =
    useState<UrbanizationBulkDeleteResult | null>(null);
  const [dryRunUrb, setDryRunUrb] = useState<boolean>(true);

  // --- Sirenas ---
  const [fileImportSir, setFileImportSir] = useState<File | null>(null);
  const [fileDeleteSir, setFileDeleteSir] = useState<File | null>(null);
  const [lastImportSir, setLastImportSir] =
    useState<SirenBulkImportResult | null>(null);
  const [lastDeleteSir, setLastDeleteSir] =
    useState<SirenBulkDeleteResult | null>(null);
  const [dryRunSir, setDryRunSir] = useState<boolean>(true);

  const queryClient = useQueryClient();

  // --- Mutations Urbanizaciones ---
  const importMutUrb = useMutation({
    mutationFn: (p: { file: File; dry: boolean }) =>
      sa_bulkImportUrbanizaciones(p.file, p.dry),
    onSuccess: (res) => {
      setLastImportUrb(res);
      toasts.success(
        res.dryRun ? "Dry-run completado" : "Importación completada"
      );
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const deleteMutUrb = useMutation({
    mutationFn: (file: File) => sa_bulkDeleteUrbanizaciones(file),
    onSuccess: (res) => {
      setLastDeleteUrb(res);
      toasts.success(`Eliminadas: ${res.removed}/${res.processed}`);
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  // --- Mutations Sirenas ---
  const importMutSir = useMutation({
    mutationFn: (p: { file: File; dry: boolean }) =>
      sa_bulkImportSirens(p.file, p.dry),
    onSuccess: (res) => {
      setLastImportSir(res);
      toasts.success(
        res.dryRun ? "Dry-run completado" : "Importación completada"
      );
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const deleteMutSir = useMutation({
    mutationFn: (file: File) => sa_bulkDeleteSirens(file),
    onSuccess: (res) => {
      setLastDeleteSir(res);
      toasts.success(`Eliminadas: ${res.removed}/${res.processed}`);
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  // --- Plantillas ---
  const onDownloadTemplateUrb = async () => {
    try {
      const blob = await sa_downloadUrbanizacionesTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "urbanizations_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toasts.info("Plantilla de urbanizaciones descargada");
    } catch (e) {
      toasts.error(errMsg(e));
    }
  };

  const onDownloadTemplateSir = async () => {
    try {
      const blob = await sa_downloadSirensTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sirens_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toasts.info("Plantilla de sirenas descargada");
    } catch (e) {
      toasts.error(errMsg(e));
    }
  };

  // --- Helpers para pill ---
  const statusPill = (
    s:
      | UrbanizationBulkImportResult["report"][number]["status"]
      | SirenBulkImportResult["report"][number]["status"]
  ) => {
    const map: Record<string, string> = {
      would_create:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      would_update:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      created:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      updated:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return map[s] || "";
  };

  const deleteStatusPill = (
    s:
      | UrbanizationBulkDeleteResult["report"][number]["status"]
      | SirenBulkDeleteResult["report"][number]["status"]
  ) => {
    const map: Record<string, string> = {
      deleted:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      not_found:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return map[s] || "";
  };

  return (
    <CardShell>
      {/* ================= Urbanizaciones ================= */}
      <h3 className="font-medium mb-4 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
        <Upload className="size-5" /> Carga masiva de urbanizaciones
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
        Usa Excel (.xlsx). El primer paso es un <b>Dry-run</b> de validación;
        luego confirma para escribir en BD.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Importar Urbanizaciones */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="text-base font-medium flex items-center gap-2">
              <FileUp className="size-4 text-[var(--brand-primary)]" /> Importar
              / Actualizar
            </div>
            <button
              onClick={onDownloadTemplateUrb}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300"
            >
              <Download className="size-3.5" /> Descargar plantilla
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer p-2 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors">
              <FileUp className="size-5 text-neutral-500 dark:text-neutral-400" />
              <span className="text-sm truncate flex-1 text-neutral-700 dark:text-neutral-300">
                {fileImportUrb
                  ? `Archivo seleccionado: ${fileImportUrb.name}`
                  : "Seleccionar archivo .xlsx para importar"}
              </span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFileImportUrb(e.target.files?.[0] ?? null);
                  setLastImportUrb(null);
                }}
                className="hidden"
              />
            </label>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Modo de ejecución:
              </span>
              <button
                onClick={() => setDryRunUrb((d) => !d)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  dryRunUrb
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                }`}
              >
                {dryRunUrb ? (
                  <ToggleRight className="size-4" />
                ) : (
                  <ToggleLeft className="size-4" />
                )}
                {dryRunUrb
                  ? "Dry-run (Simulación)"
                  : "Confirmar (Escribir en BD)"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={!fileImportUrb || importMutUrb.isPending}
                onClick={() =>
                  fileImportUrb &&
                  importMutUrb.mutate({ file: fileImportUrb, dry: dryRunUrb })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-medium hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importMutUrb.isPending
                  ? "Procesando…"
                  : dryRunUrb
                  ? "Ejecutar Dry-run"
                  : "Confirmar importación"}
              </button>

              {lastImportUrb?.dryRun && (
                <button
                  disabled={!fileImportUrb || importMutUrb.isPending}
                  onClick={() =>
                    fileImportUrb &&
                    importMutUrb.mutate({ file: fileImportUrb, dry: false })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar con el mismo archivo
                </button>
              )}
            </div>

            {lastImportUrb && (
              <div className="mt-4 p-4 rounded-xl bg-neutral-900 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-semibold mb-3 text-neutral-800 dark:text-neutral-200">
                  Resumen: Procesados: {lastImportUrb.processed} • A crear:{" "}
                  {lastImportUrb.toCreate} • A actualizar:{" "}
                  {lastImportUrb.toUpdate}
                </p>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                            Nombre
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700 w-32">
                            Estado
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastImportUrb.report.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-200/50 cursor-pointer dark:hover:bg-neutral-850/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                              {r.name}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(
                                  r.status
                                )}`}
                              >
                                {r.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-red-600 dark:text-red-400 text-xs">
                              {r.error ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Borrado Urbanizaciones */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="text-base font-medium flex items-center gap-2">
              <FileX className="size-4 text-red-500" /> Borrado masivo (por
              nombre)
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer p-2 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors">
              <FileUp className="size-5 text-neutral-500 dark:text-neutral-400" />
              <span className="text-sm truncate flex-1 text-neutral-700 dark:text-neutral-300">
                {fileDeleteUrb
                  ? `Archivo seleccionado: ${fileDeleteUrb.name}`
                  : "Seleccionar archivo .xlsx para eliminar"}
              </span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFileDeleteUrb(e.target.files?.[0] ?? null);
                  setLastDeleteUrb(null);
                }}
                className="hidden"
              />
            </label>

            <button
              disabled={!fileDeleteUrb || deleteMutUrb.isPending}
              onClick={() =>
                fileDeleteUrb && deleteMutUrb.mutate(fileDeleteUrb)
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutUrb.isPending ? "Eliminando…" : "Eliminar desde Excel"}
            </button>

            {lastDeleteUrb && (
              <div className="mt-4 p-4 rounded-xl bg-neutral-900 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-semibold mb-3 text-neutral-800 dark:text-neutral-200">
                  Resumen: Eliminadas: {lastDeleteUrb.removed} /{" "}
                  {lastDeleteUrb.processed}
                </p>
                <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                            Nombre
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700 w-32">
                            Estado
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastDeleteUrb.report.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-200/50 cursor-pointer dark:hover:bg-neutral-850/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                              {r.name}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${deleteStatusPill(
                                  r.status
                                )}`}
                              >
                                {r.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-red-600 dark:text-red-400 text-xs">
                              {r.error ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="my-10 border-neutral-200 dark:border-neutral-800" />

      {/* ================= Sirenas ================= */}
      <h3 className="font-medium mb-4 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
        <Upload className="size-5" /> Carga masiva de sirenas
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
        Usa Excel (.xlsx). El primer paso es un <b>Dry-run</b> de validación;
        luego confirma para escribir en BD.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Importar Sirenas */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="text-base font-medium flex items-center gap-2">
              <FileUp className="size-4 text-[var(--brand-primary)]" /> Importar
              / Actualizar
            </div>
            <button
              onClick={onDownloadTemplateSir}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300"
            >
              <Download className="size-3.5" /> Descargar plantilla
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer p-2 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors">
              <FileUp className="size-5 text-neutral-500 dark:text-neutral-400" />
              <span className="text-sm truncate flex-1 text-neutral-700 dark:text-neutral-300">
                {fileImportSir
                  ? `Archivo seleccionado: ${fileImportSir.name}`
                  : "Seleccionar archivo .xlsx para importar"}
              </span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFileImportSir(e.target.files?.[0] ?? null);
                  setLastImportSir(null);
                }}
                className="hidden"
              />
            </label>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Modo de ejecución:
              </span>
              <button
                onClick={() => setDryRunSir((d) => !d)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  dryRunSir
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                }`}
              >
                {dryRunSir ? (
                  <ToggleRight className="size-4" />
                ) : (
                  <ToggleLeft className="size-4" />
                )}
                {dryRunSir
                  ? "Dry-run (Simulación)"
                  : "Confirmar (Escribir en BD)"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={!fileImportSir || importMutSir.isPending}
                onClick={() =>
                  fileImportSir &&
                  importMutSir.mutate({ file: fileImportSir, dry: dryRunSir })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-medium hover:brightness-110 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importMutSir.isPending
                  ? "Procesando…"
                  : dryRunSir
                  ? "Ejecutar Dry-run"
                  : "Confirmar importación"}
              </button>

              {lastImportSir?.dryRun && (
                <button
                  disabled={!fileImportSir || importMutSir.isPending}
                  onClick={() =>
                    fileImportSir &&
                    importMutSir.mutate({ file: fileImportSir, dry: false })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar con el mismo archivo
                </button>
              )}
            </div>

            {lastImportSir && (
              <div className="mt-4 p-4 rounded-xl bg-neutral-900 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-semibold mb-3 text-neutral-800 dark:text-neutral-200">
                  Resumen: Procesados: {lastImportSir.processed} • A crear:{" "}
                  {lastImportSir.toCreate} • A actualizar:{" "}
                  {lastImportSir.toUpdate}
                </p>
                <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                            Device ID
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700 w-32">
                            Estado
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastImportSir.report.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-200/50 cursor-pointer dark:hover:bg-neutral-850/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                              {r.deviceId}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(
                                  r.status
                                )}`}
                              >
                                {r.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-red-600 dark:text-red-400 text-xs">
                              {r.error ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Borrado Sirenas */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="text-base font-medium flex items-center gap-2">
              <FileX className="size-4 text-red-500" /> Borrado masivo (por
              deviceId)
            </div>
          </div>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer p-2 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors">
              <FileUp className="size-5 text-neutral-500 dark:text-neutral-400" />
              <span className="text-sm truncate flex-1 text-neutral-700 dark:text-neutral-300">
                {fileDeleteSir
                  ? `Archivo seleccionado: ${fileDeleteSir.name}`
                  : "Seleccionar archivo .xlsx para eliminar"}
              </span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFileDeleteSir(e.target.files?.[0] ?? null);
                  setLastDeleteSir(null);
                }}
                className="hidden"
              />
            </label>

            <button
              disabled={!fileDeleteSir || deleteMutSir.isPending}
              onClick={() =>
                fileDeleteSir && deleteMutSir.mutate(fileDeleteSir)
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutSir.isPending ? "Eliminando…" : "Eliminar desde Excel"}
            </button>

            {lastDeleteSir && (
              <div className="mt-4 p-4 rounded-xl bg-neutral-900 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-semibold mb-3 text-neutral-800 dark:text-neutral-200">
                  Resumen: Eliminadas: {lastDeleteSir.removed} /{" "}
                  {lastDeleteSir.processed}
                </p>
                <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800 sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                            Device ID
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700 w-32">
                            Estado
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastDeleteSir.report.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-200/50 cursor-pointer dark:hover:bg-neutral-850/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                              {r.deviceId}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${deleteStatusPill(
                                  r.status
                                )}`}
                              >
                                {r.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-red-600 dark:text-red-400 text-xs">
                              {r.error ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardShell>
  );
}
