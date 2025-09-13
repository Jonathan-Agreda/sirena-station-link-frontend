import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@/types/superadmin";
import clsx from "clsx";

// Enum de roles válidos
const ROLES = ["SUPERADMIN", "ADMIN", "GUARDIA", "RESIDENTE"] as const;

// Esquema Zod alineado al modelo y reglas de negocio
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Email inválido"),
  username: z
    .string()
    .min(3, "Username requerido")
    .max(32, "Máximo 32 caracteres")
    .regex(
      /^[a-z0-9._-]+$/,
      "Solo minúsculas, números, punto, guión y guión bajo"
    ),
  role: z.enum(ROLES, { required_error: "El rol es requerido" }),
  firstName: z
    .string()
    .min(2, "Nombre muy corto")
    .max(60)
    .optional()
    .or(z.literal("")),
  lastName: z
    .string()
    .min(2, "Apellido muy corto")
    .max(60)
    .optional()
    .or(z.literal("")),
  cedula: z
    .string()
    .transform((val) => val?.trim() || undefined)
    .optional()
    .refine((val) => !val || val.length === 10, {
      message: "Cédula debe tener 10 dígitos",
    }),
  celular: z
    .string()
    .transform((val) => val?.trim() || undefined)
    .optional()
    .refine((val) => !val || val.length === 10, {
      message: "Celular debe tener 10 dígitos",
    }),
  etapa: z.string().max(32).optional().or(z.literal("")),
  manzana: z.string().max(32).optional().or(z.literal("")),
  villa: z.string().max(32).optional().or(z.literal("")),
  alicuota: z.boolean().default(true),
  sessionLimit: z.union([z.number().int().min(1).max(10), z.null()]).optional(),
  activo: z.boolean().default(true),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  initialData?: User | null;
  onClose: () => void;
  onSubmit: (data: UserFormValues) => Promise<void>;
  loading?: boolean;
  urbanizacionNombre?: string; // opcional, para mostrar el nombre
}

