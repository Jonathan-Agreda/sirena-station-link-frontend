// src/app/superadmin/page.tsx
"use client";

import RoleGate from "@/components/RoleGate";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";

export default function SuperAdminPage() {
  return (
    <RoleGate allowed={["SUPERADMIN"]}>
      <div className="max-w-screen-2xl mx-auto px-3 lg:px-6 py-4 lg:py-6">
        <SuperAdminDashboard />
      </div>
    </RoleGate>
  );
}
