// src/services/superadmin.ts
import api from "@/lib/api";
import type {
  Urbanizacion,
  Siren,
  User,
  Assignment,
  ActiveSession,
} from "@/types/superadmin";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// ---------- utils ----------
function normalizeList<T>(data: any, fallbackPageSize = 50): Paginated<T> {
  if (Array.isArray(data)) {
    const size = data.length || fallbackPageSize;
    return { items: data as T[], total: data.length, page: 1, pageSize: size };
  }
  const items: T[] = data?.items ?? data?.data ?? data?.rows ?? [];
  const total: number = data?.total ?? data?.count ?? items.length ?? 0;
  const page: number =
    data?.page ??
    (typeof data?.offset === "number"
      ? Math.floor(data.offset / (data?.limit || fallbackPageSize)) + 1
      : 1);
  const pageSize: number =
    data?.pageSize ?? data?.limit ?? items.length ?? fallbackPageSize;

  return { items, total, page, pageSize };
}

// ---------- mappers ----------
function mapUrbanization(x: any): Urbanizacion {
  return {
    id: String(x.id),
    name: String(x.name ?? x.nombre ?? ""),
    maxUsers: Number(x.maxUsers ?? x.max_users ?? 0),
    createdAt: String(x.createdAt ?? x.created_at ?? new Date().toISOString()),
    updatedAt: String(x.updatedAt ?? x.updated_at ?? new Date().toISOString()),
  };
}

function mapUser(x: any): User {
  const first = (x.firstName ?? "").toString().trim();
  const last = (x.lastName ?? "").toString().trim();
  const full = [first, last].filter(Boolean).join(" ").trim();

  const role = String(x.role ?? "RESIDENTE") as User["role"];
  const sessionLimit =
    x.sessionLimit === null || x.sessionLimit === undefined
      ? null
      : Number(x.sessionLimit);

  // 👇 regla pedida: por defecto 3 para SUPERADMIN; 1 para los demás
  const sessions =
    sessionLimit === null
      ? role === "SUPERADMIN"
        ? 3
        : 1
      : Number(sessionLimit);

  return {
    id: String(x.id),
    keycloakId: x.keycloakId ? String(x.keycloakId) : null,
    name: full || String(x.username ?? ""),
    email: String(x.email ?? ""),
    username: String(x.username ?? ""),
    role,
    alicuota: Boolean(x.alicuota ?? true),
    urbanizacionId: x.urbanizationId ? String(x.urbanizationId) : null,
    createdAt: String(x.createdAt ?? x.created_at ?? new Date().toISOString()),
    sessionLimit,
    sessions,
  };
}

function mapSiren(x: any): Siren {
  return {
    id: String(x.id),
    deviceId: String(x.deviceId ?? x.device_id ?? ""),
    alias: String(x.deviceId ?? x.device_id ?? ""),
    urbanizacionId:
      (x.urbanizationId ??
        x.urbanizacionId ??
        x.urbanization_id ??
        x.urbanizacion_id ??
        null) &&
      String(
        x.urbanizationId ??
          x.urbanizacionId ??
          x.urbanization_id ??
          x.urbanizacion_id
      ),
    online: Boolean(x.online),
    relay: (x.relay ?? "OFF") as "ON" | "OFF",
    siren: (x.sirenState ?? x.relay ?? "OFF") as "ON" | "OFF",
    ip: x.ip ?? null,
    lastSeenAt: x.lastSeen ?? x.updatedAt ?? null,
  };
}

function mapAssignment(x: any): Assignment {
  return {
    id: String(x.id),
    userId: String(x.userId ?? x.user_id ?? ""),
    sirenId: String(x.sirenId ?? x.siren_id ?? ""),
    createdAt: String(x.createdAt ?? x.created_at ?? new Date().toISOString()),
  };
}

function mapActiveSession(x: any): ActiveSession {
  return {
    id: String(x.id),
    userId: String(x.userId ?? ""),
    username: String(x.username ?? ""),
    ipAddress: x.ipAddress ? String(x.ipAddress) : null,
    start: Number(x.start ?? 0),
    lastAccess: Number(x.lastAccess ?? 0),
    clients: x.clients ?? null,
  };
}

