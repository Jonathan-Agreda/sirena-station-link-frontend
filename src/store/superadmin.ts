// src/store/superadmin.ts
import { create } from "zustand";

type SuperAdminState = {
  selectedUrbanizacionId: string | null;
  searchUrbanizacion: string;
};

type SuperAdminActions = {
  setSelectedUrbanizacionId: (id: string | null) => void;
  setSearchUrbanizacion: (q: string) => void;
};

export const useSuperAdminStore = create<SuperAdminState & SuperAdminActions>(
  (set) => ({
    selectedUrbanizacionId: null,
    searchUrbanizacion: "",
    setSelectedUrbanizacionId: (id) => set({ selectedUrbanizacionId: id }),
    setSearchUrbanizacion: (q) => set({ searchUrbanizacion: q }),
  })
);
