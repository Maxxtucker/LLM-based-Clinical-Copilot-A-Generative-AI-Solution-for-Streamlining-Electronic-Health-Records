// src/services/PatientService.js
const BASE = "/api/patients";

async function listPatients(sortBy) {
  const q = sortBy ? `?sort=${encodeURIComponent(sortBy)}` : "";
  const res = await fetch(`${BASE}${q}`);
  if (!res.ok) throw new Error("Failed to fetch patients");
  return res.json(); // snake_case objects
}

export default { listPatients };
