"use client";

import React from "react";

export default function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900 shadow-xs dark:shadow-none text-neutral-900 dark:text-neutral-100">
      {children}
    </div>
  );
}