export const UserForm: React.FC<UserFormProps> = ({
  open,
  initialData,
  onClose,
  onSubmit,
  loading = false,
  urbanizacionNombre,
}) => {
  // Calcula el valor por defecto de sesiones según el rol
  const defaultSessions =
    initialData?.sessionLimit == null
      ? initialData?.role === "SUPERADMIN"
        ? 3
        : 1
      : initialData.sessionLimit;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    control,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData ?? {
      email: "",
      username: "",
      role: "RESIDENTE",
      firstName: "",
      lastName: "",
      cedula: "",
      celular: "",
      etapa: "",
      manzana: "",
      villa: "",
      alicuota: true,
      sessionLimit: undefined,
      activo: true,
    },
    mode: "onBlur",
  });

  React.useEffect(() => {
    if (open) {
      reset(
        initialData ?? {
          email: "",
          username: "",
          role: "RESIDENTE",
          firstName: "",
          lastName: "",
          cedula: "",
          celular: "",
          etapa: "",
          manzana: "",
          villa: "",
          alicuota: true,
          sessionLimit: undefined,
          activo: true,
        }
      );
    }
  }, [open, initialData, reset]);

  // Para mostrar el valor por defecto de sesiones si es null
  const sessionLimitValue = watch("sessionLimit");
  const roleValue = watch("role");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 w-full max-w-md"
        autoComplete="off"
      >
        <h2 className="text-xl font-semibold mb-4">
          {initialData ? "Editar Usuario" : "Crear Usuario"}
        </h2>

        {/* Urbanización (solo lectura) */}
        {urbanizacionNombre && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Urbanización</label>
            <input
              type="text"
              value={urbanizacionNombre}
              disabled
              className="w-full px-3 py-2 rounded border bg-zinc-100 dark:bg-zinc-800 text-neutral-500"
            />
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={clsx(
              "w-full px-3 py-2 rounded border outline-none",
              "bg-zinc-100 dark:bg-zinc-800",
              errors.email
                ? "border-red-500"
                : "border-zinc-300 dark:border-zinc-700"
            )}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            {...register("username")}
            className={clsx(
              "w-full px-3 py-2 rounded border outline-none",
              "bg-zinc-100 dark:bg-zinc-800",
              errors.username
                ? "border-red-500"
                : "border-zinc-300 dark:border-zinc-700",
              !!initialData && "cursor-not-allowed"
            )}
            disabled={loading || !!initialData}
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Rol */}
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="role">
            Rol
          </label>
          <select
            id="role"
            {...register("role")}
            className={clsx(
              "w-full px-3 py-2 rounded border outline-none cursor-pointer",
              "bg-zinc-100 dark:bg-zinc-800",
              errors.role
                ? "border-red-500"
                : "border-zinc-300 dark:border-zinc-700"
            )}
            disabled={loading}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
          )}
        </div>

        {/* Nombre y Apellido */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <label className="block mb-1 font-medium" htmlFor="firstName">
              Nombre{" "}
              <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <input
              id="firstName"
              type="text"
              {...register("firstName")}
              className={clsx(
                "w-full px-3 py-2 rounded border outline-none",
                "bg-zinc-100 dark:bg-zinc-800",
                errors.firstName
                  ? "border-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
              disabled={loading}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium" htmlFor="lastName">
              Apellido{" "}
              <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <input
              id="lastName"
              type="text"
              {...register("lastName")}
              className={clsx(
                "w-full px-3 py-2 rounded border outline-none",
                "bg-zinc-100 dark:bg-zinc-800",
                errors.lastName
                  ? "border-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
              disabled={loading}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Cedula y Celular */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <label className="block mb-1 font-medium" htmlFor="cedula">
              Cédula{" "}
              <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <input
              id="cedula"
              type="text"
              {...register("cedula")}
              className={clsx(
                "w-full px-3 py-2 rounded border outline-none",
                "bg-zinc-100 dark:bg-zinc-800",
                errors.cedula
                  ? "border-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
              disabled={loading}
            />
            {errors.cedula && (
              <p className="text-red-500 text-xs mt-1">
                {errors.cedula.message}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium" htmlFor="celular">
              Celular{" "}
              <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <input
              id="celular"
              type="text"
              {...register("celular")}
              className={clsx(
                "w-full px-3 py-2 rounded border outline-none",
                "bg-zinc-100 dark:bg-zinc-800",
                errors.celular
                  ? "border-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
              disabled={loading}
            />
            {errors.celular && (
              <p className="text-red-500 text-xs mt-1">
                {errors.celular.message}
              </p>
            )}
          </div>
        </div>

        {/* Etapa, Manzana, Villa */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1">
            <label className="block mb-1 font-medium" htmlFor="etapa">
              Etapa <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <input
              id="etapa"
              type="text"
              {...register("etapa")}
              className={clsx(
                "w-full px-3 py-2 rounded border outline-none",
                "bg-zinc-100 dark:bg-zinc-800",
                errors.etapa
                  ? "border-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
              disabled={loading}
            />
            {errors.etapa && (
              <p className="text-red-500 text-xs mt-1">
                {errors.etapa.message}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium" htmlFor="manzana">
              Manzana{" "}
              <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <input
              id="manzana"
              type="text"
              {...register("manzana")}
              className={clsx(
                "w-full px-3 py-2 rounded border outline-none",
                "bg-zinc-100 dark:bg-zinc-800",
                errors.manzana
                  ? "border-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
              disabled={loading}
            />
            {errors.manzana && (
              <p className="text-red-500 text-xs mt-1">
                {errors.manzana.message}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium" htmlFor="villa">
              Villa <span className="text-xs text-neutral-400">(opcional)</span>
            </label>
            <input
              id="villa"
              type="text"
              {...register("villa")}
              className={clsx(
                "w-full px-3 py-2 rounded border outline-none",
                "bg-zinc-100 dark:bg-zinc-800",
                errors.villa
                  ? "border-red-500"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
              disabled={loading}
            />
            {errors.villa && (
              <p className="text-red-500 text-xs mt-1">
                {errors.villa.message}
              </p>
            )}
          </div>
        </div>

        {/* Alícuota y SessionLimit */}
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("alicuota")}
              className="cursor-pointer"
              disabled={loading}
            />
            <span className="font-medium select-none">Alícuota activa</span>
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="sessionLimit" className="font-medium">
              Sesiones
            </label>
            <Controller
              name="sessionLimit"
              control={control}
              render={({ field }) => (
                <input
                  id="sessionLimit"
                  type="number"
                  min={1}
                  max={10}
                  {...field}
                  value={field.value ?? ""}
                  className={clsx(
                    "w-16 px-2 py-1 rounded border outline-none",
                    "bg-zinc-100 dark:bg-zinc-800",
                    errors.sessionLimit
                      ? "border-red-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  )}
                  disabled={loading}
                  placeholder={
                    sessionLimitValue == null
                      ? roleValue === "SUPERADMIN"
                        ? "3"
                        : "1"
                      : undefined
                  }
                />
              )}
            />
            <span className="ml-2 text-xs text-neutral-400">
              {sessionLimitValue == null
                ? `Por defecto: ${roleValue === "SUPERADMIN" ? 3 : 1}`
                : ""}
            </span>
            {errors.sessionLimit && (
              <p className="text-red-500 text-xs mt-1">
                {errors.sessionLimit.message}
              </p>
            )}
          </div>
        </div>

        {/* Activo */}
        <div className="mb-4 flex items-center gap-2">
          <input
            id="activo"
            type="checkbox"
            {...register("activo")}
            className="cursor-pointer"
            disabled={loading}
          />
          <label htmlFor="activo" className="font-medium select-none">
            Usuario activo
          </label>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={clsx(
              "px-4 py-2 rounded bg-[var(--brand-primary)] text-white font-semibold transition cursor-pointer",
              loading
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-[color-mix(in_oklab,var(--brand-primary),white_10%)] dark:hover:bg-[color-mix(in_oklab,var(--brand-primary),black_10%)]"
            )}
            disabled={loading || !isDirty}
          >
            {loading
              ? "Guardando..."
              : initialData
              ? "Guardar cambios"
              : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
