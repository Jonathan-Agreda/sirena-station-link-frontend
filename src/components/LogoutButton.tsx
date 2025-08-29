"use client";

import { useState } from "react";
import keycloak from "@/lib/keycloak";
import { useAuthStore } from "@/store/auth";

export default function LogoutButton() {
  const clear = useAuthStore((s) => s.clear);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      clear();
      await keycloak.logout({
        redirectUri:
          typeof window !== "undefined" ? window.location.origin : undefined,
      });
    } catch {
      if (typeof window !== "undefined") window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      aria-label="Cerrar sesión"
      className="rounded-lg px-3 py-2 text-sm transition 
                 hover:bg-[color-mix(in_oklab,transparent,black_10%)] 
                 dark:hover:bg-[color-mix(in_oklab,transparent,white_10%)] 
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
