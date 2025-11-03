// src/services/PatientService.ts
import { Patient } from "../entities/Patient";

/** ---------- Pagination ---------- */
export interface PaginatedResponse {
  items: Patient[];
  total: number;
  page: number;
  pages: number;
}

/** ---------- Config ---------- */
/** Same-origin backend. If your API is on another host/port, set it here. */
const API_BASE = ""; // e.g. "http://localhost:3000"

/** Small helper to parse JSON and surface backend error messages. */
async function parseJsonOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

/** ---------- Patients (existing) ---------- */
export async function listPatients(
  sortBy: string,
  q: string = "",
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  if (sortBy) params.set("sort", sortBy);
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const res = await fetch(`${API_BASE}/api/patients?${params.toString()}`, {
    credentials: "include",
  });
  const data = await parseJsonOrThrow(res);

  const items: Patient[] = Array.isArray(data) ? data : data.items ?? [];
  const total: number = Array.isArray(data) ? data.length : data.total ?? items.length;
  const currentPage: number = Array.isArray(data) ? 1 : data.page ?? 1;
  const pages: number = Array.isArray(data) ? 1 : data.pages ?? 1;

  return { items, total, page: currentPage, pages };
}

/** Optional helpers you may want */
// export async function getPatient(id: string): Promise<Patient> {
//   const res = await fetch(`${API_BASE}/api/patients/${id}`, { credentials: "include" });
//   return parseJsonOrThrow(res);
// }

/** ---------- Checkups (Vitals) ---------- */
export interface Checkup {
  _id: string;
  patient_id: string;
  date: string; // ISO
  nurse_id?: string;
  vitals: {
    bp_sys?: number;
    bp_dia?: number;
    heart_rate?: number;
    temperature_c?: number;
    weight?: number;
    height?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export async function createCheckup(
  patientId: string,
  payload: {
    date?: string | number | Date;
    nurse_id?: string;
    vitals: Checkup["vitals"];
  }
): Promise<Checkup> {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/checkups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const body = await parseJsonOrThrow(res);
  return body.checkup ?? body; // supports either { checkup } or direct doc
}

export async function getLatestCheckup(patientId: string): Promise<Checkup | null> {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/checkups/latest`, {
    credentials: "include",
  });
  const body = await parseJsonOrThrow(res);
  return body.latest ?? null;
}

export async function getCheckups(patientId: string, limit = 10): Promise<Checkup[]> {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/checkups?limit=${limit}`, {
    credentials: "include",
  });
  const body = await parseJsonOrThrow(res);
  return body.items ?? [];
}

/** ---------- Visits ---------- */
export interface Visit {
  _id: string;
  patient_id: string;
  visit_date: string; // ISO
  reason?: string;
  diagnosis?: string;
  treatment_plan?: string;
  checkup_id?: string; // if your backend links to latest vitals
  createdAt?: string;
  updatedAt?: string;
}

export async function createVisit(
  patientId: string,
  payload: Partial<Visit>
): Promise<Visit> {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const body = await parseJsonOrThrow(res);
  return body.visit ?? body;
}

export async function getLatestVisit(patientId: string): Promise<Visit | null> {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/visits/latest`, {
    credentials: "include",
  });
  const body = await parseJsonOrThrow(res);
  return body.latest ?? null;
}

export async function getVisits(patientId: string, limit = 10): Promise<Visit[]> {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/visits?limit=${limit}`, {
    credentials: "include",
  });
  const body = await parseJsonOrThrow(res);
  return body.items ?? [];
}
