"use client";
import { useEffect, useState } from "react";
import type { User, Siren } from "@/types/superadmin";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  open: boolean;
  users: User[];
  sirens: Siren[];
  onClose: () => void;
  onSubmit: (userId: string, sirenId: string) => void;
  loading: boolean;
};

export default function NewAssignmentModal({
  open,
  users,
  sirens,
  onClose,
  onSubmit,
  loading,
}: Props) {
  const [userId, setUserId] = useState("");
  const [sirenId, setSirenId] = useState("");

  useEffect(() => {
    if (open) {
      setUserId("");
      setSirenId("");
    }
  }, [open]);

  return (
    <ConfirmDialog
      open={open}
      title="Nueva asignación"
      message={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Usuario</label>
            <select
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecciona un usuario…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sirena</label>
            <select
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2"
              value={sirenId}
              onChange={(e) => setSirenId(e.target.value)}
              disabled={loading}
            >
              <option value="">Selecciona una sirena…</option>
              {sirens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.deviceId} ({s.alias})
                </option>
              ))}
            </select>
          </div>
        </div>
      }
      confirmText="Asignar"
      cancelText="Cancelar"
      loading={loading}
      onConfirm={() => userId && sirenId && onSubmit(userId, sirenId)}
      onClose={onClose}
    />
  );
}
