"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Search, LogOut, Loader2 } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import {
  sa_listUsersByUrbanizacion,
  sa_listActiveSessionsByUrbanizacion,
  sa_terminateUserSession,
  sa_terminateAllSessionsByUrbanizacion,
  Paginated,
} from "@/services/superadmin";
import type { User, ActiveSession } from "@/types/superadmin";
import CardShell from "../CardShell";
import { useMiniToasts } from "../hooks/useMiniToasts";

function formatDateTime(ms: number | string | null | undefined) {
  const n = typeof ms === "string" ? Number(ms) : (ms as number | undefined);
  if (!n || Number.isNaN(n)) return "—";
  try {
    return new Date(n).toLocaleString();
  } catch {
    return "—";
  }
}

type SessionWithInternalId = ActiveSession & {
  internalUserId: string | null;
  userDisplay: string;
};

export default function SesionesTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  const [q, setQ] = useState("");
  const toasts = useMiniToasts();

  const usersQ = useQuery({
    queryKey: ["sa", "users", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId)
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 300,
          } as Paginated<User>),
    enabled: !!selectedUrbanizacionId,
    staleTime: 10_000,
  });

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
  });

  // --- Mutación para cerrar sesión individual ---
  const terminateMut = useMutation({
    mutationFn: async (vars: { userId: string; sessionId: string }) =>
      sa_terminateUserSession(vars.userId, vars.sessionId),
    onSuccess: () => {
      toasts.success("Sesión cerrada.");
      sessionsQ.refetch();
    },
    onError: () => toasts.error("No se pudo cerrar la sesión."),
  });

  // --- Mutación para cerrar todas las sesiones ---
  const terminateAllMut = useMutation({
    mutationFn: async () =>
      sa_terminateAllSessionsByUrbanizacion(selectedUrbanizacionId!),
    onSuccess: (res) => {
      toasts.success(`Cerradas ${res.closed} sesiones. Errores: ${res.errors}`);
      sessionsQ.refetch();
    },
    onError: () => toasts.error("No se pudieron cerrar todas las sesiones."),
  });

  const loading =
    !selectedUrbanizacionId ||
    usersQ.isLoading ||
    sessionsQ.isLoading ||
    usersQ.isFetching ||
    sessionsQ.isFetching;

  const users = usersQ.data?.items ?? [];
  const sessions = sessionsQ.data?.items ?? [];

  // Mapea sesiones y agrega el id interno de usuario
  const sessionsWithInternalId: SessionWithInternalId[] = useMemo(() => {
    const userByKC = new Map<string, User>();
    for (const u of users) {
      if (u.keycloakId) userByKC.set(u.keycloakId, u);
    }
    return sessions.map((sess) => ({
      ...sess,
      internalUserId: userByKC.get(sess.userId)?.id ?? null,
      userDisplay: userByKC.get(sess.userId)?.name || sess.username,
    }));
  }, [sessions, users]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sessionsWithInternalId;
    return sessionsWithInternalId.filter((sess) => {
      return [
        sess.userDisplay ?? "",
        sess.username,
        sess.id,
        sess.ipAddress ?? "",
        sess.userId,
      ].some((v) => String(v).toLowerCase().includes(s));
    });
  }, [sessionsWithInternalId, q]);

  return (
    <CardShell>
      {toasts.container}
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <Clock className="size-4" /> Sesiones activas
        </h3>
        <button
          onClick={() => terminateAllMut.mutate()}
          disabled={
            terminateAllMut.isPending ||
            loading ||
            !selectedUrbanizacionId ||
            filtered.length === 0
          }
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {terminateAllMut.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Cerrando todas...
            </>
          ) : (
            <>
              <LogOut className="size-4" /> Cerrar todas las sesiones
            </>
          )}
        </button>
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
          {filtered.map((s) => (
            <li key={s.id} className="py-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {s.userDisplay || s.username || "Usuario"}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  UID: {s.userId} · @{s.username} · Último acceso:{" "}
                  {formatDateTime(s.lastAccess)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  sessionId: {s.id}
                </span>
                <button
                  onClick={() =>
                    s.internalUserId &&
                    terminateMut.mutate({
                      userId: s.internalUserId,
                      sessionId: s.id,
                    })
                  }
                  disabled={terminateMut.isPending || !s.internalUserId}
                  className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 cursor-pointer"
                  title="Cerrar sesión"
                >
                  {terminateMut.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}
