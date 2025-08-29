export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  KC_BASE: process.env.NEXT_PUBLIC_KEYCLOAK_BASE_URL || "http://localhost:8080",
  KC_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "alarma",
  KC_CLIENT_ID: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "frontend-spa",

  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "SirenaStationLink",
  SLOGAN: process.env.NEXT_PUBLIC_SLOGAN || "Alerta comunitaria al instante",
  DEVELOPER_NAME:
    process.env.NEXT_PUBLIC_DEVELOPER_NAME || "Ing. Jonathan Agreda, MSc.",
  COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME || "Enterpriselink",
  COMPANY_URL: process.env.NEXT_PUBLIC_COMPANY_URL || "#",

  BRAND_PRIMARY: process.env.NEXT_PUBLIC_BRAND_PRIMARY || "#D7263D",
  BRAND_PRIMARY_FG: process.env.NEXT_PUBLIC_BRAND_PRIMARY_FG || "#ffffff",
  BG_LIGHT: process.env.NEXT_PUBLIC_BRAND_BG_LIGHT || "#F8FAFC",
  FG_LIGHT: process.env.NEXT_PUBLIC_BRAND_FG_LIGHT || "#0F172A",
  BG_DARK: process.env.NEXT_PUBLIC_BRAND_BG_DARK || "#0B1220",
  FG_DARK: process.env.NEXT_PUBLIC_BRAND_FG_DARK || "#E2E8F0",
  ACCENT: process.env.NEXT_PUBLIC_BRAND_ACCENT || "#2563EB",
  SUCCESS: process.env.NEXT_PUBLIC_BRAND_SUCCESS || "#22C55E",
  WARNING: process.env.NEXT_PUBLIC_BRAND_WARNING || "#F59E0B",
  DANGER: process.env.NEXT_PUBLIC_BRAND_DANGER || "#EF4444",
} as const;
