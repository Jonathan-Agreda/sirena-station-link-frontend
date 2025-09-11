"use client";
import React from "react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Confirmar",
  message,
  confirmText = "Sí, confirmar",
  cancelText = "Cancelar",
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => {} : onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm bg-white text-white dark:bg-neutral-900 cursor-pointer disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-red-500/30 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Procesando…" : confirmText}
          </button>
        </>
      }
    >
      <div className="text-sm text-neutral-700 dark:text-neutral-300">
        {message}
      </div>
    </Modal>
  );
}
