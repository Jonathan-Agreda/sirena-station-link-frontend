"use client";

import { Toaster } from "sonner";

export function ClientToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        classNames: {
          success: "text-white",
          error: "text-white",
          info: "text-white",
        },
        style: {
          backgroundColor: "var(--accent)", // 👈 azul del .env
          color: "white",
        },
      }}
    />
  );
}
