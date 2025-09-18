"use client";

import { useQuery } from "@tanstack/react-query";
import { Network, User2, Link2 } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import {
  sa_listSirensByUrbanizacion,
  sa_listUsersByUrbanizacion,
  sa_listAssignmentsByUrbanizacionFast,
  Paginated,
} from "@/services/superadmin";
import type { Siren, User } from "@/types/superadmin";
import CardShell from "../CardShell";
import MetricCard from "../MetricCard";

/**
 * Tutoría Senior:
 * - Ahora el dato de "Asignaciones" usa el endpoint rápido (sa_listAssignmentsByUrbanizacionFast).
 * - Esto mejora el tiempo de carga y reduce la carga en el backend.
 * - El resto de métricas mantienen el tipado estricto y la estructura original.
 */

export default function ResumenTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();

  const { data: sMeta } = useQuery({
    queryKey: ["sa", "sirens-meta", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listSirensByUrbanizacion(selectedUrbanizacionId)
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
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId)
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 1,
          } as Paginated<User>),
    enabled: !!selectedUrbanizacionId,
  });

  // 🚀 Optimizado: usa el endpoint rápido para asignaciones
  const { data: aMeta } = useQuery({
    queryKey: ["sa", "assignments-meta", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listAssignmentsByUrbanizacionFast(selectedUrbanizacionId)
        : Promise.resolve([]),
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
          value={Array.isArray(aMeta) ? aMeta.length : 0}
          icon={<Link2 className="size-4" />}
        />
      </div>
    </CardShell>
  );
}
