"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search, Pencil, Trash2, Upload } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import {
  sa_listUrbanizaciones,
  sa_createUrbanizacion,
  sa_updateUrbanizacion,
  sa_deleteUrbanizacion,
  sa_createSiren,
  sa_updateSiren,
  sa_deleteSiren,
} from "@/services/superadmin";
import type { Urbanizacion, Siren } from "@/types/superadmin";
import { useMiniToasts } from "./hooks/useMiniToasts";

/* Tipos y componentes modulares */
import type { TabKey } from "./types";
import { isTabKey } from "./types";
import ContentTabs from "./SuperAdminTabs";

/* Modales para CRUD */
import UrbanizacionForm, {
  type UrbanizacionFormValues,
} from "./modals/UrbanizacionForm";
import SirenForm, { type SirenFormValues } from "./modals/SirenForm";
import ConfirmDialog from "./modals/ConfirmDialog";

/* Tabs */
import ResumenTab from "./tabs/ResumenTab";
import SirenasTab from "./tabs/SirenasTab";
import UsuariosTab from "./tabs/UsuariosTab";
import AsignacionesTab from "./tabs/AsignacionesTab";
import SesionesTab from "./tabs/SesionesTab";
import BulkTab from "./tabs/BulkTab";
import HeaderBar from "./HeaderBar";

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

