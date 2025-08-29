"use client";

import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-lg bg-[color-mix(in_oklab,var(--fg-light)_10%,transparent)]",
        "dark:bg-[color-mix(in_oklab,var(--fg-dark)_12%,transparent)]",
        className
      )}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite]"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, white 12%, transparent), transparent)",
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
