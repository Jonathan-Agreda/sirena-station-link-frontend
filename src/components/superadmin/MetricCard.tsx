"use client";

import React from "react";

export default function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900">
      <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
