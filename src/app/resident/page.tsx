"use client";

import RoleGate from "@/components/RoleGate";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/services/auth";

export default function ResidentPage() {
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  const blocked = data && data.alicuota === false;

  return (
    <RoleGate allowed={["RESIDENTE"]}>
      <section className="grid gap-4">
        <h1 className="text-2xl font-bold">Mi Sirena</h1>

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

            {blocked ? (
              <div className="rounded-xl border border-[--danger] p-4">
                <p className="text-sm">
                  Tu alícuota está pendiente. La activación de sirena está
                  bloqueada temporalmente.
                </p>
              </div>
            ) : (
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
        )}
      </section>
    </RoleGate>
  );
}
