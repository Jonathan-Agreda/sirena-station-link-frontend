"use client";

import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">Panel de Monitoreo</h1>
      <p className="opacity-80">
        Hola {profile?.username}. Aquí irá la lista de sirenas, vista RootTree,
        grupos y el mapa Leaflet.
      </p>
      <div className="rounded-xl border p-4">
        <p className="text-sm">
          Próximamente: Socket.IO realtime, Leaflet, toggles ON/OFF, alertas
          sonoras/vibración y logs.
        </p>
      </div>
    </section>
  );
}
