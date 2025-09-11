"use client";
import React from "react";

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string | React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3"
      aria-modal
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-pointer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
        </div>
        <div className="p-4 text-neutral-900 dark:text-neutral-100">
          {children}
        </div>
        {footer ? (
          <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-b-2xl">
            <div className="flex justify-end gap-2">{footer}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
