// src/services/superadmin.ts
import api from "@/lib/api";
import type {
  Urbanizacion,
  Siren,
  User,
  Assignment,
  ActiveSession,
  UrbanizationBulkImportResult,
  UrbanizationBulkDeleteResult,
  SirenBulkImportResult,
  SirenBulkDeleteResult,
} from "@/types/superadmin";

/* ------------------ Tipos y helpers seguros ------------------ */

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type ApiObj = Record<string, unknown>;
const isObj = (v: unknown): v is ApiObj => typeof v === "object" && v !== null;
const asObj = (v: unknown): ApiObj => (isObj(v) ? v : {});

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
    const items = data as T[];
    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length || fallbackPageSize,
    };
  }

  const obj = asObj(data);
  const rawItems = (obj.items ?? obj.data ?? obj.rows) as unknown;
  const items: T[] = Array.isArray(rawItems) ? (rawItems as T[]) : [];

  const total = toNum(pick(obj, "total", "count"), items.length);
  const limit = toNum(
    pick(obj, "pageSize", "limit"),
    items.length || fallbackPageSize
  );
  const page = toNum(pick(obj, "page"), 1);

  return { items, total, page, pageSize: limit };
}

/* ------------------ mappers ------------------ */

function mapUrbanization(x: ApiObj): Urbanizacion {
  return {
    id: toStr(pick(x, "id")),
    name: toStr(pick(x, "name", "nombre")),
    maxUsers: toNum(pick(x, "maxUsers", "max_users")),
    createdAt: toStr(pick(x, "createdAt", "created_at")),
    updatedAt: toStr(pick(x, "updatedAt", "updated_at")),
  };
}

function mapUser(x: ApiObj): User {
  const first = toStr(pick(x, "firstName"));
  const last = toStr(pick(x, "lastName"));
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
    name: full || toStr(pick(x, "username")),
    email: toStr(pick(x, "email")),
    username: toStr(pick(x, "username")),
    role,
    alicuota: toBool(pick(x, "alicuota"), true),
    urbanizacionId: urb != null ? toStr(urb) : null,
    createdAt: toStr(pick(x, "createdAt", "created_at")),
    sessionLimit,
    sessions,
  };
}

function mapSiren(x: ApiObj): Siren {
  const urb = pick(x, "urbanizationId", "urbanizacionId");
  return {
    id: toStr(pick(x, "id")),
    deviceId: toStr(pick(x, "deviceId")),
    alias: toStr(pick(x, "deviceId")),
    urbanizacionId: urb != null ? toStr(urb) : null,
    online: toBool(pick(x, "online")),
    relay: toOnOff(pick(x, "relay")),
    siren: toOnOff(pick(x, "sirenState")),
    ip: typeof pick(x, "ip") === "string" ? (pick(x, "ip") as string) : null,
    lat: toNum(pick(x, "lat")),
    lng: toNum(pick(x, "lng")),
    lastSeenAt: toStr(pick(x, "lastSeen", "updatedAt")),
    apiKey: toStr(pick(x, "apiKey")),
  };
}

function mapAssignment(x: ApiObj): Assignment {
  return {
    id: toStr(pick(x, "id")),
    userId: toStr(pick(x, "userId", "user_id")),
    sirenId: toStr(pick(x, "sirenId", "siren_id")),
    createdAt: toStr(pick(x, "createdAt", "created_at")),
  };
}