/* ----------------- Dashboard ----------------- */
export default function SuperAdminDashboard() {
  const toasts = useMiniToasts();
  const queryClient = useQueryClient();

  const {
    selectedUrbanizacionId,
    setSelectedUrbanizacionId,
    searchUrbanizacion,
    setSearchUrbanizacion,
  } = useSuperAdminStore();

  const [active, setActive] = useState<TabKey>("resumen");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const init = window.location.hash.replace("#", "");
    if (isTabKey(init)) setActive(init);
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (isTabKey(h)) setActive(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const goTab = (t: TabKey) => {
    if (typeof window !== "undefined") window.location.hash = t;
    setActive(t);
  };

  // Urbanizaciones
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
    const u = urbanizaciones.find((x) => x.id === selectedUrbanizacionId);
    return u?.name ?? null;
  }, [urbanizaciones, selectedUrbanizacionId]);

  /* ------- Mutations (create / update / delete) ------- */
  const createMut = useMutation({
    mutationFn: (v: UrbanizacionFormValues) => sa_createUrbanizacion(v),
    onSuccess: (created) => {
      toasts.success(`Urbanización "${created.name}" creada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
      setSelectedUrbanizacionId(created.id);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; data: UrbanizacionFormValues }) =>
      sa_updateUrbanizacion(vars.id, vars.data),
    onSuccess: (u) => {
      toasts.success(`Urbanización "${u.name}" actualizada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => sa_deleteUrbanizacion(id),
    onSuccess: (res) => {
      toasts.success(`Urbanización eliminada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
      if (selectedUrbanizacionId === res.id) {
        setSelectedUrbanizacionId("");
      }
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  // --- Sirenas ---
  const createSirenMut = useMutation({
    mutationFn: (v: SirenFormValues) => sa_createSiren(v),
    onSuccess: (created) => {
      toasts.success(`Sirena "${created.deviceId}" creada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
      setOpenCreateSiren(false);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const updateSirenMut = useMutation({
    mutationFn: (vars: { id: string; data: SirenFormValues }) =>
      sa_updateSiren(vars.id, vars.data),
    onSuccess: (u) => {
      toasts.success(`Sirena "${u.deviceId}" actualizada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
      setToEditSiren(null);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const deleteSirenMut = useMutation({
    mutationFn: (id: string) => sa_deleteSiren(id),
    onSuccess: () => {
      toasts.success("Sirena eliminada.");
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
      setToDeleteSiren(null);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  /* ------- Estado de modales ------- */
  const [openCreate, setOpenCreate] = useState(false);
  const [toEdit, setToEdit] = useState<Urbanizacion | null>(null);
  const [toDelete, setToDelete] = useState<Urbanizacion | null>(null);
  // estado de sirenas
  const [openCreateSiren, setOpenCreateSiren] = useState(false);
  const [toEditSiren, setToEditSiren] = useState<Siren | null>(null);
  const [toDeleteSiren, setToDeleteSiren] = useState<Siren | null>(null);

  const startCreate = () => setOpenCreate(true);
  const startEdit = (u: Urbanizacion) => setToEdit(u);
  const startDelete = (u: Urbanizacion) => setToDelete(u);

  const submitCreate = (v: UrbanizacionFormValues) =>
    createMut.mutate(v, {
      onSuccess: () => setOpenCreate(false),
    });
  const submitEdit = (v: UrbanizacionFormValues) =>
    toEdit &&
    updateMut.mutate(
      { id: toEdit.id, data: v },
      {
        onSuccess: () => setToEdit(null),
      }
    );
  const confirmDelete = () =>
    toDelete &&
    deleteMut.mutate(toDelete.id, {
      onSuccess: () => setToDelete(null),
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-6">
      {/* Sidebar */}
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
              <div className="h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>
          )}
          {errorUrban && (
            <div className="text-sm text-red-600 dark:text-red-400 py-2">
              No se pudo cargar urbanizaciones.
            </div>
          )}
          {!loadingUrban &&
            !errorUrban &&
            filtered.map((u) => {
              const activeUrban = u.id === selectedUrbanizacionId;
              return (
                <div
                  key={u.id}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                    activeUrban
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
                      onClick={() => startEdit(u)}
                      className="ml-1 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => startDelete(u)}
                      className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          {!loadingUrban && !errorUrban && filtered.length === 0 && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 py-6 text-center">
              Sin resultados.
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={startCreate}
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

      {/* Main */}
      <main className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 lg:p-4 shadow-sm dark:shadow-none text-neutral-900 dark:text-neutral-100">
        <HeaderBar
          selectedName={selectedUrbanizacionName}
          onCreate={startCreate}
        />
        <ContentTabs active={active} onChange={goTab} />

        {/* Contenido de las pestañas */}
        <div className="mt-3">
          {active === "resumen" && <ResumenTab />}
          {active === "sirenas" && (
            <SirenasTab
              onCreate={() => setOpenCreateSiren(true)}
              onEdit={(s) => setToEditSiren(s)}
              onDelete={(s) => setToDeleteSiren(s)}
            />
          )}
          {active === "usuarios" && <UsuariosTab />}
          {active === "asignaciones" && <AsignacionesTab />}
          {active === "sesiones" && <SesionesTab />}
          {active === "bulk" && <BulkTab toasts={toasts} />}
        </div>
      </main>

      {/* Modales CRUD */}
      <UrbanizacionForm
        open={openCreate}
        mode="create"
        loading={createMut.isPending}
        onSubmit={submitCreate}
        onClose={() => setOpenCreate(false)}
      />
      <UrbanizacionForm
        open={!!toEdit}
        mode="edit"
        initial={
          toEdit
            ? { name: toEdit.name, maxUsers: toEdit.maxUsers ?? undefined }
            : undefined
        }
        loading={updateMut.isPending}
        onSubmit={submitEdit}
        onClose={() => setToEdit(null)}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar urbanización"
        message={
          <>
            ¿Seguro que deseas eliminar{" "}
            <span className="font-semibold">{toDelete?.name}</span>? Esta acción
            no se puede deshacer.
          </>
        }
        loading={deleteMut.isPending}
        confirmText="Sí, eliminar"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
      {/* Modales CRUD Sirenas */}
      <SirenForm
        open={openCreateSiren}
        mode="create"
        loading={createSirenMut.isPending}
        onSubmit={(v) => createSirenMut.mutate(v)}
        onClose={() => setOpenCreateSiren(false)}
      />
      <SirenForm
        open={!!toEditSiren}
        mode="edit"
        initial={toEditSiren ?? undefined}
        loading={updateSirenMut.isPending}
        onSubmit={(v) =>
          toEditSiren && updateSirenMut.mutate({ id: toEditSiren.id, data: v })
        }
        onClose={() => setToEditSiren(null)}
      />
      <ConfirmDialog
        open={!!toDeleteSiren}
        title="Eliminar sirena"
        message={
          <>
            ¿Seguro que deseas eliminar la sirena{" "}
            <span className="font-semibold">{toDeleteSiren?.deviceId}</span>?
          </>
        }
        loading={deleteSirenMut.isPending}
        confirmText="Sí, eliminar"
        onConfirm={() =>
          toDeleteSiren && deleteSirenMut.mutate(toDeleteSiren.id)
        }
        onClose={() => setToDeleteSiren(null)}
      />

      {/* Toasts */}
      {toasts.container}
    </div>
  );
}
