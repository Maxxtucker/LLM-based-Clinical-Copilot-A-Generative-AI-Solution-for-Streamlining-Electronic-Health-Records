import { Patient } from "../entities/Patient";

interface PaginatedResponse {
  items: Patient[];
  total: number;
  page: number;
  pages: number;
}

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

  const res = await fetch(`/api/patients?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch patients");

  const data = await res.json();

  const items: Patient[] = Array.isArray(data) ? data : (data.items ?? []);
  const total: number = Array.isArray(data) ? data.length : (data.total ?? items.length);
  const currentPage: number = Array.isArray(data) ? 1 : (data.page ?? 1);
  const pages: number = Array.isArray(data) ? 1 : (data.pages ?? 1);

  return { items, total, page: currentPage, pages };
}
