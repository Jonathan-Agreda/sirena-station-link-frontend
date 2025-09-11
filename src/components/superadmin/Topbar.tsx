"use client";

import { Plus, Upload } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";

export default function Topbar() {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Panel SUPERADMIN
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Gestiona urbanizaciones, sirenas, usuarios y asignaciones.
          {selectedUrbanizacionId
            ? `  |  Seleccionada: ${selectedUrbanizacionId}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 text-sm opacity-60 cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          title="Próxima fase"
        >
          <Plus className="size-4" />
          Crear
        </button>
        <button
          disabled
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 text-sm opacity-60 cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          title="Próxima fase"
        >
          <Upload className="size-4" />
          Bulk (Dry-run)
        </button>
      </div>
    </div>
  );
}
