"use client";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { useSuperAdminStore } from "@/store/superadmin";

export type SirenFormValues = {
  deviceId: string;
  apiKey: string;
  urbanizationId: string;
  lat?: number | null;
  lng?: number | null;
};

export default function SirenForm({
  open,
  mode,
  initial,
  loading = false,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<SirenFormValues> | null;
  loading?: boolean;
  onSubmit: (values: SirenFormValues) => void;
  onClose: () => void;
}) {
  const { selectedUrbanizacionId } = useSuperAdminStore();

  const [deviceId, setDeviceId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  useEffect(() => {
    setDeviceId(initial?.deviceId ?? "");
    setApiKey(initial?.apiKey ?? "");
    setLat(
      initial?.lat != null && !Number.isNaN(initial.lat)
        ? String(initial.lat)
        : ""
    );
    setLng(
      initial?.lng != null && !Number.isNaN(initial.lng)
        ? String(initial.lng)
        : ""
    );
  }, [initial, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = deviceId.trim();
    const k = apiKey.trim();
    const u = selectedUrbanizacionId?.trim() ?? "";
    if (!d || !k || !u) return;

    const parsedLat =
      lat.trim() === ""
        ? undefined
        : Number.isFinite(Number(lat))
        ? Number(lat)
        : undefined;
    const parsedLng =
      lng.trim() === ""
        ? undefined
        : Number.isFinite(Number(lng))
        ? Number(lng)
        : undefined;

    onSubmit({
      deviceId: d,
      apiKey: k,
      urbanizationId: u, // ✅ correcto
      lat: parsedLat,
      lng: parsedLng,
    });
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Nueva sirena" : "Editar sirena"}
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
            form="siren-form"
            type="submit"
            disabled={loading || !deviceId.trim() || !apiKey.trim()}
            className="px-3 py-1.5 rounded-xl border border-[var(--brand-primary)] text-sm bg-[var(--brand-primary)] text-white hover:brightness-110 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      <form id="siren-form" onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
            Device ID
          </label>
          <input
            autoFocus
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="SRN-001"
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
            API Key
          </label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="srn-api-key-123"
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm outline-none"
          />
        </div>
        {/* Urbanización (auto) */}
        {selectedUrbanizacionId && (
          <div>
            <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
              Urbanización
            </label>
            <input
              value={selectedUrbanizacionId}
              disabled
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-not-allowed"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
              Latitud (opcional)
            </label>
            <input
              value={lat}
              onChange={(e) =>
                setLat(e.target.value.replace(/[^0-9\.\-]/g, ""))
              }
              placeholder="-2.170998"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-neutral-600 dark:text-neutral-400">
              Longitud (opcional)
            </label>
            <input
              value={lng}
              onChange={(e) =>
                setLng(e.target.value.replace(/[^0-9\.\-]/g, ""))
              }
              placeholder="-79.922359"
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
