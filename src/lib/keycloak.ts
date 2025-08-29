import Keycloak from "keycloak-js";
import { env } from "@/env";

// ⚠️ Solo inicializar en cliente (Next.js SSR podría romper si no lo validamos)
const keycloak =
  typeof window !== "undefined"
    ? new Keycloak({
        url: env.KC_BASE, // Ej: http://localhost:8080
        realm: env.KC_REALM, // Ej: alarma
        clientId: env.KC_CLIENT_ID, // Ej: frontend-spa
      })
    : ({} as Keycloak); // placeholder vacío en SSR

export default keycloak;
