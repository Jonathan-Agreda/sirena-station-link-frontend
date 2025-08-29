"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/services/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import ProfileCard from "@/components/ProfileCard";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  return (
    <RoleGate allowed={["ADMIN", "GUARDIA", "SUPERADMIN"]}>
      <section className="min-h-[calc(100dvh-8rem)] container-max py-8 grid gap-6">
        <h1 className="text-2xl font-bold">Panel de Monitoreo</h1>

        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : data ? (
          <>
            <ProfileCard user={data} />

            <div className="rounded-xl border p-4">
              <p className="text-sm opacity-80">
                Próximamente: lista de sirenas, RootTree, grupos y mapa Leaflet
                (realtime con Socket.IO).
              </p>
            </div>
          </>
        ) : null}
      </section>
    </RoleGate>
  );
}