function mapActiveSession(x: ApiObj): ActiveSession {
  return {
    id: toStr(pick(x, "id")),
    userId: toStr(pick(x, "userId")),
    username: toStr(pick(x, "username")),
    ipAddress:
      typeof pick(x, "ipAddress") === "string"
        ? (pick(x, "ipAddress") as string)
        : null,
    start: toNum(pick(x, "start")),
    lastAccess: toNum(pick(x, "lastAccess")),
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
  urbanizacionId: string
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
  urbanizacionId: string
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

/* -------- ASIGNACIONES -------- */

export async function sa_listAssignmentsByUrbanizacion(
  urbanizacionId: string
): Promise<Paginated<Assignment>> {
  const [{ items: users }, { items: sirens }] = await Promise.all([
    sa_listUsersByUrbanizacion(urbanizacionId),
    sa_listSirensByUrbanizacion(urbanizacionId),
  ]);

  const results: unknown[] = [];

  async function fetchByUsers() {
    for (const u of users) {
      try {
        const { data } = await api.get(`/assignments/user/${u.id}`);
        if (Array.isArray(data)) results.push(...(data as unknown[]));
      } catch {}
    }
  }

  async function fetchBySirens() {
    for (const s of sirens) {
      try {
        const { data } = await api.get(`/assignments/siren/${s.id}`);
        if (Array.isArray(data)) results.push(...(data as unknown[]));
      } catch {}
    }
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

/* ------------------ SESIONES ------------------ */

export async function sa_listActiveSessionsByUrbanizacion(
  urbanizacionId: string
): Promise<Paginated<ActiveSession>> {
  const { items: users } = await sa_listUsersByUrbanizacion(urbanizacionId);
  if (!users.length) return { items: [], total: 0, page: 1, pageSize: 50 };

  const results: unknown[] = [];
  for (const u of users) {
    try {
      const { data } = await api.get(`/users/${u.id}/sessions`);
      if (Array.isArray(data)) results.push(...(data as unknown[]));
    } catch {}
  }

  const mapped = results.map((r) => mapActiveSession(asObj(r)));
  return {
    items: mapped,
    total: mapped.length,
    page: 1,
    pageSize: mapped.length || 50,
  };
}

/* ------------------ CRUD Urbanizaciones ------------------ */

export async function sa_createUrbanizacion(input: {
  name: string;
  maxUsers?: number;
}): Promise<Urbanizacion> {
  const { data } = await api.post("/urbanizations", input);
  return mapUrbanization(data);
}

export async function sa_updateUrbanizacion(
  id: string,
  input: { name?: string; maxUsers?: number }
): Promise<Urbanizacion> {
  const { data } = await api.put(`/urbanizations/${id}`, input);
  return mapUrbanization(data);
}

export async function sa_deleteUrbanizacion(
  id: string
): Promise<{ id: string }> {
  const { data } = await api.delete(`/urbanizations/${id}`);
  return { id: String(data?.id ?? id) };
}

/* ------------------ BULK Urbanizaciones ------------------ */

export async function sa_bulkImportUrbanizaciones(
  file: File,
  dryRun = true
): Promise<UrbanizationBulkImportResult> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post(
    `/urbanizations/bulk/import?dryRun=${dryRun}`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data as UrbanizationBulkImportResult;
}

export async function sa_bulkDeleteUrbanizaciones(
  file: File
): Promise<UrbanizationBulkDeleteResult> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post(`/urbanizations/bulk/delete`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as UrbanizationBulkDeleteResult;
}

export async function sa_downloadUrbanizacionesTemplate(): Promise<Blob> {
  const { data } = await api.get(`/urbanizations/bulk/template`, {
    responseType: "blob",
  });
  return data as Blob;
}

/* ------------------ CRUD Sirenas ------------------ */

export async function sa_createSiren(input: {
  deviceId: string;
  apiKey: string;
  urbanizationId: string;
  lat?: number;
  lng?: number;
}): Promise<Siren> {
  const { data } = await api.post("/sirens", input);
  return mapSiren(data);
}

export async function sa_updateSiren(
  id: string,
  input: Partial<{
    deviceId: string;
    apiKey: string;
    lat: number;
    lng: number;
    urbanizationId: string;
  }>
): Promise<Siren> {
  const { data } = await api.put(`/sirens/${id}`, input);
  return mapSiren(data);
}

export async function sa_deleteSiren(id: string): Promise<{ id: string }> {
  const { data } = await api.delete(`/sirens/${id}`);
  return { id: String(data?.id ?? id) };
}

/* ------------------ BULK Sirenas ------------------ */

export async function sa_bulkImportSirens(
  file: File,
  dryRun = true
): Promise<SirenBulkImportResult> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post(`/sirens/bulk/import?dryRun=${dryRun}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as SirenBulkImportResult;
}

export async function sa_bulkDeleteSirens(
  file: File
): Promise<SirenBulkDeleteResult> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post(`/sirens/bulk/delete`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as SirenBulkDeleteResult;
}

export async function sa_downloadSirensTemplate(): Promise<Blob> {
  const { data } = await api.get(`/sirens/bulk/template`, {
    responseType: "blob",
  });
  return data as Blob;
}
