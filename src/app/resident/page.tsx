"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/services/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import ProfileCard from "@/components/ProfileCard";

export default function ResidentPage() {
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  return (
    <RoleGate allowed={["RESIDENTE"]}>
      <section className="min-h-[calc(100dvh-8rem)] container-max py-8 grid gap-6">
        <h1 className="text-2xl font-bold">Mi Sirena</h1>

        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-5 w-72" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : data ? (
          <>
            <ProfileCard user={data} />

            {data.alicuota === false ? null : (
              <div className="rounded-xl border p-4 grid gap-2">
                <p className="text-sm opacity-80">
                  Aquí irá tu botón ON/OFF con auto-off 5 min y estado en tiempo
                  real.
                </p>
                <button className="btn-primary w-fit" disabled>
                  (Próximamente) Activar / Desactivar sirena
                </button>
              </div>
            )}
          </>
        ) : null}
      </section>
    </RoleGate>
  );
}
