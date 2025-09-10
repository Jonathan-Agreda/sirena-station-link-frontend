"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import {
  sa_listUrbanizaciones,
  sa_listSirensByUrbanizacion,
  sa_listUsersByUrbanizacion,
  sa_listAssignmentsByUrbanizacion,
  sa_listActiveSessionsByUrbanizacion,
  type Paginated,
} from "@/services/superadmin";
import type {
  Urbanizacion,
  Siren,
  User,
  Assignment,
  ActiveSession,
} from "@/types/superadmin";

type TabKey =
  | "resumen"
  | "sirenas"
  | "usuarios"
  | "asignaciones"
  | "sesiones"
  | "bulk";
function isTabKey(v: string): v is TabKey {
  return [
    "resumen",
    "sirenas",
    "usuarios",
    "asignaciones",
    "sesiones",
    "bulk",
  ].includes(v);
}
function formatDateTime(ms: number | string | null | undefined) {
  const n = typeof ms === "string" ? Number(ms) : (ms as number | undefined);
  if (!n || Number.isNaN(n)) return "—";
  try {
    return new Date(n).toLocaleString();
  } catch {
    return "—";
  }
}

export default function SuperAdminDashboard() {
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
                <button
                  key={u.id}
                  onClick={() => setSelectedUrbanizacionId(u.id)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                    activeUrban
                      ? "border-[var(--brand-primary)] bg-[color-mix(in_oklab,var(--brand-primary)_10%,white)] dark:bg-[color-mix(in_oklab,var(--brand-primary)_22%,black)]"
                      : "border-neutral-200 dark:border-neutral-800 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                  } text-neutral-900 dark:text-neutral-100 cursor-pointer`}
                >
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      ID: {u.id}
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    máx {u.maxUsers}
                  </span>
                </button>
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
            disabled
            title="Próxima fase"
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 py-2 text-sm opacity-60 cursor-not-allowed text-neutral-700 dark:text-neutral-300"
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
        <Topbar />
        <ContentTabs active={active} onChange={goTab} />
      </main>
    </div>
  );
}

function Topbar() {
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

function ContentTabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "resumen",
      label: "Resumen",
      icon: <Building2 className="size-4" />,
    },
    {
      key: "sirenas",
      label: "Sirenas",
      icon: <SirenIcon className="size-4" />,
    },
    { key: "usuarios", label: "Usuarios", icon: <Users className="size-4" /> },
    {
      key: "asignaciones",
      label: "Asignaciones",
      icon: <LinkIcon className="size-4" />,
    },
    { key: "sesiones", label: "Sesiones", icon: <Clock className="size-4" /> }, // NUEVO
    { key: "bulk", label: "Bulk", icon: <Upload className="size-4" /> },
  ];

  return (
    <div>
      <div className="flex gap-1 overflow-auto pb-2">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${
                isActive
                  ? "border-[var(--brand-primary)] bg-[color-mix(in_oklab,var(--brand-primary)_10%,white)] dark:bg-[color-mix(in_oklab,var(--brand-primary)_22%,black)]"
                  : "border-neutral-200 dark:border-neutral-800 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900"
              } cursor-pointer text-neutral-900 dark:text-neutral-100`}
              aria-selected={isActive}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        {active === "resumen" && <ResumenTab />}
        {active === "sirenas" && <SirenasTab />}
        {active === "usuarios" && <UsuariosTab />}
        {active === "asignaciones" && <AsignacionesTab />}
        {active === "sesiones" && <SesionesTab />} {/* NUEVO */}
        {active === "bulk" && <BulkTab />}
      </div>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 shadow-xs dark:shadow-none text-neutral-900 dark:text-neutral-100">
      {children}
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

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900">
      <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

/* ----------------- Sirenas ----------------- */

function SirenasTab() {
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
          disabled
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 text-sm opacity-60 cursor-not-allowed text-neutral-700 dark:text-neutral-300"
          title="Próxima fase"
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
                  ID: {s.id} · Device: {s.deviceId} ·{" "}
                  {s.online ? "online" : "offline"} · relay {s.relay} · siren{" "}
                  {s.siren}
                  {s.ip ? ` · IP ${s.ip}` : ""}
                </div>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  s.online
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                }`}
              >
                {s.online ? "ONLINE" : "OFFLINE"}
              </span>
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
                  <Mail className="size-3" />{" "}
                  <span className="truncate">{u.email}</span>
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

  // 👇 índice por keycloakId para mostrar nombre completo
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

function BulkTab() {
  return (
    <CardShell>
      <h3 className="font-medium mb-2 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
        <Upload className="size-4" /> Carga masiva (Dry-run primero)
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Aquí podrás cargar Excel/CSV para crear Urbanizaciones, Usuarios,
        Sirenas y Asignaciones. Primero ejecutaremos un{" "}
        <span className="font-medium">Dry-run</span> obligatorio que valida todo
        sin escribir en BD. Si pasa, podrás confirmar la ejecución.
      </p>
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900">
          <div className="text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
            Subir archivo
          </div>
          <input
            disabled
            type="file"
            className="w-full text-sm opacity-60 cursor-not-allowed"
            title="Próxima fase"
          />
        </div>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900">
          <div className="text-sm font-medium mb-1 text-neutral-900 dark:text-neutral-100">
            Modo
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Dry-run (obligatorio) → luego Confirmar.
          </div>
        </div>
      </div>
    </CardShell>
  );
}
