"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Search, Pencil, Trash2, Upload } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import { sa_listUrbanizaciones } from "@/services/superadmin";
import type { Urbanizacion, Siren } from "@/types/superadmin";
import { useMiniToasts } from "./hooks/useMiniToasts";
import { useSuperAdminMutations } from "./hooks/useSuperAdminMutations";
import type { TabKey } from "./types";
import { isTabKey } from "./types";
import ContentTabs from "./SuperAdminTabs";
import UrbanizacionForm from "./modals/UrbanizacionForm";
import SirenForm from "./modals/SirenForm";
import ConfirmDialog from "./modals/ConfirmDialog";
import ResumenTab from "./tabs/ResumenTab";
import SirenasTab from "./tabs/SirenasTab";
import UsuariosTab from "./tabs/UsuariosTab";
import AsignacionesTab from "./tabs/AsignacionesTab";
import SesionesTab from "./tabs/SesionesTab";
import BulkTab from "./tabs/BulkTab";
import HeaderBar from "./HeaderBar";

export default function SuperAdminDashboard() {
  const toasts = useMiniToasts();
  const { modals, setters, mutations } = useSuperAdminMutations(toasts);

  const {
    selectedUrbanizacionId,
    setSelectedUrbanizacionId,
    searchUrbanizacion,
    setSearchUrbanizacion,
  } = useSuperAdminStore();

  const [active, setActive] = useState<TabKey>("resumen");

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (isTabKey(h)) setActive(h);
    };
    onHash(); // Check on initial render
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTab = (t: TabKey) => {
    window.location.hash = t;
    setActive(t);
  };

  const {
    data: uResp,
    isLoading: loadingUrban,
    isError: errorUrban,
  } = useQuery({
    queryKey: ["sa", "urbanizations", searchUrbanizacion],
    queryFn: () => sa_listUrbanizaciones(),
    staleTime: 30_000,
  });

  const urbanizaciones = uResp?.items ?? [];

  useEffect(() => {
    if (!selectedUrbanizacionId && urbanizaciones.length > 0) {
      setSelectedUrbanizacionId(urbanizaciones[0].id);
    }
  }, [selectedUrbanizacionId, urbanizaciones, setSelectedUrbanizacionId]);

  const filtered = useMemo<Urbanizacion[]>(() => {
    const q = searchUrbanizacion.trim().toLowerCase();
    return q
      ? urbanizaciones.filter(
          (u) =>
            u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
        )
      : urbanizaciones;
  }, [urbanizaciones, searchUrbanizacion]);

  const selectedUrbanizacionName = useMemo(() => {
    return (
      urbanizaciones.find((x) => x.id === selectedUrbanizacionId)?.name ?? null
    );
  }, [urbanizaciones, selectedUrbanizacionId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-6">
      <aside className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 lg:p-4 h-auto lg:h-[calc(100dvh-140px)] lg:sticky lg:top-20 overflow-auto shadow-sm dark:shadow-none text-neutral-900 dark:text-neutral-100">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="size-5" />
          <h2 className="text-base font-semibold">Urbanizaciones</h2>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 size-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={searchUrbanizacion}
            onChange={(e) => setSearchUrbanizacion(e.target.value)}
            placeholder="Buscar por nombre o ID…"
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 pl-9 pr-3 py-2 text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>
        <div className="space-y-1">
          {loadingUrban && (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800"
                />
              ))}
            </div>
          )}
          {errorUrban && (
            <div className="text-sm text-red-600 dark:text-red-400 py-2">
              No se pudo cargar urbanizaciones.
            </div>
          )}
          {!loadingUrban &&
            !errorUrban &&
            filtered.map((u) => (
              <div
                key={u.id}
                className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                  u.id === selectedUrbanizacionId
                    ? "border-[var(--brand-primary)] bg-[color-mix(in_oklab,var(--brand-primary)_10%,white)] dark:bg-[color-mix(in_oklab,var(--brand-primary)_22%,black)]"
                    : "border-neutral-200 dark:border-neutral-800 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                } text-neutral-900 dark:text-neutral-100`}
              >
                <button
                  onClick={() => setSelectedUrbanizacionId(u.id)}
                  className="min-w-0 text-left flex-1 cursor-pointer"
                >
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                    ID: {u.id}
                  </div>
                </button>
                <div className="flex items-center gap-1 pl-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    máx {u.maxUsers}
                  </span>
                  <button
                    onClick={() => setters.setToEdit(u)}
                    className="ml-1 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setters.setToDelete(u)}
                    className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          {!loadingUrban && !errorUrban && filtered.length === 0 && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 py-6 text-center">
              Sin resultados.
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setters.setOpenCreate(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <Plus className="size-4" /> Urbanización
          </button>
          <button
            disabled
            title="Próxima fase"
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 text-sm opacity-60 cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          >
            <Upload className="size-4" /> Bulk
          </button>
        </div>
      </aside>

      <main className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 lg:p-4 shadow-sm dark:shadow-none text-neutral-900 dark:text-neutral-100">
        <HeaderBar
          selectedName={selectedUrbanizacionName}
          onCreate={() => setters.setOpenCreate(true)}
        />
        <ContentTabs active={active} onChange={goTab} />
        <div className="mt-3">
          {active === "resumen" && <ResumenTab />}
          {active === "sirenas" && (
            <SirenasTab
              onCreate={() => setters.setOpenCreateSiren(true)}
              onEdit={(s) => setters.setToEditSiren(s)}
              onDelete={(s) => setters.setToDeleteSiren(s)}
            />
          )}
          {active === "usuarios" && <UsuariosTab />}
          {active === "asignaciones" && <AsignacionesTab />}
          {active === "sesiones" && <SesionesTab />}
          {active === "bulk" && <BulkTab toasts={toasts} />}
        </div>
      </main>

      {/* Modales */}
      <UrbanizacionForm
        open={modals.openCreate}
        mode="create"
        loading={mutations.createMut.isPending}
        onSubmit={(v) => mutations.createMut.mutate(v)}
        onClose={() => setters.setOpenCreate(false)}
      />
      <UrbanizacionForm
        open={!!modals.toEdit}
        mode="edit"
        initial={modals.toEdit ?? undefined}
        loading={mutations.updateMut.isPending}
        onSubmit={(v) =>
          modals.toEdit &&
          mutations.updateMut.mutate({ id: modals.toEdit.id, data: v })
        }
        onClose={() => setters.setToEdit(null)}
      />
      <ConfirmDialog
        open={!!modals.toDelete}
        title="Eliminar urbanización"
        message={
          <>
            ¿Seguro que deseas eliminar{" "}
            <span className="font-semibold">{modals.toDelete?.name}</span>? Esta
            acción no se puede deshacer.
          </>
        }
        loading={mutations.deleteMut.isPending}
        confirmText="Sí, eliminar"
        onConfirm={() =>
          modals.toDelete && mutations.deleteMut.mutate(modals.toDelete.id)
        }
        onClose={() => setters.setToDelete(null)}
      />
      <SirenForm
        open={modals.openCreateSiren}
        mode="create"
        loading={mutations.createSirenMut.isPending}
        onSubmit={(v) => mutations.createSirenMut.mutate(v)}
        onClose={() => setters.setOpenCreateSiren(false)}
      />
      <SirenForm
        open={!!modals.toEditSiren}
        mode="edit"
        initial={modals.toEditSiren ?? undefined}
        loading={mutations.updateSirenMut.isPending}
        onSubmit={(v) =>
          modals.toEditSiren &&
          mutations.updateSirenMut.mutate({
            id: modals.toEditSiren.id,
            data: v,
          })
        }
        onClose={() => setters.setToEditSiren(null)}
      />
      <ConfirmDialog
        open={!!modals.toDeleteSiren}
        title="Eliminar sirena"
        message={
          <>
            ¿Seguro que deseas eliminar la sirena{" "}
            <span className="font-semibold">
              {modals.toDeleteSiren?.deviceId}
            </span>
            ?
          </>
        }
        loading={mutations.deleteSirenMut.isPending}
        confirmText="Sí, eliminar"
        onConfirm={() =>
          modals.toDeleteSiren &&
          mutations.deleteSirenMut.mutate(modals.toDeleteSiren.id)
        }
        onClose={() => setters.setToDeleteSiren(null)}
      />

      {toasts.container}
    </div>
  );
}
