// src/services/superadmin.ts
import api from "@/lib/api";
import type {
  Urbanizacion,
  Siren,
  User,
  Assignment,
  ActiveSession,
} from "@/types/superadmin";

/* ------------------ Tipos y helpers seguros ------------------ */

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Objeto “abierto” de respuesta de API
type ApiObj = Record<string, unknown>;

const isObj = (v: unknown): v is ApiObj => typeof v === "object" && v !== null;
const asObj = (v: unknown): ApiObj => (isObj(v) ? v : {});

// Devuelve el primer valor definido entre varias claves
function pick(o: ApiObj, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

const toStr = (v: unknown, fallback = ""): string =>
  v == null ? fallback : String(v);

const toNum = (v: unknown, fallback = 0): number => {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Number(v) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
};

const toBool = (v: unknown, fallback = false): boolean =>
  v == null ? fallback : Boolean(v);

const toOnOff = (v: unknown, fallback: "ON" | "OFF" = "OFF"): "ON" | "OFF" => {
  const s = String(v ?? "").toUpperCase();
  return s === "ON" ? "ON" : s === "OFF" ? "OFF" : fallback;
};

/* ------------------ utils ------------------ */
function normalizeList<T>(data: unknown, fallbackPageSize = 50): Paginated<T> {
  if (Array.isArray(data)) {
    const items = data as unknown[] as T[];
    const size = items.length || fallbackPageSize;
    return { items, total: items.length, page: 1, pageSize: size };
  }

  const obj = asObj(data);
  const rawItems = (obj.items ?? obj.data ?? obj.rows) as unknown;
  const items: T[] = Array.isArray(rawItems) ? (rawItems as T[]) : [];

  const total =
    typeof obj.total === "number"
      ? obj.total
      : typeof obj.count === "number"
      ? (obj.count as number)
      : items.length;

  const limit =
    typeof obj.pageSize === "number"
      ? (obj.pageSize as number)
      : typeof obj.limit === "number"
      ? (obj.limit as number)
      : items.length || fallbackPageSize;

  const page =
    typeof obj.page === "number"
      ? (obj.page as number)
      : typeof obj.offset === "number"
      ? Math.floor((obj.offset as number) / (limit || fallbackPageSize)) + 1
      : 1;

  const pageSize = limit || fallbackPageSize;

  return { items, total, page, pageSize };
}

/* ------------------ mappers ------------------ */

function mapUrbanization(x: ApiObj): Urbanizacion {
  return {
    id: toStr(pick(x, "id")),
    name: toStr(pick(x, "name", "nombre"), ""),
    maxUsers: toNum(pick(x, "maxUsers", "max_users"), 0),
    createdAt: toStr(
      pick(x, "createdAt", "created_at"),
      new Date().toISOString()
    ),
    updatedAt: toStr(
      pick(x, "updatedAt", "updated_at"),
      new Date().toISOString()
    ),
  };
}

function mapUser(x: ApiObj): User {
  const first = toStr(pick(x, "firstName"), "").trim();
  const last = toStr(pick(x, "lastName"), "").trim();
  const full = [first, last].filter(Boolean).join(" ").trim();

  const role = toStr(pick(x, "role"), "RESIDENTE") as User["role"];
  const rawLimit = pick(x, "sessionLimit");
  const sessionLimit =
    rawLimit === null || rawLimit === undefined ? null : toNum(rawLimit);

  const sessions =
    sessionLimit === null
      ? role === "SUPERADMIN"
        ? 3
        : 1
      : Number(sessionLimit);

  const kc = pick(x, "keycloakId");

  const urb = pick(x, "urbanizationId");

  return {
    id: toStr(pick(x, "id")),
    keycloakId: kc != null ? toStr(kc) : null,
    name: full || toStr(pick(x, "username"), ""),
    email: toStr(pick(x, "email"), ""),
    username: toStr(pick(x, "username"), ""),
    role,
    alicuota: toBool(pick(x, "alicuota"), true),
    urbanizacionId: urb != null ? toStr(urb) : null,
    createdAt: toStr(
      pick(x, "createdAt", "created_at"),
      new Date().toISOString()
    ),
    sessionLimit,
    sessions,
  };
}

function mapSiren(x: ApiObj): Siren {
  const urb = pick(
    x,
    "urbanizationId",
    "urbanizacionId",
    "urbanization_id",
    "urbanizacion_id"
  );
  const ip = pick(x, "ip");
  const last = pick(x, "lastSeen", "updatedAt");

  return {
    id: toStr(pick(x, "id")),
    deviceId: toStr(pick(x, "deviceId", "device_id"), ""),
    alias: toStr(pick(x, "deviceId", "device_id"), ""),
    urbanizacionId: urb != null ? toStr(urb) : null,
    online: toBool(pick(x, "online"), false),
    relay: toOnOff(pick(x, "relay"), "OFF"),
    siren: toOnOff(pick(x, "sirenState", "relay"), "OFF"),
    ip: typeof ip === "string" ? ip : null,
    lastSeenAt:
      typeof last === "string"
        ? last
        : last instanceof Date
        ? last.toISOString()
        : null,
  };
}

function mapAssignment(x: ApiObj): Assignment {
  return {
    id: toStr(pick(x, "id")),
    userId: toStr(pick(x, "userId", "user_id"), ""),
    sirenId: toStr(pick(x, "sirenId", "siren_id"), ""),
    createdAt: toStr(
      pick(x, "createdAt", "created_at"),
      new Date().toISOString()
    ),
  };
}

function mapActiveSession(x: ApiObj): ActiveSession {
  return {
    id: toStr(pick(x, "id")),
    userId: toStr(pick(x, "userId"), ""),
    username: toStr(pick(x, "username"), ""),
    ipAddress: (() => {
      const v = pick(x, "ipAddress");
      return typeof v === "string" ? v : null;
    })(),
    start: toNum(pick(x, "start"), 0),
    lastAccess: toNum(pick(x, "lastAccess"), 0),
    clients: (pick(x, "clients") as Record<string, string> | null) ?? null,
  };
}

/* ------------------ URBANIZACIONES ------------------ */

export async function sa_listUrbanizaciones(): Promise<
  Paginated<Urbanizacion>
> {
  const { data } = await api.get("/urbanizations");
  const normalized = normalizeList<unknown>(data, 50);
  return {
    ...normalized,
    items: normalized.items.map((i) => mapUrbanization(asObj(i))),
  };
}

/* ------------------ USUARIOS por urbanización ------------------ */

export async function sa_listUsersByUrbanizacion(
  urbanizacionId: string,
  _params?: { q?: string; page?: number; pageSize?: number }
): Promise<Paginated<User>> {
  const { data } = await api.get("/users");
  const normalized = normalizeList<unknown>(data, 50);
  const mapped = normalized.items.map((i) => mapUser(asObj(i)));
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

/* ------------------ SIRENAS por urbanización ------------------ */

export async function sa_listSirensByUrbanizacion(
  urbanizacionId: string,
  _params?: { q?: string; page?: number; pageSize?: number }
): Promise<Paginated<Siren>> {
  const { data } = await api.get("/sirens");
  const normalized = normalizeList<unknown>(data, 50);
  const mapped = normalized.items.map((i) => mapSiren(asObj(i)));
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

/* -------- ASIGNACIONES (agregador con endpoints existentes) -------- */

export async function sa_listAssignmentsByUrbanizacion(
  urbanizacionId: string,
  _params?: { page?: number; pageSize?: number }
): Promise<Paginated<Assignment>> {
  const [{ items: users }, { items: sirens }] = await Promise.all([
    sa_listUsersByUrbanizacion(urbanizacionId),
    sa_listSirensByUrbanizacion(urbanizacionId),
  ]);

  const results: unknown[] = [];

  async function fetchByUsers() {
    const limit = 8;
    const queue = users.map((u) => u.id);
    async function worker() {
      while (queue.length) {
        const userId = queue.shift()!;
        try {
          const { data } = await api.get(`/assignments/user/${userId}`);
          if (Array.isArray(data)) results.push(...(data as unknown[]));
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
          if (Array.isArray(data)) results.push(...(data as unknown[]));
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
    const a = mapAssignment(asObj(raw));
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

/* ------------------ SESIONES ACTIVAS por urbanización ------------------ */

export async function sa_listActiveSessionsByUrbanizacion(
  urbanizacionId: string
): Promise<Paginated<ActiveSession>> {
  const { items: users } = await sa_listUsersByUrbanizacion(urbanizacionId);
  if (!users.length) return { items: [], total: 0, page: 1, pageSize: 50 };

  const results: unknown[] = [];
  const limit = 8;
  const queue = users.map((u) => u.id);

  async function worker() {
    while (queue.length) {
      const userId = queue.shift()!;
      try {
        const { data } = await api.get(`/users/${userId}/sessions`);
        if (Array.isArray(data)) results.push(...(data as unknown[]));
      } catch {
        // ignoramos error individual
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, users.length) }, worker)
  );

  const mapped = results.map((r) => mapActiveSession(asObj(r)));
  return {
    items: mapped,
    total: mapped.length,
    page: 1,
    pageSize: mapped.length || 50,
  };
}
