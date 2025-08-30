"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const logoutStore = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await api.post("/auth/logout/web", {}, { withCredentials: true });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      logoutStore();
      setLoading(false);
      router.push("/login");
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                 border border-[var(--brand-primary)] text-[var(--brand-primary)]
                 hover:bg-[var(--brand-primary)] hover:text-white
                 dark:border-[var(--brand-primary)] dark:text-[var(--brand-primary)]
                 dark:hover:bg-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-fg)]
                 transition cursor-pointer"
    >
      <LogOut size={16} />
      {loading ? "Cerrando..." : "Salir"}
    </button>
  );
}
