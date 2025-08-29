"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/services/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import ProfileCard from "@/components/ProfileCard";
import {
  BellRing,
  Wifi,
  Power,
  Map as MapIcon,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  CircleDot,
  Plus,
  Activity,
  Layers,
} from "lucide-react";
import { useMemo, useState } from "react";

type SirenRow = {
  id: string;
  name: string;
  group?: string;
  online: boolean;
  relay: "ON" | "OFF";
  lastSeen: string;
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  // Datos mock para la maqueta (mañana los cambiamos por los reales)
  const mockSirens = useMemo<SirenRow[]>(
    () => [
      {
        id: "SRN-001",
        name: "Sirena Norte",
        group: "Perímetro",
        online: true,
        relay: "OFF",
        lastSeen: "hace 12s",
      },
      {
        id: "SRN-002",
        name: "Sirena Club",
        group: "Club Social",
        online: true,
        relay: "ON",
        lastSeen: "hace 5s",
      },
      {
        id: "SRN-003",
        name: "Sirena Este",
        group: "Residencial",
        online: false,
        relay: "OFF",
        lastSeen: "hace 3m",
      },
      {
        id: "SRN-004",
        name: "Sirena Oeste",
        group: "Residencial",
        online: true,
        relay: "OFF",
        lastSeen: "hace 20s",
      },
      {
        id: "SRN-005",
        name: "Portón Principal",
        group: "Accesos",
        online: true,
        relay: "OFF",
        lastSeen: "hace 2s",
      },
    ],
    []
  );

  const totals = useMemo(
    () => ({
      sirens: mockSirens.length,
      online: mockSirens.filter((s) => s.online).length,
      active: mockSirens.filter((s) => s.relay === "ON").length,
      groups: 4,
    }),
    [mockSirens]
  );

  const [treeOpen, setTreeOpen] = useState<{ [k: string]: boolean }>({
    root: true,
    grupo1: true,
    grupo2: true,
  });

  return (
    <RoleGate allowed={["ADMIN", "GUARDIA", "SUPERADMIN"]}>
      <section className="container-max min-h-[calc(100dvh-8rem)] py-8 grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">Panel de Monitoreo</h1>

          {/* Puedes ocultar esto si no lo quieres en el header */}
          {isLoading ? (
            <Skeleton className="h-10 w-64" />
          ) : data ? (
            <div className="max-w-sm w-full sm:w-auto">
              <ProfileCard user={data} />
            </div>
          ) : null}
        </div>

        {/* Filtros / Acciones */}
        <div className="rounded-xl border p-4 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Search size={16} className="opacity-70" />
            <input
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Buscar sirena, grupo o ID…"
              disabled
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
              disabled
            >
              <option>Estado: Todos</option>
              <option>Online</option>
              <option>Offline</option>
              <option>Activadas (ON)</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button className="btn-primary btn-sm" disabled>
              <RefreshCw size={16} /> Refrescar
            </button>
            <button className="btn-outline btn-sm" disabled>
              <Plus size={16} /> Crear grupo
            </button>
          </div>
        </div>

        {/* KPIs */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Sirenas registradas"
              value={totals.sirens.toString()}
              icon={<Layers className="opacity-80" size={18} />}
            />
            <KpiCard
              title="Online"
              value={totals.online.toString()}
              icon={<Wifi className="opacity-80" size={18} />}
              tone="success"
            />
            <KpiCard
              title="Alarma activada"
              value={totals.active.toString()}
              icon={<BellRing className="opacity-80" size={18} />}
              tone="warning"
            />
            <KpiCard
              title="Grupos"
              value={totals.groups.toString()}
              icon={<Activity className="opacity-80" size={18} />}
              tone="accent"
            />
          </div>
        )}

        {/* Mapa + Sidebar */}
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <Skeleton className="h-[420px]" />
            <div className="grid gap-4">
              <Skeleton className="h-[220px]" />
              <Skeleton className="h-[220px]" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            {/* MAPA (Leaflet placeholder) */}
            <div className="rounded-xl border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <MapIcon size={16} />
                  <span className="text-sm font-medium">
                    Mapa · Leaflet (tiempo real)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-outline btn-xs" disabled>
                    Vista completa
                  </button>
                </div>
              </div>
              <div className="relative h-[420px] bg-[color-mix(in_oklab,var(--brand-primary)_8%,transparent)] dark:bg-[color-mix(in_oklab,var(--brand-primary)_14%,transparent)]">
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-lg border px-3 py-1 text-xs opacity-80">
                    Mapa de sirenas (place-holder)
                  </div>
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="grid gap-4">
              {/* Lista de sirenas */}
              <div className="rounded-xl border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b">
                  <Power size={16} />
                  <span className="text-sm font-medium">Sirenas</span>
                </div>

                <div className="max-h-[260px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[--bg-light] dark:bg-[--bg-dark] border-b">
                      <tr className="text-left">
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Grupo</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Relé</th>
                        <th className="px-3 py-2">Último</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockSirens.map((s) => (
                        <tr key={s.id} className="border-b/50">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <CircleDot
                                size={12}
                                className={
                                  s.online ? "text-green-600" : "text-red-600"
                                }
                              />
                              <div className="leading-tight">
                                <div className="font-medium">{s.name}</div>
                                <div className="text-xs opacity-70">{s.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">{s.group || "-"}</td>
                          <td className="px-3 py-2">
                            <Badge tone={s.online ? "success" : "danger"}>
                              {s.online ? "Online" : "Offline"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              tone={s.relay === "ON" ? "warning" : "default"}
                            >
                              {s.relay}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">{s.lastSeen}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2 border-t text-xs opacity-70">
                  * Acciones (activar/desactivar) se habilitarán al conectar
                  Socket.IO.
                </div>
              </div>

              {/* Árbol (RootTree) */}
              <div className="rounded-xl border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b">
                  {treeOpen.root ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <button
                    className="text-sm font-medium"
                    onClick={() =>
                      setTreeOpen((t) => ({ ...t, root: !t.root }))
                    }
                  >
                    Estructura (RootTree)
                  </button>
                </div>

                {treeOpen.root && (
                  <div className="p-3 text-sm">
                    <TreeItem
                      open={treeOpen.grupo1}
                      onToggle={() =>
                        setTreeOpen((t) => ({ ...t, grupo1: !t.grupo1 }))
                      }
                      label="Residencial"
                      childrenNodes={[
                        "Sirena Norte (SRN-001)",
                        "Sirena Este (SRN-003)",
                        "Sirena Oeste (SRN-004)",
                      ]}
                    />
                    <TreeItem
                      open={treeOpen.grupo2}
                      onToggle={() =>
                        setTreeOpen((t) => ({ ...t, grupo2: !t.grupo2 }))
                      }
                      label="Accesos"
                      childrenNodes={["Portón Principal (SRN-005)"]}
                    />
                    <div className="mt-2 opacity-70 text-xs">
                      * Este árbol se alimentará del backend (urbanización →
                      grupos → sirenas).
                    </div>
                  </div>
                )}
              </div>

              {/* Actividad reciente */}
              <div className="rounded-xl border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b">
                  <Activity size={16} />
                  <span className="text-sm font-medium">
                    Actividad reciente
                  </span>
                </div>
                <ul className="p-3 text-sm grid gap-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-green-600" />
                    <span>
                      <strong>SRN-002</strong> → Relé <strong>ON</strong>{" "}
                      (guardián).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-yellow-600" />
                    <span>
                      Auto-off programado en 5 min para <strong>SRN-002</strong>
                      .
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-red-600" />
                    <span>
                      <strong>SRN-003</strong> sin conexión desde 3 min.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Nota de roadmap */}
        <div className="rounded-xl border p-4 text-sm opacity-80">
          Próximamente: tiempo real con Socket.IO, acciones sobre cada sirena,
          permisos finos por rol y panel de auditoría.
        </div>
      </section>
    </RoleGate>
  );
}

/* ----------------- UI helpers (maqueta) ----------------- */
function KpiCard({
  title,
  value,
  icon,
  tone = "default",
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[color-mix(in_oklab,green_12%,transparent)]"
      : tone === "warning"
      ? "bg-[color-mix(in_oklab,orange_12%,transparent)]"
      : tone === "accent"
      ? "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
      : "bg-[color-mix(in_oklab,var(--brand-primary)_10%,transparent)]";
  return (
    <div className="rounded-xl border p-4 grid gap-2">
      <div
        className={`w-8 h-8 rounded-lg grid place-items-center ${toneClass}`}
      >
        {icon}
      </div>
      <div className="text-xs opacity-70">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const klass =
    tone === "success"
      ? "bg-[color-mix(in_oklab,green_14%,transparent)] text-green-900 dark:text-green-200"
      : tone === "danger"
      ? "bg-[color-mix(in_oklab,red_14%,transparent)] text-red-900 dark:text-red-200"
      : tone === "warning"
      ? "bg-[color-mix(in_oklab,orange_14%,transparent)] text-orange-900 dark:text-orange-200"
      : "bg-[color-mix(in_oklab,var(--fg-light)_12%,transparent)] dark:bg-[color-mix(in_oklab,var(--fg-dark)_14%,transparent)]";
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs ${klass}`}>
      {children}
    </span>
  );
}

function TreeItem({
  open,
  onToggle,
  label,
  childrenNodes = [],
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  childrenNodes?: string[];
}) {
  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-2 font-medium"
        onClick={onToggle}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {label}
      </button>
      {open && (
        <ul className="mt-1 ml-6 grid gap-1">
          {childrenNodes.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <CircleDot size={12} className="opacity-70" />
              <span className="opacity-90">{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
