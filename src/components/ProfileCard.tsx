"use client";

import { MeResponse } from "@/services/auth";

type Props = {
  user: MeResponse;
};

export default function ProfileCard({ user }: Props) {
  const blocked = user.alicuota === false;

  return (
    <div className="rounded-xl border p-4 grid gap-2">
      <p className="opacity-80">
        Hola <strong>{user.username}</strong>
        {user.urbanizacion?.nombre && (
          <>
            {" "}
            — Urbanización: <strong>{user.urbanizacion.nombre}</strong>
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
