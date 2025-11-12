//Currently used is frontend/src/modules/patients/components/forms/PatientForm.jsx
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

/** Base URL from .env (e.g. http://localhost:5001) — still used by your onSubmit in App.js */
const RAW_API = process.env.REACT_APP_API_BASE_URL || "";
const API = RAW_API.replace(/\/+$/, "");
const apiUrl = (path) => (path.startsWith("http") ? path : `${API}${path}`);

export default function PatientForm({
  onSubmit,                 // <- App.js provides this
  patientId,                // unused in nurse flow, but kept for compatibility
  defaultValues = {},
  isLoading = false,
  onCreatedPatient,         // optional legacy callbacks (safe to keep)
  onCreatedCheckup,         // optional legacy callbacks (safe to keep)
}) {
  const emptyForm = useMemo(
    () => ({
      first_name: defaultValues.first_name || "",
      last_name: defaultValues.last_name || "",
      medical_record_number: defaultValues.medical_record_number || "",
      date_of_birth: defaultValues.date_of_birth || "",
      gender: defaultValues.gender || "",
      phone: defaultValues.phone || "",
      email: defaultValues.email || "",
      address: defaultValues.address || "",
      vitals: { bp_sys: "", bp_dia: "", heart_rate: "", temperature_c: "", weight: "", height: "" },
    }),
    [defaultValues]
  );

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null); // { type: "success" | "error", msg: string }

  const setField  = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setVitals = (k, v) => setForm((f) => ({ ...f, vitals: { ...f.vitals, [k]: v } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner(null);
    setSubmitting(true);

    try {
      // delegate to App.js (it handles: find/create patient + create checkup if vitals present)
      await onSubmit?.(form);

      // success UX
      setBanner({ type: "success", msg: "Vitals saved successfully." });
      setForm(emptyForm);                 // reset to a clean form
      window.scrollTo({ top: 0, behavior: "smooth" });

      // auto-hide the banner after a few seconds
      setTimeout(() => setBanner(null), 3000);
    } catch (err) {
      console.error("[PatientForm] submit error:", err);
      setBanner({ type: "error", msg: err?.message || "Failed to save. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* banner */}
      {banner && (
        <div
          className={[
            "rounded-md p-3 text-sm",
            banner.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200",
          ].join(" ")}
        >
          {banner.msg}
        </div>
      )}

      {/* Basic info (nurse can paste/enter MRN to match an existing patient) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="border p-2 rounded"
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setField("first_name", e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setField("last_name", e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="MRN (or IC)"
          value={form.medical_record_number}
          onChange={(e) => setField("medical_record_number", e.target.value)}
        />
        <input
          className="border p-2 rounded"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => setField("date_of_birth", e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Gender"
          value={form.gender}
          onChange={(e) => setField("gender", e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setField("address", e.target.value)}
        />
      </div>

      {/* vitals */}
      <div className="rounded border bg-neutral-50 p-3">
        <div className="font-medium mb-2">Vital Signs</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Systolic"
            value={form.vitals.bp_sys}
            onChange={(e) => setVitals("bp_sys", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Diastolic"
            value={form.vitals.bp_dia}
            onChange={(e) => setVitals("bp_dia", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Heart rate (bpm)"
            value={form.vitals.heart_rate}
            onChange={(e) => setVitals("heart_rate", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Temperature °C"
            value={form.vitals.temperature_c}
            onChange={(e) => setVitals("temperature_c", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Weight kg"
            value={form.vitals.weight}
            onChange={(e) => setVitals("weight", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Height cm"
            value={form.vitals.height}
            onChange={(e) => setVitals("height", e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={disabled}>
        {disabled ? "Saving..." : "Save Patient / Vitals"}
      </Button>
    </form>
  );
}
