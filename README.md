# Sirena Station Link - Frontend

Este repositorio contiene el **frontend web** del sistema **Sirena Station Link**, desarrollado con **Next.js 14**, **TailwindCSS v4**, **Zustand**, **TanStack Query**, **React Hook Form** y **Zod**.

---

## 🚀 Stack principal
- **Next.js 14** (framework React con SSR/SSG)
- **TailwindCSS v4** (estilos utilitarios modernos)
- **Zustand** (state management)
- **TanStack Query** (fetch y cache de datos)
- **React Hook Form + Zod** (formularios con validación)
- **Socket.IO Client** (estado en tiempo real)
- **Leaflet** (mapas interactivos)
- **Shadcn/ui** (opcional para UI components)

---

## 📂 Estructura principal

```
frontend/
 ├─ public/          # Recursos estáticos (favicon, logos)
 ├─ src/
 │   ├─ app/         # Rutas Next.js (app router)
 │   ├─ components/  # Componentes UI reutilizables
 │   ├─ services/    # Consumo de API y Keycloak
 │   ├─ store/       # Zustand stores
 │   ├─ hook/        # Hooks personalizados
 │   ├─ env.ts       # Variables de entorno tipadas
 │   └─ styles/      # Estilos globales
 ├─ package.json
 └─ README.md
```

---

## ⚙️ Variables de entorno

Ejemplo de `.env.local`:

```dotenv
# --- API --- 
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# --- Keycloak ---
NEXT_PUBLIC_KEYCLOAK_BASE_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=alarma
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=frontend-spa

# --- Branding ---
NEXT_PUBLIC_APP_NAME=SirenaStationLink
NEXT_PUBLIC_SLOGAN=Alerta comunitaria al instante
NEXT_PUBLIC_DEVELOPER_NAME=Ing. Jonathan Agreda, MSc.
NEXT_PUBLIC_COMPANY_NAME=Enterpriselink
NEXT_PUBLIC_COMPANY_URL=https://enterpriselink.example

# --- Paleta de colores ---
NEXT_PUBLIC_BRAND_PRIMARY=#D7263D
NEXT_PUBLIC_BRAND_PRIMARY_FG=#ffffff
NEXT_PUBLIC_BRAND_BG_LIGHT=#F8FAFC
NEXT_PUBLIC_BRAND_FG_LIGHT=#0F172A
NEXT_PUBLIC_BRAND_BG_DARK=#0B1220
NEXT_PUBLIC_BRAND_FG_DARK=#E2E8F0
NEXT_PUBLIC_BRAND_ACCENT=#2563EB
NEXT_PUBLIC_BRAND_SUCCESS=#22C55E
NEXT_PUBLIC_BRAND_WARNING=#F59E0B
NEXT_PUBLIC_BRAND_DANGER=#EF4444

# --- Configuración de Sirena ---
NEXT_PUBLIC_SIRENA_AUTO_OFF=30000
```

> ⚠️ En producción, recuerda configurar correctamente `NEXT_PUBLIC_API_URL` apuntando al backend expuesto en tu VPS/servidor.

---

## ▶️ Ejecutar en desarrollo

```bash
# Instalar dependencias
npm install

# Levantar servidor de desarrollo
npm run dev
```

El frontend corre en: **http://localhost:3000**

---

## 📦 Build de producción

```bash
npm run build
npm run start
```

---

## 🌐 Integración
- Autenticación mediante **Keycloak** (realm `alarma`)
- Consumo de API en `http://localhost:4000/api`
- Comunicación en tiempo real vía **Socket.IO** con backend
- Mapas interactivos con Leaflet

---
