import axios from "axios";
import { env } from "@/env";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

const refreshApi = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

// CAMBIO: Se simplifica el interceptor para asignar el header de forma segura
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    // Esta es la forma correcta y type-safe de añadir el header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 👉 Interceptor de respuestas (SIN CAMBIOS, ya estaba correcto)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      original?.url?.includes("/auth/login/web") ||
      original?.url?.includes("/auth/refresh/web") ||
      original?.url?.includes("/auth/prelogin");

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const r = await refreshApi.post("/auth/refresh/web");
        const newToken = r.data?.accessToken;

        const store = useAuthStore.getState();
        if (store.user) {
          store.setAuth(store.user, newToken);
        } else {
          store.setAccessToken(newToken);
        }

        original.headers = original.headers ?? {};
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      } catch {
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
