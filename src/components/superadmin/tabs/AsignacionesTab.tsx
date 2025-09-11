"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Link as LinkIcon, Search } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import {
  sa_listUsersByUrbanizacion,
  sa_listSirensByUrbanizacion,
  sa_listAssignmentsByUrbanizacion,
  Paginated,
} from "@/services/superadmin";
import type { User, Siren, Assignment } from "@/types/superadmin";
import CardShell from "../CardShell";

export default function AsignacionesTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  const [q, setQ] = useState("");

  const usersQ = useQuery({
    queryKey: ["sa", "users", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId)
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
        ? sa_listSirensByUrbanizacion(selectedUrbanizacionId)
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
        ? sa_listAssignmentsByUrbanizacion(selectedUrbanizacionId)
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 100,
          } as Paginated<Assignment>),
    enabled: !!selectedUrbanizacionId,
    refetchOnMount: "always",
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
