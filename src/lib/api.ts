import axios from "axios";
import { env } from "@/env";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

// Cliente principal
const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

// Cliente limpio SIN interceptores para el refresh
const refreshApi = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Si no hay response o no hay status → error desconocido
    if (!error.response) {
      return Promise.reject(error);
    }

    // Evitar bucles: no interceptar login ni refresh
    const isAuthEndpoint =
      original.url?.includes("/auth/login/web") ||
      original.url?.includes("/auth/refresh/web");
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Manejar 401 → intentar refresh SOLO una vez
    if (error.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshRes = await refreshApi.post("/auth/refresh/web");
        const newToken = refreshRes.data.accessToken;

        const store = useAuthStore.getState();
        if (store.user) {
          store.setAuth(store.user, newToken);
        }

        // reintentar con el nuevo token
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // refresh falló → cerrar sesión
        useAuthStore.getState().logout();
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
