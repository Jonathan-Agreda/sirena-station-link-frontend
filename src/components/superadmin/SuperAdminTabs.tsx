"use client";

import React from "react";
import {
  Building2,
  Siren as SirenIcon,
  Users,
  Link as LinkIcon,
  Upload,
  Clock,
} from "lucide-react";
import type { TabKey } from "./types";

export default function ContentTabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "resumen",
      label: "Resumen",
      icon: <Building2 className="size-4" />,
    },
    {
      key: "sirenas",
      label: "Sirenas",
      icon: <SirenIcon className="size-4" />,
    },
    { key: "usuarios", label: "Usuarios", icon: <Users className="size-4" /> },
    {
      key: "asignaciones",
      label: "Asignaciones",
      icon: <LinkIcon className="size-4" />,
    },
    { key: "sesiones", label: "Sesiones", icon: <Clock className="size-4" /> },
    { key: "bulk", label: "Bulk", icon: <Upload className="size-4" /> },
  ];

  return (
    <div>
      <div className="flex gap-1 overflow-auto pb-2">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm whitespace-nowrap ${
                isActive
                  ? "border-[var(--brand-primary)] bg-[color-mix(in_oklab,var(--brand-primary)_10%,white)] dark:bg-[color-mix(in_oklab,var(--brand-primary)_22%,black)]"
                  : "border-neutral-200 dark:border-neutral-800 bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900"
              } cursor-pointer text-neutral-900 dark:text-neutral-100`}
              aria-selected={isActive}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>
      {/* El contenido (tabs) lo sigue renderizando el dashboard principal */}
    </div>
  );
}
