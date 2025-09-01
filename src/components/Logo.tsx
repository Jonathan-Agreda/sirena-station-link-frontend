"use client";
import * as React from "react";
// Volvemos a importar el archivo .svg como un componente de React
import LogoSvg from "@/../public/brand/logo.svg";

type LogoProps = React.ComponentProps<"svg"> & {
  className?: string;
};

export function Logo({ className, ...props }: LogoProps) {
  // Simplemente renderizamos el componente importado, pasándole las props
  return (
    <LogoSvg
      className={
        className ?? "h-10 w-auto text-[--fg-light] dark:text-[--fg-dark]"
      }
      {...props}
    />
  );
}
