import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

type MeResponse = {
  sub: string;
  email?: string;
  username: string;
  roles: string[];
};

// ------------------ LOGIN ------------------
export async function loginWeb(usernameOrEmail: string, password: string) {
  const res = await api.post("/auth/login/web", { usernameOrEmail, password });
  const { user, accessToken } = res.data;

  useAuthStore.getState().setAuth(user, accessToken);
  return res.data;
}

// ------------------ LOGOUT ------------------
export async function logoutWeb() {
  try {
    await api.post("/auth/logout/web");
  } finally {
    useAuthStore.getState().logout();
  }
}

// ------------------ PROFILE (me) ------------------
export async function fetchMe(): Promise<MeResponse> {
  const store = useAuthStore.getState();
  if (!store.accessToken) throw new Error("No token disponible");

  const res = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${store.accessToken}` },
  });
  return res.data;
}
