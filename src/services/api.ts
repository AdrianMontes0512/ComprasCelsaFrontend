/* ============================================================
   COMPRAS CELSA — API client
   Lee VITE_API_BASE en build-time. Default: localhost:8080 (dev).
   Producción: se define en .env.production.
   Normaliza campos backend (sp → tipo, etc.)
   ============================================================ */
import axios from "axios";

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/* ---------- AUTH ---------- */
export interface LoginResponse {
  token: string;
  id: number;
  role: string;
  firstname: string;
  lastname: string;
  email?: string;
  area?: string;
}

export const apiLogin = async (username: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
};

export const apiVerifyToken = async (token: string) => {
  const { data } = await api.post("/auth/verify-token", { token });
  return data;
};

/* ---------- USERS ---------- */
const userCache: Record<number, { firstname:string; lastname:string }> = {};

export const apiGetUser = async (id: number) => {
  if (userCache[id]) return userCache[id];
  try {
    const { data } = await api.get(`/user/${id}`);
    userCache[id] = { firstname: data.firstname, lastname: data.lastname };
    return userCache[id];
  } catch {
    return { firstname: "Desconocido", lastname: "" };
  }
};

/* ---------- AREAS ---------- */
export const apiGetAreas = async (): Promise<string[]> => {
  const { data } = await api.get("/areas/all");
  return Array.isArray(data) ? data : [];
};

/* ---------- SOLICITUDES ---------- */
export interface BackendSolicitud {
  id: number;
  prioridad: string;
  sp: string;
  descripcion: string;
  maquina?: string;
  motivo?: string;
  familia?: string;
  subFamilia?: string;
  cantidad: number | string;
  umedida: string;
  precio: number | string;
  moneda: string;
  estado: string;
  ordenCompra?: string | null;
  usuarioId: number;
  fecha?: string | null;
  fechaOrden?: string | null;
  fechaAprobacion?: string | null;
  comentarios?: string | null;
  createdAt?: string | null;
  approvedAt?: string | null;
  ocAssignedAt?: string | null;
  tiempoAprobacionHoras?: number | null;
  tiempoOCHoras?: number | null;
}

export interface NormalizedSolicitud {
  id: number;
  prioridad: string;
  tipo: string;
  descripcion: string;
  maquina: string;
  motivo: string;
  familia: string;
  subFamilia: string;
  cantidad: number;
  umedida: string;
  precio: number;
  moneda: string;
  estado: string;
  ordenCompra: string;
  usuarioId: number;
  usuario: string;
  area: string;
  fecha: string;
  fechaOrden: string;
  fechaAprobacion: string;
  comentarios: string;
  tieneImagen: boolean;
  createdAt: string;
  approvedAt: string;
  ocAssignedAt: string;
  tiempoAprobacionHoras: number | null;
  tiempoOCHoras: number | null;
}

const normalize = (s: BackendSolicitud, usuario = "Cargando…", area = ""): NormalizedSolicitud => ({
  id: s.id,
  prioridad: s.prioridad,
  tipo: s.sp,
  descripcion: s.descripcion || "",
  maquina: s.maquina || "—",
  motivo: s.motivo || "",
  familia: s.familia || "",
  subFamilia: s.subFamilia || "",
  cantidad: Number(s.cantidad) || 0,
  umedida: s.umedida || "",
  precio: Number(s.precio) || 0,
  moneda: s.moneda || "",
  estado: s.estado || "Pendiente",
  ordenCompra: s.ordenCompra || "",
  usuarioId: s.usuarioId,
  usuario,
  area,
  fecha: s.fecha || "",
  fechaOrden: s.fechaOrden || "",
  fechaAprobacion: s.fechaAprobacion || "",
  comentarios: s.comentarios || "",
  createdAt: s.createdAt || "",
  approvedAt: s.approvedAt || "",
  ocAssignedAt: s.ocAssignedAt || "",
  tiempoAprobacionHoras: s.tiempoAprobacionHoras ?? null,
  tiempoOCHoras: s.tiempoOCHoras ?? null,
  tieneImagen: true,
});

interface Page<T> { content: T[]; totalPages: number; totalElements?: number; }

const loadWithUsers = async (raw: BackendSolicitud[]): Promise<NormalizedSolicitud[]> => {
  const uniq = Array.from(new Set(raw.map(r => r.usuarioId)));
  await Promise.all(uniq.map(id => apiGetUser(id)));
  return raw.map(r => {
    const u = userCache[r.usuarioId];
    return normalize(r, u ? `${u.firstname} ${u.lastname}` : "Desconocido");
  });
};

export interface SolicitudFilters {
  prioridad?: string;
  tipo?: string;       // backend lo recibe como `sp`
  estado?: string;
  idQuery?: string;
  usuarioQuery?: string;
  descripcionQuery?: string;
}

