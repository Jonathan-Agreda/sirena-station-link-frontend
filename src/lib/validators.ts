import { z } from "zod";

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1, "El usuario o email es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const FirstPasswordSchema = z.object({
  usernameOrEmail: z.string(),
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "La contraseña actual no puede estar vacía"),
    newPassword: z
      .string()
      .min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const UpdateContactSchema = z.object({
  email: z.string().email("Email no válido").optional().or(z.literal("")),
  cedula: z
    .string()
    .length(10, "La cédula debe tener 10 dígitos")
    .optional()
    .or(z.literal("")),
  celular: z
    .string()
    .length(10, "El celular debe tener 10 dígitos")
    .optional()
    .or(z.literal("")),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Por favor, ingresa un correo electrónico válido."),
});
