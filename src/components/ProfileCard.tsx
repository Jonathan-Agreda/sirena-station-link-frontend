"use client";

// CAMBIO 1: Se elimina la importación del tipo `ResidentMeResponse` que no existe.
import { MeResponse } from "@/services/auth";

type Props = {
  user: MeResponse;
};

// CAMBIO 2: La función ahora devuelve un simple `boolean` en lugar de intentar
// convertir el tipo a uno que no existe. La lógica interna no cambia.
function isResident(user: MeResponse): boolean {
  return user.role === "RESIDENTE";
}

export default function ProfileCard({ user }: Props) {
  const blocked = isResident(user) ? user.alicuota === false : false;

  return (
    <div className="rounded-xl border p-4 grid gap-2">
      <p className="opacity-80">
        Hola <strong>{"username" in user ? user.username : "Usuario"}</strong>
        {isResident(user) && user.urbanizacion?.name && (
          <>
            {" "}
            — Urbanización: <strong>{user.urbanizacion.name}</strong>
          </>
        )}
      </p>

      {blocked && (
        <div className="rounded-lg border border-[--danger] p-2 text-sm">
          Tu alícuota está pendiente. La activación de sirena está bloqueada
          temporalmente.
        </div>
      )}
    </div>
  );
}
