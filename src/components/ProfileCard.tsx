"use client";

import { MeResponse, ResidentMeResponse } from "@/services/auth";

type Props = {
  user: MeResponse;
};

// 👇 Type Guard
function isResident(user: MeResponse): user is ResidentMeResponse {
  return (user as ResidentMeResponse).role === "RESIDENTE";
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
