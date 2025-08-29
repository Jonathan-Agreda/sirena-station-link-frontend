import Keycloak from "keycloak-js";
import { env } from "@/env";

export const keycloak = new Keycloak({
  url: env.KC_BASE,
  realm: env.KC_REALM,
  clientId: env.KC_CLIENT_ID,
});

export default keycloak;