const buildFilterParams = (f: SolicitudFilters = {}): Record<string, string> => {
  const out: Record<string, string> = {};
  if (f.prioridad) out.prioridad = f.prioridad;
  if (f.tipo) out.sp = f.tipo;
  if (f.estado) out.estado = f.estado;
  if (f.idQuery) out.idQuery = f.idQuery.replace(/\D/g, "");
  if (f.usuarioQuery) out.usuarioQuery = f.usuarioQuery;
  if (f.descripcionQuery) out.descripcionQuery = f.descripcionQuery;
  return out;
};

export const apiGetSolicitudesCompras = async (page = 0, size = 14, filters: SolicitudFilters = {}) => {
  const params = { page: String(page), size: String(size), ...buildFilterParams(filters) };
  const { data } = await api.get<Page<BackendSolicitud>>(`/solicitudes`, { params });
  const rows = await loadWithUsers(data.content || []);
  return { rows, totalPages: data.totalPages || 1 };
};

export const apiGetSolicitudesJefe = async (page = 0, size = 14, filters: SolicitudFilters = {}) => {
  const params = { page: String(page), size: String(size), ...buildFilterParams(filters) };
  const { data } = await api.get<Page<BackendSolicitud>>(`/solicitudes/jefe`, { params });
  const rows = await loadWithUsers(data.content || []);
  return { rows, totalPages: data.totalPages || 1 };
};

export const apiGetSolicitudesUsuario = async (userId: number, page = 0, size = 12, filters: SolicitudFilters = {}) => {
  const params = { page: String(page), size: String(size), ...buildFilterParams(filters) };
  const { data } = await api.get<Page<BackendSolicitud>>(`/solicitudes/usuario/${userId}`, { params });
  const rows = (data.content || []).map(r => normalize(r));
  return { rows, totalPages: data.totalPages || 1 };
};

/* ---------- PATCH ---------- */
export const apiPatchSolicitud = async (id: number, fields: Partial<BackendSolicitud> & Record<string, any>) => {
  const payload: any = { ...fields };
  if (payload.tipo) { payload.sp = payload.tipo; delete payload.tipo; }
  const { data } = await api.patch(`/solicitudes/${id}`, payload);
  return data;
};

/* ---------- CREATE ---------- */
export const apiCreateSolicitud = async (payload: any) => {
  const body: any = { ...payload };
  if (body.tipo) { body.sp = body.tipo; delete body.tipo; }
  if (body.centroCostos) { body.centrocosto = body.centroCostos; delete body.centroCostos; }
  const { data } = await api.post(`/solicitudes`, body);
  return data;
};

/* ---------- IMAGE / ATTACHMENT ----------
   Infer the correct extension from the response headers so we
   support .png/.jpg/.pdf/.json/.zip/etc. without forcing .jpg.
*/
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
  "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg",
  "image/bmp": "bmp", "image/tiff": "tiff",
  "application/pdf": "pdf",
  "application/json": "json",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt", "text/csv": "csv", "text/html": "html",
  "application/octet-stream": "bin",
};

const filenameFromHeader = (cd?: string | null): string | null => {
  if (!cd) return null;
  // RFC 5987: filename*=UTF-8''encoded
  const m1 = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
  if (m1) try { return decodeURIComponent(m1[1].trim().replace(/['"]/g, "")); } catch { /* */ }
  const m2 = /filename="?([^";]+)"?/i.exec(cd);
  if (m2) return m2[1].trim();
  return null;
};

export const apiDownloadImagen = async (id: number) => {
  const res = await api.get(`/solicitudes/imagen/${id}`, { responseType: "blob" });
  const blob: Blob = res.data;
  const headerName = filenameFromHeader(res.headers["content-disposition"] || res.headers["Content-Disposition"]);
  const ct = (res.headers["content-type"] || res.headers["Content-Type"] || blob.type || "application/octet-stream").split(";")[0].trim();
  const ext = MIME_TO_EXT[ct] || (ct.split("/")[1] || "bin");
  const filename = headerName || `solicitud-${id}.${ext}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/* ---------- PASSWORD ---------- */
export const apiChangePassword = async (userId: number, currentPassword: string, newPassword: string) => {
  const { data } = await api.patch(`/user/${userId}/password`, { currentPassword, newPassword });
  return data;
};

/* ---------- ACTIVIDAD RECIENTE ---------- */
export interface ActividadItem {
  tipo: "creada" | "aprobada" | "rechazada" | "oc_asignada";
  solicitudId: number;
  descripcion: string;
  actor: string;
  estado: string;
  prioridad: string;
  ocurrioEn: string;
}

export const apiGetActividadReciente = async (limit = 10): Promise<ActividadItem[]> => {
  const { data } = await api.get<ActividadItem[]>(`/solicitudes/actividad-reciente?limit=${limit}`);
  return Array.isArray(data) ? data : [];
};
