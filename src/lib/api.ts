import axios, { AxiosError, AxiosRequestHeaders } from "axios";
import { env } from "@/env";
import { useAuthStore } from "@/store/auth";

export const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

// Inyecta token en cada request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders;
  }
  return config;
});

// Manejo de errores globales
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const clear = useAuthStore.getState().clear;
      clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
