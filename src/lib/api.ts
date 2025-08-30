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

// 👉 Adjunta Authorization en cada request si hay token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!error.response) return Promise.reject(error);

    const isAuth =
      original?.url?.includes("/auth/login/web") ||
      original?.url?.includes("/auth/refresh/web");
    if (isAuth) return Promise.reject(error);

    if (error.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const r = await refreshApi.post("/auth/refresh/web");
        const newToken = r.data?.accessToken;

        const store = useAuthStore.getState();
        if (store.user) store.setAuth(store.user, newToken);
        else store.setAccessToken(newToken);

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