// ---------- URBANIZACIONES ----------
export async function sa_listUrbanizaciones(): Promise<
  Paginated<Urbanizacion>
> {
  const { data } = await api.get("/urbanizations");
  const normalized = normalizeList<any>(data, 50);
  return { ...normalized, items: normalized.items.map(mapUrbanization) };
}

// ---------- USUARIOS por urbanización ----------
export async function sa_listUsersByUrbanizacion(
  urbanizacionId: string,
  _params?: { q?: string; page?: number; pageSize?: number }
): Promise<Paginated<User>> {
  const { data } = await api.get("/users");
  const normalized = normalizeList<any>(data, 50);
  const mapped = normalized.items.map(mapUser);
  const filtered = mapped.filter(
    (u) => (u.urbanizacionId ?? "").toString() === urbanizacionId.toString()
  );
  return {
    items: filtered,
    total: filtered.length,
    page: 1,
    pageSize: filtered.length || 50,
  };
}

// ---------- SIRENAS por urbanización ----------
export async function sa_listSirensByUrbanizacion(
  urbanizacionId: string,
  _params?: { q?: string; page?: number; pageSize?: number }
): Promise<Paginated<Siren>> {
  const { data } = await api.get("/sirens");
  const normalized = normalizeList<any>(data, 50);
  const mapped = normalized.items.map(mapSiren);
  const filtered = mapped.filter(
    (s) => (s.urbanizacionId ?? "").toString() === urbanizacionId.toString()
  );
  return {
    items: filtered,
    total: filtered.length,
    page: 1,
    pageSize: filtered.length || 50,
  };
}

// ---------- ASIGNACIONES (agregador con endpoints existentes) ----------
export async function sa_listAssignmentsByUrbanizacion(
  urbanizacionId: string,
  _params?: { page?: number; pageSize?: number }
): Promise<Paginated<Assignment>> {
  const [{ items: users }, { items: sirens }] = await Promise.all([
    sa_listUsersByUrbanizacion(urbanizacionId),
    sa_listSirensByUrbanizacion(urbanizacionId),
  ]);

  const results: any[] = [];

  async function fetchByUsers() {
    const limit = 8;
    const queue = users.map((u) => u.id);
    async function worker() {
      while (queue.length) {
        const userId = queue.shift()!;
        try {
          const { data } = await api.get(`/assignments/user/${userId}`);
          if (Array.isArray(data)) results.push(...data);
        } catch {}
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(limit, users.length) }, worker)
    );
  }

  async function fetchBySirens() {
    const limit = 8;
    const queue = sirens.map((s) => s.id);
    async function worker() {
      while (queue.length) {
        const sirenId = queue.shift()!;
        try {
          const { data } = await api.get(`/assignments/siren/${sirenId}`);
          if (Array.isArray(data)) results.push(...data);
        } catch {}
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(limit, sirens.length) }, worker)
    );
  }

  if (users.length > 0) await fetchByUsers();
  else if (sirens.length > 0) await fetchBySirens();

  const seen = new Set<string>();
  const mapped: Assignment[] = [];
  for (const raw of results) {
    const a = mapAssignment(raw);
    if (!seen.has(a.id)) {
      seen.add(a.id);
      mapped.push(a);
    }
  }

  return {
    items: mapped,
    total: mapped.length,
    page: 1,
    pageSize: mapped.length || 100,
  };
}

// ---------- SESIONES ACTIVAS por urbanización ----------
export async function sa_listActiveSessionsByUrbanizacion(
  urbanizacionId: string
): Promise<Paginated<ActiveSession>> {
  const { items: users } = await sa_listUsersByUrbanizacion(urbanizacionId);
  if (!users.length) return { items: [], total: 0, page: 1, pageSize: 50 };

  const results: any[] = [];
  const limit = 8;
  const queue = users.map((u) => u.id);

  async function worker() {
    while (queue.length) {
      const userId = queue.shift()!;
      try {
        const { data } = await api.get(`/users/${userId}/sessions`);
        if (Array.isArray(data)) results.push(...data);
      } catch {
        // ignoramos error individual
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, users.length) }, worker)
  );

  const mapped = results.map(mapActiveSession);
  return {
    items: mapped,
    total: mapped.length,
    page: 1,
    pageSize: mapped.length || 50,
  };
}
