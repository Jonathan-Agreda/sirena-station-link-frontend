"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log en desarrollo; en prod no hace falta
    if (process.env.NODE_ENV !== "production") {
      console.error("[App crashed]", error);
    }
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-[100svh] grid place-items-center p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Algo salió mal</h1>
          <p className="text-sm opacity-80">
            La aplicación detectó un error, pero tu sesión sigue activa.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex px-4 py-2 rounded-md bg-black/90 text-white hover:bg-black"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
