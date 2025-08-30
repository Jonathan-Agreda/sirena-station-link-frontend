"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe, MeResponse } from "@/services/auth"; // 👈 usamos MeResponse
import { Skeleton } from "@/components/ui/Skeleton";
import { LogoAnimated } from "@/components/LogoAnimated";
import ActivationLogsTable from "@/components/ActivationLogsTable";
import { motion } from "framer-motion";
import type { Role } from "@/services/auth";

export default function DashboardPage() {
  const { data: me, isLoading } = useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  let urbanizacion = "—";
  if (me?.role === "SUPERADMIN") {
    urbanizacion = "Global (SUPERADMIN)";
  } else if (me?.urbanizacion?.name) {
    urbanizacion = me.urbanizacion.name;
  } else {
    urbanizacion = "Sin urbanización asignada";
  }

  return (
    <RoleGate allowed={["ADMIN", "GUARDIA", "SUPERADMIN"] as Role[]}>
      <section className="min-h-[100svh] w-full px-4 py-6">
        {/* Header */}
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <LogoAnimated className="h-12 w-12" />
          <div className="flex flex-col">
            <motion.h1
              className="text-2xl font-bold"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Panel de Activaciones / Desactivaciones
            </motion.h1>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-64" />
            ) : (
              <p className="text-sm text-neutral-500">
                Urbanización:{" "}
                <span className="font-medium">{urbanizacion}</span>
              </p>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="mx-auto mt-6 max-w-6xl">
          <ActivationLogsTable />
        </div>
      </section>
    </RoleGate>
  );
}
