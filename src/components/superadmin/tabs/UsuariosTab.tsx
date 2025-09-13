"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search, Users, Trash2, Pencil } from "lucide-react";
import { useSuperAdminStore } from "@/store/superadmin";
import { sa_listUsersByUrbanizacion, Paginated } from "@/services/superadmin";
import type { User } from "@/types/superadmin";
import CardShell from "../CardShell";
import UserForm, { UserFormValues } from "../modals/UserForm";
import { useSuperAdminMutations } from "../hooks/useSuperAdminMutations";
import { useMiniToasts } from "../hooks/useMiniToasts";
import ConfirmDialog from "../modals/ConfirmDialog";

export default function UsuariosTab() {
  const { selectedUrbanizacionId } = useSuperAdminStore();
  const [q, setQ] = useState("");

  // Estado para modal y usuario seleccionado
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Estado para eliminar usuario
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toasts consistentes con SirenasTab
  const toasts = useMiniToasts();

  // Mutaciones centralizadas
  const { userMutations } = useSuperAdminMutations({
    success: (msg) => toasts.success(msg),
    error: (msg) => toasts.error(msg),
  });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["sa", "users", selectedUrbanizacionId],
    queryFn: () =>
      selectedUrbanizacionId
        ? sa_listUsersByUrbanizacion(selectedUrbanizacionId)
        : Promise.resolve({
            items: [],
            total: 0,
            page: 1,
            pageSize: 50,
          } as Paginated<User>),
    enabled: !!selectedUrbanizacionId,
    refetchOnMount: "always",
  });

  const loading = isLoading || isFetching || !selectedUrbanizacionId;
  const items = data?.items ?? [];

  const users = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((u) =>
      [
        u.name,
        u.username,
        u.email,
        u.role,
        u.id,
        u.cedula,
        u.celular,
        u.etapa,
        u.manzana,
        u.villa,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [items, q]);

  // Handler para abrir modal en modo creación
  const handleNewUser = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  // Handler para abrir modal en modo edición
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  // Handler para cerrar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  // Handler para submit (creación o edición)
  const handleSubmit = async (data: UserFormValues) => {
    try {
      if (selectedUser) {
        await userMutations.updateUserMut.mutateAsync({
          id: selectedUser.id,
          data,
        });
      } else {
        await userMutations.createUserMut.mutateAsync({
          ...data,
          urbanizationId: selectedUrbanizacionId!,
        });
      }
      handleCloseModal();
      refetch();
    } catch {
      // El toast de error ya lo maneja la mutación
    }
  };

  // Handler para eliminar usuario
  const handleDeleteUser = (user: User) => setToDelete(user);

  const confirmDeleteUser = async () => {
    if (!toDelete) return;
    setDeleteLoading(true);
    try {
      await userMutations.deleteUserMut.mutateAsync(toDelete.id);
      toasts.success(`Usuario "${toDelete.username}" eliminado.`);
      setToDelete(null);
      refetch();
    } catch (e) {
      toasts.error("No se pudo eliminar el usuario.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <CardShell>
      {toasts.container}
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <Users className="size-4" /> Usuarios
        </h3>
        <button
          onClick={handleNewUser}
          className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[var(--brand-primary)] text-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-[color-mix(in_oklab,var(--brand-primary),white_10%)] dark:hover:bg-[color-mix(in_oklab,var(--brand-primary),black_10%)] transition-colors cursor-pointer"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="relative mt-3">
        <Search className="absolute left-3 top-2.5 size-4 text-neutral-400 dark:text-neutral-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, usuario, email, cédula, celular, etapa, manzana, villa o ID…"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 pl-9 pr-3 py-2 text-sm outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {loading && (
        <div className="mt-4 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      )}
      {!loading && isError && (
        <div className="mt-4 text-sm text-red-600 dark:text-red-400">
          Error al cargar usuarios.
        </div>
      )}

      {!loading && !isError && users.length === 0 && (
        <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          Sin coincidencias.
        </div>
      )}

      {!loading && !isError && users.length > 0 && (
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {users.map((u) => (
            <li key={u.id} className="py-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {u.name || u.username}
                </div>
                <div className="text-xs flex flex-wrap items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Mail className="size-3" />
                  <span className="truncate">{u.email}</span>
                  <span>· @{u.username}</span>
                  <span>· rol {u.role}</span>
                  {u.cedula && <span>· cédula {u.cedula}</span>}
                  {u.celular && <span>· cel {u.celular}</span>}
                  {u.etapa && <span>· etapa {u.etapa}</span>}
                  {u.manzana && <span>· mz {u.manzana}</span>}
                  {u.villa && <span>· villa {u.villa}</span>}
                  <span>· alícuota {u.alicuota ? "✓" : "✕"}</span>
                  <span>· sesiones {u.sessions}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditUser(u)}
                  className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(u)}
                  className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de usuario */}
      <UserForm
        open={modalOpen}
        initialData={selectedUser}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        loading={
          userMutations.createUserMut.isPending ||
          userMutations.updateUserMut.isPending
        }
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar usuario"
        message={
          <>
            ¿Seguro que deseas eliminar al usuario{" "}
            <span className="font-semibold">{toDelete?.username}</span>?<br />
            Esta acción no se puede deshacer.
          </>
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={deleteLoading}
        onConfirm={confirmDeleteUser}
        onClose={() => !deleteLoading && setToDelete(null)}
      />
    </CardShell>
  );
}
