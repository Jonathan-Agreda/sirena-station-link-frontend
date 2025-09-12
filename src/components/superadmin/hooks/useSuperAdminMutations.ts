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
  sa_listSirensByUrbanizacion,
  sa_listUsersByUrbanizacion,
} from "@/services/superadmin";
import type { Urbanizacion, Siren } from "@/types/superadmin";
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
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // Verificación antes de eliminar
  const startDelete = async (urbanizacion: Urbanizacion) => {
    try {
      const [sirens, users] = await Promise.all([
        sa_listSirensByUrbanizacion(urbanizacion.id),
        sa_listUsersByUrbanizacion(urbanizacion.id),
      ]);

      if (sirens.total > 0 || users.total > 0) {
        setDeleteWarning(
          `La urbanización "${urbanizacion.name}" no se puede eliminar porque tiene ${sirens.total} sirena(s) y ${users.total} usuario(s) asociados. Por favor, reasigna o elimina estas entidades primero.`
        );
      } else {
        setToDelete(urbanizacion);
      }
    } catch {
      toasts.error("No se pudo verificar el estado de la urbanización.");
    }
  };

  // Mutaciones de Urbanizaciones
  const createMut = useMutation({
    mutationFn: (v: Parameters<typeof sa_createUrbanizacion>[0]) =>
      sa_createUrbanizacion(v),
    onSuccess: (created) => {
      toasts.success(`Urbanización "${created.name}" creada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "urbanizations"] });
      setSelectedUrbanizacionId(created.id);
      setOpenCreate(false);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const updateMut = useMutation({
    mutationFn: (vars: {
      id: string;
      data: Parameters<typeof sa_updateUrbanizacion>[1];
    }) => sa_updateUrbanizacion(vars.id, vars.data),
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
    mutationFn: (v: Parameters<typeof sa_createSiren>[0]) => sa_createSiren(v),
    onSuccess: (created) => {
      toasts.success(`Sirena "${created.deviceId}" creada.`);
      queryClient.invalidateQueries({ queryKey: ["sa", "sirens"] });
      setOpenCreateSiren(false);
    },
    onError: (e) => toasts.error(errMsg(e)),
  });

  const updateSirenMut = useMutation({
    mutationFn: (vars: {
      id: string;
      data: Parameters<typeof sa_updateSiren>[1];
    }) => sa_updateSiren(vars.id, vars.data),
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
      deleteWarning,
    },
    setters: {
      setOpenCreate,
      setToEdit,
      setToDelete,
      setOpenCreateSiren,
      setToEditSiren,
      setToDeleteSiren,
      setDeleteWarning,
    },
    mutations: {
      createMut,
      updateMut,
      deleteMut,
      createSirenMut,
      updateSirenMut,
      deleteSirenMut,
    },
    actions: {
      startDelete,
    },
  };
}
