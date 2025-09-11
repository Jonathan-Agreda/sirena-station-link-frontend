"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
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

function errMsg(e: unknown) {
  if (typeof e === "string") return e;
  if (typeof e === "object" && e) {
    const r = e as {
      message?: string;
      response?: { data?: { message?: string } };
    };
    return r.response?.data?.message || r.message || "Ocurrió un error";
  }
  return "Ocurrió un error";
}

type Props = {
  toasts: {
    success: (m: string) => void;
    error: (m: string) => void;
    info: (m: string) => void;
  };
};

export default function BulkTab({ toasts }: Props) {
  const [fileImportUrb, setFileImportUrb] = useState<File | null>(null);
  const [fileDeleteUrb, setFileDeleteUrb] = useState<File | null>(null);
  const [lastImportUrb, setLastImportUrb] =
    useState<UrbanizationBulkImportResult | null>(null);
  const [lastDeleteUrb, setLastDeleteUrb] =
    useState<UrbanizationBulkDeleteResult | null>(null);
  const [dryRunUrb, setDryRunUrb] = useState<boolean>(true);

  const [fileImportSir, setFileImportSir] = useState<File | null>(null);
  const [fileDeleteSir, setFileDeleteSir] = useState<File | null>(null);
  const [lastImportSir, setLastImportSir] =
    useState<SirenBulkImportResult | null>(null);
  const [lastDeleteSir, setLastDeleteSir] =
    useState<SirenBulkDeleteResult | null>(null);
  const [dryRunSir, setDryRunSir] = useState<boolean>(true);

  const queryClient = useQueryClient();

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
      <h3 className="font-medium mb-2 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
        <Upload className="size-4" /> Carga masiva de urbanizaciones
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
        Usa Excel (.xlsx). El primer paso es un <b>Dry-run</b> de validación;
        luego confirma para escribir en BD.
      </p>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Importar Urbanizaciones */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Importar / Actualizar</div>
            <button
              onClick={onDownloadTemplateUrb}
              className="text-xs px-2 py-1 rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Descargar plantilla
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <label className="flex flex-col items-start gap-2 cursor-pointer">
              <span className="px-3 py-2 rounded-xl border border-dashed text-sm">
                {fileImportUrb
                  ? `📄 ${fileImportUrb.name}`
                  : "Seleccionar archivo .xlsx"}
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

            <div className="flex items-center gap-2">
              <label className="text-sm">Modo</label>
              <button
                onClick={() => setDryRunUrb((d) => !d)}
                className={`text-xs px-2 py-1 rounded-lg border ${
                  dryRunUrb
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-emerald-100 dark:bg-emerald-900/30"
                }`}
              >
                {dryRunUrb ? "Dry-run" : "Confirmar"}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                disabled={!fileImportUrb || importMutUrb.isPending}
                onClick={() =>
                  fileImportUrb &&
                  importMutUrb.mutate({ file: fileImportUrb, dry: dryRunUrb })
                }
                className="px-3 py-2 rounded-xl border text-sm"
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
                  className="px-3 py-2 rounded-xl border text-sm"
                >
                  Confirmar con el mismo archivo
                </button>
              )}
            </div>

            {lastImportUrb && (
              <div className="mt-3 text-sm">
                Procesados: {lastImportUrb.processed} · A crear:{" "}
                {lastImportUrb.toCreate} · A actualizar:{" "}
                {lastImportUrb.toUpdate}
                <div className="max-h-56 overflow-auto mt-2 border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-2">name</th>
                        <th className="p-2">status</th>
                        <th className="p-2">error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastImportUrb.report.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{r.name}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] ${statusPill(
                                r.status
                              )}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2 text-red-600">{r.error ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Borrado Urbanizaciones */}
        <div className="rounded-xl border p-3 bg-white dark:bg-neutral-900">
          <div className="text-sm font-medium">Borrado masivo (por nombre)</div>
          <div className="mt-3 space-y-3">
            <label className="flex flex-col items-start gap-2 cursor-pointer">
              <span className="px-3 py-2 rounded-xl border border-dashed text-sm">
                {fileDeleteUrb
                  ? `📄 ${fileDeleteUrb.name}`
                  : "Seleccionar archivo .xlsx"}
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
              className="px-3 py-2 rounded-xl border text-sm"
            >
              {deleteMutUrb.isPending ? "Eliminando…" : "Eliminar desde Excel"}
            </button>

            {lastDeleteUrb && (
              <div className="mt-3 text-sm">
                Eliminadas: {lastDeleteUrb.removed} / {lastDeleteUrb.processed}
                <div className="max-h-56 overflow-auto mt-2 border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-2">name</th>
                        <th className="p-2">status</th>
                        <th className="p-2">error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastDeleteUrb.report.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{r.name}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] ${deleteStatusPill(
                                r.status
                              )}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2 text-red-600">{r.error ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= Sirenas ================= */}
      <h3 className="font-medium mt-10 mb-2 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
        <Upload className="size-4" /> Carga masiva de sirenas
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
        Usa Excel (.xlsx). El primer paso es un <b>Dry-run</b> de validación;
        luego confirma para escribir en BD.
      </p>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Importar Sirenas */}
        <div className="rounded-xl border p-3 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Importar / Actualizar</div>
            <button
              onClick={onDownloadTemplateSir}
              className="text-xs px-2 py-1 rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Descargar plantilla
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <label className="flex flex-col items-start gap-2 cursor-pointer">
              <span className="px-3 py-2 rounded-xl border border-dashed text-sm">
                {fileImportSir
                  ? `📄 ${fileImportSir.name}`
                  : "Seleccionar archivo .xlsx"}
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

            <div className="flex items-center gap-2">
              <label className="text-sm">Modo</label>
              <button
                onClick={() => setDryRunSir((d) => !d)}
                className={`text-xs px-2 py-1 rounded-lg border ${
                  dryRunSir
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-emerald-100 dark:bg-emerald-900/30"
                }`}
              >
                {dryRunSir ? "Dry-run" : "Confirmar"}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                disabled={!fileImportSir || importMutSir.isPending}
                onClick={() =>
                  fileImportSir &&
                  importMutSir.mutate({ file: fileImportSir, dry: dryRunSir })
                }
                className="px-3 py-2 rounded-xl border text-sm"
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
                  className="px-3 py-2 rounded-xl border text-sm"
                >
                  Confirmar con el mismo archivo
                </button>
              )}
            </div>

            {lastImportSir && (
              <div className="mt-3 text-sm">
                Procesados: {lastImportSir.processed} · A crear:{" "}
                {lastImportSir.toCreate} · A actualizar:{" "}
                {lastImportSir.toUpdate}
                <div className="max-h-56 overflow-auto mt-2 border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-2">deviceId</th>
                        <th className="p-2">status</th>
                        <th className="p-2">error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastImportSir.report.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{r.deviceId}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] ${statusPill(
                                r.status
                              )}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2 text-red-600">{r.error ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Borrado Sirenas */}
        <div className="rounded-xl border p-3 bg-white dark:bg-neutral-900">
          <div className="text-sm font-medium">
            Borrado masivo (por deviceId)
          </div>
          <div className="mt-3 space-y-3">
            <label className="flex flex-col items-start gap-2 cursor-pointer">
              <span className="px-3 py-2 rounded-xl border border-dashed text-sm">
                {fileDeleteSir
                  ? `📄 ${fileDeleteSir.name}`
                  : "Seleccionar archivo .xlsx"}
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
              className="px-3 py-2 rounded-xl border text-sm"
            >
              {deleteMutSir.isPending ? "Eliminando…" : "Eliminar desde Excel"}
            </button>

            {lastDeleteSir && (
              <div className="mt-3 text-sm">
                Eliminadas: {lastDeleteSir.removed} / {lastDeleteSir.processed}
                <div className="max-h-56 overflow-auto mt-2 border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-2">deviceId</th>
                        <th className="p-2">status</th>
                        <th className="p-2">error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastDeleteSir.report.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{r.deviceId}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] ${deleteStatusPill(
                                r.status
                              )}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2 text-red-600">{r.error ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardShell>
  );
}
