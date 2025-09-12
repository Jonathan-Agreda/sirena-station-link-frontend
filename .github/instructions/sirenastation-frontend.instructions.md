---
applyTo: "**"
---

# Proyecto: SirenaStationLink (Frontend)

## Stack del proyecto

- Framework: Next.js 14 (App Router, TypeScript)
- Estilos: TailwindCSS v4 con dark/light mode
- Estado global: Zustand
- Datos remotos: TanStack Query
- Formularios: React Hook Form + Zod
- Autenticación: Keycloak OIDC → consumo del backend NestJS
- Infraestructura: Docker Compose + Nginx en producción

## Contexto actual

- Ya está implementado el **SuperAdminDashboard** con CRUD de Urbanizaciones y Sirenas.
- Próxima tarea: implementar el **CRUD de Usuarios** (en el tab de administración).
- Este CRUD debe mantener consistencia visual y estructural con los anteriores.

## Estándares específicos

- **Tipado estricto**: no usar `any`.
- **Componentización**: separar en componentes (tabla, formulario modal, confirm dialogs).
- **React Query**: usar `useQuery` y `useMutation` con `placeholderData: keepPreviousData` para evitar errores de tipado.
- **Validaciones**: todos los formularios con Zod + React Hook Form.
- **UI**: usar exclusivamente TailwindCSS v4, respetando modo claro/oscuro.
- **UX**: incluir búsqueda, paginación y filtros igual que en Urbanizaciones y Sirenas.

## Estilo esperado de Copilot Chat

- Generar código alineado al stack y estándares.
- Explicar decisiones como un mentor senior.
- Comparar soluciones y recomendar la más escalable.
- Mantener consistencia con los CRUD ya existentes.
- Proveer ejemplos claros y concisos.
