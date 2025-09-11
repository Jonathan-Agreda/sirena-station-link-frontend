// src/components/superadmin/hooks/useSuperAdminMutations.ts
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSuperAdminStore } from "@/store/superadmin";
import {
  sa_createUrbanizacion,
  sa_updateUrbanizacion,
  sa_deleteUrbanizacion,
  sa_createSiren,
  sa_updateSiren,
  sa_deleteSiren,
} from "@/services/superadmin";
import type { Urbanizacion, Siren } from "@/types/superadmin";
import type { UrbanizacionFormValues } from "../modals/UrbanizacionForm";
import type { SirenFormValues } from "../modals/SirenForm";
import { errMsg } from "../utils";

export function useSuperAdminMutations(toasts: {
  success: (msg: string) => void;
  error: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const { setSelectedUrbanizacionId } = useSuperAdminStore();

  // Estados de los modales
  const [openCreate, setOpenCreate] = useState(false);
  const [toEdit, setToEdit] = useState<Urbanizacion | null>(null);
  const [toDelete, setToDelete] = useState<Urbanizacion | null>(null);
  const [openCreateSiren, setOpenCreateSiren] = useState(false);
  const [toEditSiren, setToEditSiren] = useState<Siren | null>(null);
  const [toDeleteSiren, setToDeleteSiren] = useState<Siren | null>(null);

  // Mutaciones de Urbanizaciones
  const createMut = useMutation({
    mutationFn: (v: UrbanizacionFormValues) => sa_createUrbanizacion(v),
    onSuccess: (created) => {
      toasts.success(`Urbanización "${created.name}" creada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
      setSelectedUrbanizacionId(created.id);
      setOpenCreate(false);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; data: UrbanizacionFormValues }) =>
      sa_updateUrbanizacion(vars.id, vars.data),
    onSuccess: (u) => {
      toasts.success(`Urbanización "${u.name}" actualizada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
      setToEdit(null);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => sa_deleteUrbanizacion(id),
    onSuccess: (res) => {
      toasts.success(`Urbanización eliminada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
      if (useSuperAdminStore.getState().selectedUrbanizacionId === res.id) {
        setSelectedUrbanizacionId("");
      }
      setToDelete(null);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  // Mutaciones de Sirenas
  const createSirenMut = useMutation({
    mutationFn: (v: SirenFormValues) => sa_createSiren(v),
    onSuccess: (created) => {
      toasts.success(`Sirena "${created.deviceId}" creada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
      setOpenCreateSiren(false);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const updateSirenMut = useMutation({
    mutationFn: (vars: { id: string; data: SirenFormValues }) =>
      sa_updateSiren(vars.id, vars.data),
    onSuccess: (u) => {
      toasts.success(`Sirena "${u.deviceId}" actualizada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
      setToEditSiren(null);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const deleteSirenMut = useMutation({
    mutationFn: (id: string) => sa_deleteSiren(id),
    onSuccess: () => {
      toasts.success("Sirena eliminada.");
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
      setToDeleteSiren(null);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  return {
    modals: {
      openCreate,
      toEdit,
      toDelete,
      openCreateSiren,
      toEditSiren,
      toDeleteSiren,
    },
    setters: {
      setOpenCreate,
      setToEdit,
      setToDelete,
      setOpenCreateSiren,
      setToEditSiren,
      setToDeleteSiren,
    },
    mutations: {
      createMut,
      updateMut,
      deleteMut,
      createSirenMut,
      updateSirenMut,
      deleteSirenMut,
    },
  };
}
