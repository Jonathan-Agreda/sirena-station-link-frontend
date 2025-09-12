"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Siren as SirenIcon, Search, Pencil, Trash2 } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import {
  sa_listSirensByUrbanizacion,
  type Paginated,
} from "@/services/superadmin";
import type { Siren } from "@/types/superadmin";
import CardShell from "../CardShell";

export default function SirenasTab({
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
        ? sa_listSirensByUrbanizacion(selectedUrbanizacionId)
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
