"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/services/auth";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  return (
    <RoleGate allowed={["ADMIN", "GUARDIA", "SUPERADMIN"]}>
      <section className="grid gap-4">
        <h1 className="text-2xl font-bold">Panel de Monitoreo</h1>

        {isLoading ? (
          <p className="opacity-70">Cargando perfil…</p>
        ) : (
          <>
            <p className="opacity-80">
              Hola <strong>{data?.username}</strong>
              {data?.urbanizacion?.nombre ? (
                <>
                  {" "}
                  — Urbanización: <strong>{data.urbanizacion.nombre}</strong>
                </>
              ) : null}
            </p>

            <div className="rounded-xl border p-4">
              <p className="text-sm">
                Próximamente: lista de sirenas, RootTree, grupos y mapa Leaflet
                (realtime con Socket.IO).
              </p>
            </div>
          </>
        )}
      </section>
    </RoleGate>
  );
}
