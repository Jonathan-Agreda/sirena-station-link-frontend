"use client";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";

export type UrbanizacionFormValues = {
  name: string;
  maxUsers?: number | null;
};

export default function UrbanizacionForm({
  open,
  mode,
  initial,
  loading = false,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: UrbanizacionFormValues | null;
  loading?: boolean;
  onSubmit: (values: UrbanizacionFormValues) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [maxUsers, setMaxUsers] = useState<string>("");

  useEffect(() => {
    setName(initial?.name ?? "");
    setMaxUsers(
      initial?.maxUsers != null && !Number.isNaN(initial.maxUsers)
        ? String(initial.maxUsers)
        : ""
    );
  }, [initial, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const max =
      maxUsers.trim() === "" ? undefined : Math.max(0, Number(maxUsers));
    onSubmit({
      name: trimmed,
      maxUsers: Number.isFinite(max) ? max : undefined,
    });
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Nueva urbanización" : "Editar urbanización"}
      onClose={loading ? () => {} : onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-900 cursor-pointer disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            form="urb-form"
            type="submit"
            disabled={loading || !name.trim()}
            className="px-3 py-1.5 rounded-xl border border-[var(--brand-primary)] text-sm bg-[var(--brand-primary)] text-white hover:brightness-110 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      <form id="urb-form" onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
            Nombre
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lomas del Bosque"
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
            Máximo de usuarios (opcional)
          </label>
          <input
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="120"
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm outline-none"
          />
        </div>
      </form>
    </Modal>
  );
}
