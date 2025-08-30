"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { logoutWeb } from "@/services/auth";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await logoutWeb(); // service centralizado
      router.push("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--fg-light)] dark:text-[var(--fg-dark)] hover:bg-[color-mix(in_oklab,transparent,black_10%)] dark:hover:bg-[color-mix(in_oklab,transparent,white_10%)] transition"
    >
      <LogOut size={16} />
      {loading ? "Cerrando..." : "Salir"}
    </button>
  );
}
