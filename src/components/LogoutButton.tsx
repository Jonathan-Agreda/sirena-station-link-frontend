"use client";

import keycloak from "@/lib/keycloak";
import { useAuthStore } from "@/store/auth";

export default function LogoutButton() {
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = async () => {
    try {
      clear();
      await keycloak.logout({
        redirectUri:
          typeof window !== "undefined" ? window.location.origin : undefined,
      });
    } catch {
      // En caso de fallo de red, al menos limpiamos estado y recargamos
      if (typeof window !== "undefined") window.location.href = "/";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg px-3 py-2 text-sm hover:bg-[color-mix(in_oklab,transparent,black_10%)] dark:hover:bg-[color-mix(in_oklab,transparent,white_10%)]"
    >
      Cerrar sesión
    </button>
  );
}
