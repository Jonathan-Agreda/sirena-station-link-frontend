"use client";

import { useState } from "react";

type ToastKind = "success" | "error" | "info";

export function useMiniToasts() {
  const [items, setItems] = useState<
    { id: number; kind: ToastKind; text: string }[]
  >([]);

  const push = (kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, text }]);
    window.setTimeout(() => {
      setItems((s) => s.filter((t) => t.id !== id));
    }, 3200);
  };

  const container = (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2">
      {items.map((t) => {
        const base =
          "rounded-xl border px-3 py-2 text-sm shadow-sm flex items-center gap-2";
        const cls =
          t.kind === "success"
            ? "bg-emerald-600 text-white border-emerald-500"
            : t.kind === "error"
            ? "bg-red-600 text-white border-red-500"
            : "bg-neutral-800 text-neutral-100 border-neutral-700";
        return (
          <div key={t.id} className={`${base} ${cls}`}>
            <span className="truncate">{t.text}</span>
          </div>
        );
      })}
    </div>
  );

  return {
    container,
    success: (msg: string) => push("success", msg),
    error: (msg: string) => push("error", msg),
    info: (msg: string) => push("info", msg),
  };
}
