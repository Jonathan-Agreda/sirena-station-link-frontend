"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Siren as SirenIcon,
  Users,
  Link as LinkIcon,
  Upload,
  Plus,
  Search,
  Network,
  Mail,
  User2,
  Link2,
  BadgeCheck,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import {
  sa_listUrbanizaciones,
  sa_listSirensByUrbanizacion,
  sa_listUsersByUrbanizacion,
  sa_listAssignmentsByUrbanizacion,
  sa_listActiveSessionsByUrbanizacion,
  sa_createUrbanizacion,
  sa_updateUrbanizacion,
  sa_deleteUrbanizacion,
  sa_createSiren,
  sa_updateSiren,
  sa_deleteSiren,
  // Bulk Urbanizaciones:
  sa_bulkImportUrbanizaciones,
  sa_bulkDeleteUrbanizaciones,
  sa_downloadUrbanizacionesTemplate,
  // Bulk Sirenas: 👇 FALTABAN ESTAS
  sa_bulkImportSirens,
  sa_bulkDeleteSirens,
  sa_downloadSirensTemplate,
  type Paginated,
  type UrbanizationBulkImportResult,
  type UrbanizationBulkDeleteResult,
  type SirenBulkImportResult,
  type SirenBulkDeleteResult,
} from "@/services/superadmin";
import type {
  Urbanizacion,
  Siren,
  User,
  Assignment,
  ActiveSession,
} from "@/types/superadmin";

/* Tipos y componentes modulares */
import type { TabKey } from "./types";
import { isTabKey } from "./types";
import ContentTabs from "./SuperAdminTabs";
import CardShell from "./CardShell";
import MetricCard from "./MetricCard";

/* Modales para CRUD Urbanizaciones */
import UrbanizacionForm, {
  type UrbanizacionFormValues,
} from "./modals/UrbanizacionForm";
import SirenForm, { type SirenFormValues } from "./modals/SirenForm";
import ConfirmDialog from "./modals/ConfirmDialog";

