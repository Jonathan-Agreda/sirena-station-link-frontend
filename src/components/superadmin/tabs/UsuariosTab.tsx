"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search, Users } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import { sa_listUsersByUrbanizacion, Paginated } from "@/services/superadmin";
import type { User } from "@/types/superadmin";
import CardShell from "../CardShell";

export default function UsuariosTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  const [q, setQ] = useState("");

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["sa", "users", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId)
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 50,
          } as Paginated<User>),
    enabled: !!selectedUrbanizacionId,
    refetchOnMount: "always",
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
