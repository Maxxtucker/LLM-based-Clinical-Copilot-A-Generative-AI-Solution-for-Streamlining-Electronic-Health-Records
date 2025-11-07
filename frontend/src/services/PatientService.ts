// services/PatientService.ts
import { Patient } from "../entities/Patient";

export async function listPatients(sortBy: string): Promise<Patient[]> {
  const res = await fetch(`/api/patients?sort=${sortBy}`);
  if (!res.ok) throw new Error("Failed to fetch patients");
  return res.json();
}