/* ----------------- mini-toasts (sin libs externas) ----------------- */
type ToastKind = "success" | "error" | "info";
function useMiniToasts() {
  const [items, setItems] = useState<
    { id: number; kind: ToastKind; text: string }[]
  >([]);
  const push = (kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, text }]);
    window.setTimeout(() => {
      setItems((s) => s.filter((t) => t.id !== id));
    }, 3200);
  };
  const container = (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2">
      {items.map((t) => {
        const base =
          "rounded-xl border px-3 py-2 text-sm shadow-sm flex items-center gap-2";
        const cls =
          t.kind === "success"
            ? "bg-emerald-600 text-white border-emerald-500"
            : t.kind === "error"
            ? "bg-red-600 text-white border-red-500"
            : "bg-neutral-800 text-neutral-100 border-neutral-700";
        return (
          <div key={t.id} className={`${base} ${cls}`}>
            <span className="truncate">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
  return {
    container,
    success: (msg: string) => push("success", msg),
    error: (msg: string) => push("error", msg),
    info: (msg: string) => push("info", msg),
  };
}

/* ----------------- helpers ----------------- */
function formatDateTime(ms: number | string | null | undefined) {
  const n = typeof ms === "string" ? Number(ms) : (ms as number | undefined);
  if (!n || Number.isNaN(n)) return "—";
  try {
    return new Date(n).toLocaleString();
  } catch {
    return "—";
  }
}
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

/* ----------------- Header (usa nombre) ----------------- */
function HeaderBar({
  selectedName,
  onCreate,
}: {
  selectedName: string | null;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Panel SUPERADMIN
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Gestiona urbanizaciones, sirenas, usuarios y asignaciones.
          {selectedName ? `  |  Seleccionada: ${selectedName}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 cursor-pointer"
          title="Crear urbanización"
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
          {active === "resumen" && <ResumenTab />}{" "}
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

/* ----------------- Resumen ----------------- */

function ResumenTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();

  const { data: sMeta } = useQuery({
    queryKey: ["sa", "sirens-meta", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listSirensByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 1,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 1,
          } as Paginated<Siren>),
    enabled: !!selectedUrbanizacionId,
  });
  const { data: uMeta } = useQuery({
    queryKey: ["sa", "users-meta", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 1,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 1,
          } as Paginated<User>),
    enabled: !!selectedUrbanizacionId,
  });
  const { data: aMeta } = useQuery({
    queryKey: ["sa", "assignments-meta", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listAssignmentsByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 1,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 1,
          } as Paginated<Assignment>),
    enabled: !!selectedUrbanizacionId,
  });

  return (
    <CardShell>
      <h3 className="font-medium mb-2 text-neutral-900 dark:text-neutral-100">
        Resumen general
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Métricas rápidas de la urbanización activa.
      </p>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <MetricCard
          label="Sirenas"
          value={sMeta?.total ?? 0}
          icon={<Network className="size-4" />}
        />
        <MetricCard
          label="Usuarios"
          value={uMeta?.total ?? 0}
          icon={<User2 className="size-4" />}
        />
        <MetricCard
          label="Asignaciones"
          value={aMeta?.total ?? 0}
          icon={<Link2 className="size-4" />}
        />
      </div>
    </CardShell>
  );
}

/* ----------------- Sirenas ----------------- */

function SirenasTab({
  onCreate,
  onEdit,
  onDelete,
}: {
  onCreate: () => void;
  onEdit: (s: Siren) => void;
  onDelete: (s: Siren) => void;
}) {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  const [q, setQ] = useState("");

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["sa", "sirens", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listSirensByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 50,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 50,
          } as Paginated<Siren>),
    enabled: !!selectedUrbanizacionId,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 1,
  });

  const loading = isLoading || isFetching || !selectedUrbanizacionId;
  const items = data?.items ?? [];

  const sirens = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) =>
      [x.deviceId, x.alias, x.id, x.ip ?? ""].some((v) =>
        String(v).toLowerCase().includes(s)
      )
    );
  }, [items, q]);

  return (
    <CardShell>
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <SirenIcon className="size-4" /> Sirenas
        </h3>
        <button
          onClick={onCreate}
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[var(--brand-primary)] text-white px-3 py-1.5 text-sm hover:brightness-110 cursor-pointer"
        >
          Nueva sirena
        </button>
      </div>

      <div className="relative mt-3">
        <Search className="absolute left-3 top-2.5 size-4 text-neutral-400 dark:text-neutral-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por deviceId, ID o IP…"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 pl-9 pr-3 py-2 text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {loading && (
        <div className="mt-4 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      )}
      {!loading && isError && (
        <div className="mt-4 text-sm text-red-600 dark:text-red-400">
          Error al cargar sirenas.
        </div>
      )}
      {!loading && !isError && sirens.length === 0 && (
        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Sin coincidencias.
        </div>
      )}
      {!loading && !isError && sirens.length > 0 && (
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {sirens.map((s) => (
            <li key={s.id} className="py-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.deviceId}</div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  ID: {s.id} · Device: {s.deviceId} · API Key: {s.apiKey} ·{" "}
                  {s.online ? "online" : "offline"} · relay {s.relay} · siren{" "}
                  {s.siren}
                  {s.ip ? ` · IP ${s.ip}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    s.online
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  {s.online ? "ONLINE" : "OFFLINE"}
                </span>
                <button
                  onClick={() => onEdit(s)}
                  className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => onDelete(s)}
                  className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}

/* ----------------- Usuarios ----------------- */

function UsuariosTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  const [q, setQ] = useState("");

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["sa", "users", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 50,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 50,
          } as Paginated<User>),
    enabled: !!selectedUrbanizacionId,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 1,
  });

  const loading = isLoading || isFetching || !selectedUrbanizacionId;
  const items = data?.items ?? [];

  const users = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((u) =>
      [u.name, u.username, u.email, u.role, u.id].some((v) =>
        String(v).toLowerCase().includes(s)
      )
    );
  }, [items, q]);

  return (
    <CardShell>
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <Users className="size-4" /> Usuarios
        </h3>
        <button
          disabled
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 text-sm opacity-60 cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          title="Próxima fase"
        >
          Nuevo usuario
        </button>
      </div>

      <div className="relative mt-3">
        <Search className="absolute left-3 top-2.5 size-4 text-neutral-400 dark:text-neutral-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, usuario, email o ID…"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 pl-9 pr-3 py-2 text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {loading && (
        <div className="mt-4 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      )}
      {!loading && isError && (
        <div className="mt-4 text-sm text-red-600 dark:text-red-400">
          Error al cargar usuarios.
        </div>
      )}

      {!loading && !isError && users.length === 0 && (
        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Sin coincidencias.
        </div>
      )}

      {!loading && !isError && users.length > 0 && (
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {users.map((u) => (
            <li key={u.id} className="py-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {u.name || u.username}
                </div>
                <div className="text-xs flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Mail className="size-3" />
                  <span className="truncate">{u.email}</span>
                  <span>· @{u.username}</span>
                  <span>· rol {u.role}</span>
                  <span>· alícuota {u.alicuota ? "✓" : "✕"}</span>
                  <span>· sesiones {u.sessions}</span>
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                ID: {u.id}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}

/* --------------- Asignaciones --------------- */

function AsignacionesTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  const [q, setQ] = useState("");

  const usersQ = useQuery({
    queryKey: ["sa", "users", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 200,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 200,
          } as Paginated<User>),
    enabled: !!selectedUrbanizacionId,
    staleTime: 10_000,
  });

  const sirensQ = useQuery({
    queryKey: ["sa", "sirens", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listSirensByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 200,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 200,
          } as Paginated<Siren>),
    enabled: !!selectedUrbanizacionId,
    staleTime: 10_000,
  });

  const assignQ = useQuery({
    queryKey: ["sa", "assignments", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listAssignmentsByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 100,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 100,
          } as Paginated<Assignment>),
    enabled: !!selectedUrbanizacionId,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 1,
  });

  const loading =
    !selectedUrbanizacionId ||
    usersQ.isLoading ||
    sirensQ.isLoading ||
    assignQ.isLoading ||
    usersQ.isFetching ||
    sirensQ.isFetching ||
    assignQ.isFetching;

  const users = usersQ.data?.items ?? [];
  const sirens = sirensQ.data?.items ?? [];
  const assignments = assignQ.data?.items ?? [];

  const userById = useMemo(() => {
    const m = new Map<string, User>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  const sirenById = useMemo(() => {
    const m = new Map<string, Siren>();
    for (const s of sirens) m.set(s.id, s);
    return m;
  }, [sirens]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return assignments;
    return assignments.filter((a) => {
      const u = userById.get(a.userId);
      const si = sirenById.get(a.sirenId);
      return [
        u?.name ?? "",
        u?.username ?? "",
        u?.email ?? "",
        si?.deviceId ?? "",
        a.userId,
        a.sirenId,
      ].some((v) => String(v).toLowerCase().includes(s));
    });
  }, [assignments, q, userById, sirenById]);

  return (
    <CardShell>
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <LinkIcon className="size-4" /> Asignaciones
        </h3>
        <button
          disabled
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 text-sm opacity-60 cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          title="Próxima fase"
        >
          Nueva asignación
        </button>
      </div>

      <div className="relative mt-3">
        <Search className="absolute left-3 top-2.5 size-4 text-neutral-400 dark:text-neutral-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por usuario, deviceId o IDs…"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 pl-9 pr-3 py-2 text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {loading && (
        <div className="mt-4 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      )}
      {!loading && (usersQ.isError || sirensQ.isError || assignQ.isError) && (
        <div className="mt-4 text-sm text-red-600 dark:text-red-400">
          Error al cargar asignaciones.
        </div>
      )}

      {!loading && !assignQ.isError && filtered.length === 0 && (
        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Sin coincidencias.
        </div>
      )}

      {!loading && !assignQ.isError && filtered.length > 0 && (
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {filtered.map((a) => {
            const u = userById.get(a.userId);
            const s = sirenById.get(a.sirenId);
            const fullName = u?.name || u?.username || "Usuario";
            const device = s?.deviceId || "—";

            return (
              <li key={a.id} className="py-2 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{fullName}</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    UID: {a.userId} · DeviceID: {device} (SID: {a.sirenId})
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <BadgeCheck className="size-3" /> activa
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </CardShell>
  );
}

/* --------------- Sesiones activas --------------- */

function SesionesTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  const [q, setQ] = useState("");

  // Users para join visual (usaremos keycloakId)
  const usersQ = useQuery({
    queryKey: ["sa", "users", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId, {
            page: 1,
            pageSize: 300,
          })
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 300,
          } as Paginated<User>),
    enabled: !!selectedUrbanizacionId,
    staleTime: 10_000,
  });

  // Sesiones activas
  const sessionsQ = useQuery({
    queryKey: ["sa", "sessions", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listActiveSessionsByUrbanizacion(selectedUrbanizacionId)
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 50,
          } as Paginated<ActiveSession>),
    enabled: !!selectedUrbanizacionId,
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 1,
  });

  const loading =
    !selectedUrbanizacionId ||
    usersQ.isLoading ||
    sessionsQ.isLoading ||
    usersQ.isFetching ||
    sessionsQ.isFetching;

  const users = usersQ.data?.items ?? [];
  const sessions = sessionsQ.data?.items ?? [];

  // índice por keycloakId para mostrar nombre completo
  const userByKC = useMemo(() => {
    const m = new Map<string, User>();
    for (const u of users) {
      if (u.keycloakId) m.set(u.keycloakId, u);
    }
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessions;
    return sessions.filter((sess) => {
      const u = userByKC.get(sess.userId);
      return [
        u?.name ?? "",
        u?.username ?? "",
        sess.username,
        sess.id,
        sess.ipAddress ?? "",
        sess.userId,
      ].some((v) => String(v).toLowerCase().includes(s));
    });
  }, [sessions, q, userByKC]);

  return (
    <CardShell>
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <Clock className="size-4" /> Sesiones activas
        </h3>
      </div>

      <div className="relative mt-3">
        <Search className="absolute left-3 top-2.5 size-4 text-neutral-400 dark:text-neutral-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, usuario, sessionId o IP…"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 pl-9 pr-3 py-2 text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {loading && (
        <div className="mt-4 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      )}
      {!loading && (usersQ.isError || sessionsQ.isError) && (
        <div className="mt-4 text-sm text-red-600 dark:text-red-400">
          Error al cargar sesiones.
        </div>
      )}
      {!loading && !sessionsQ.isError && filtered.length === 0 && (
        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          No hay sesiones activas.
        </div>
      )}
      {!loading && !sessionsQ.isError && filtered.length > 0 && (
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {filtered.map((s) => {
            const u = userByKC.get(s.userId);
            return (
              <li key={s.id} className="py-2 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {u?.name || u?.username || s.username || "Usuario"}
                  </div>
                  {/* UID = keycloakId */}
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    UID: {s.userId} · @{u?.username ?? s.username} · Último
                    acceso: {formatDateTime(s.lastAccess)}
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  sessionId: {s.id}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </CardShell>
  );
}

/* ----------------- Bulk ----------------- */

function BulkTab({
  toasts,
}: {
  toasts: {
    success: (m: string) => void;
    error: (m: string) => void;
    info: (m: string) => void;
  };
}) {
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
