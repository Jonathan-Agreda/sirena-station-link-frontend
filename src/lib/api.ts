import axios from "axios";
import { env } from "@/env";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshRes = await api.post("/auth/refresh/web");
        const newToken = refreshRes.data.accessToken;

        const store = useAuthStore.getState();
        if (store.user) {
          store.setAuth(store.user, newToken);
        }

        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // Mostrar toast
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
