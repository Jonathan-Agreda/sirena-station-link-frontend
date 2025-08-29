"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";

type Props = {
  allowed: string[];
  redirect?: string;
  children: ReactNode;
};

export default function RoleGate({
  allowed,
  redirect = "/login",
  children,
}: Props) {
  const { isAuthenticated, profile } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!profile) {
      // todavía no hay datos cargados → esperamos
      return;
    }

    if (!isAuthenticated) {
      router.replace(redirect);
      return;
    }

    const hasRole = (profile?.roles || []).some((r) => allowed.includes(r));
    if (!hasRole) {
      if ((profile?.roles || []).includes("RESIDENTE")) {
        router.replace("/resident");
      } else {
        router.replace("/dashboard");
      }
      return;
    }

    setChecked(true);
  }, [isAuthenticated, profile, allowed, router, redirect]);

  if (!checked) {
    // Pantalla completa con skeleton shimmer
    return (
      <section className="min-h-[calc(100dvh-8rem)] container-max grid gap-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
        <Skeleton className="h-28 w-full" />
      </section>
    );
  }

  return <>{children}</>;
}
