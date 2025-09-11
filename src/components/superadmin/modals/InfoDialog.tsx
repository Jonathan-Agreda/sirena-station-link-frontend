"use client";
import React from "react";
import Modal from "./Modal";

export default function InfoDialog({
  open,
  title = "Aviso",
  message,
  confirmText = "Entendido",
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message: string | React.ReactNode;
  confirmText?: string;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onConfirm}
      footer={
        <>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-xl border border-[var(--brand-primary)] text-sm bg-[var(--brand-primary)] text-white hover:brightness-110 cursor-pointer"
          >
            {confirmText}
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
