"use client";

import { useAuthStore } from "@/store/auth";

export default function ResidentPage() {
  const profile = useAuthStore((s) => s.profile);

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">Mi Sirena</h1>
      <p className="opacity-80">
        Hola {profile?.username}. Aquí irá tu botón ON/OFF con auto-off 5 min y
        validación de alícuota.
      </p>
      <div className="rounded-xl border p-4">
        <p className="text-sm">
          Mostraremos Urbanización, tus datos y una foto (subida por ADMIN).
          Realtime con Socket.IO.
        </p>
      </div>
    </section>
  );
}
