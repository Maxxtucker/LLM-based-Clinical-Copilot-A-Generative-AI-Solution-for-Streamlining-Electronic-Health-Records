// pages/EditDetails.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { createPageUrl } from "../utils";
import { Activity, User, Clipboard } from "lucide-react";
import ConfirmDialog from "../components/ui/confirmdialog";


export default function EditDetails() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { id: patientId } = useParams();

  const loadPatient = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();
      setPatient({ ...data, id: data._id });
    } catch (err) {
      console.error("Failed to load patient", err);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId, loadPatient]);

  const handleChange = (field, value) => {
    setPatient((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setPatient((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!patient.first_name?.trim() || !patient.last_name?.trim()) {
      alert("First Name and Last Name are required.");
      return;
    }
    setShowConfirm(true);
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patient),
      });
      if (!res.ok) throw new Error("Failed to save patient");

      navigate(createPageUrl("PatientDetail") + `?id=${patient.id}`);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  };

  if (!patient) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold mb-2">Update Patient Details:</h1>
      <hr className="border-gray-300" />

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        Basic Information:
        </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label className="font-medium text-gray-700">Medical Record Number</Label>
          <Input
            value={patient.medical_record_number || ""}
            disabled
            className="mt-1 bg-gray-200 cursor-not-allowed"
            placeholder="Medical Record Number"
          />
        </div>

        <div>
          <Label className="font-medium text-gray-700">First Name</Label>
          <Input
            value={patient.first_name || ""}
            disabled
            className="mt-1 bg-gray-200 cursor-not-allowed"
            placeholder="First Name"
          />
        </div>
        <div>
          <Label className="font-medium text-gray-700">Last Name</Label>
          <Input
            value={patient.last_name || ""}
            disabled
            className="mt-1 bg-gray-200 cursor-not-allowed"
            placeholder="Last Name"
          />
        </div>
        <div>
          <Label className="font-medium text-gray-700">Gender</Label>
          <Input
            value={patient.gender || ""}
            onChange={(e) => handleChange("gender", e.target.value)}
            className="mt-1"
            placeholder="Gender"
          />
        </div>
        <div>
          <Label className="font-medium text-gray-700">Date of Birth</Label>
          <Input
            type="date"
            value={patient.date_of_birth?.slice(0, 10) || ""}
            onChange={(e) => handleChange("date_of_birth", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="font-medium text-gray-700">Phone</Label>
          <Input
            value={patient.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="mt-1"
            placeholder="Phone Number"
          />
        </div>
        <div>
          <Label className="font-medium text-gray-700">Email</Label>
          <Input
            type="email"
            value={patient.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className="mt-1"
            placeholder="Email Address"
          />
        </div>
        <div className="md:col-span-2">
          <Label className="font-medium text-gray-700">Address</Label>
          <Input
            value={patient.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            className="mt-1"
            placeholder="Address"
          />
        </div>
      </div>

      <hr className="border-gray-300" />

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clipboard className="w-5 h-5 text-emerald-600" />
        Medical Information:
        </h2>


      <div className="grid grid-cols-1 gap-6">
        {[
          "chief_complaint",
          "medical_history",
          "current_medications",
          "allergies",
          "symptoms",
          "diagnosis",
          "treatment_plan",
        ].map((field) => (
          <div key={field}>
            <Label className="font-medium text-gray-700">
              {field
                .split("_")
                .map((w) => w[0].toUpperCase() + w.slice(1))
                .join(" ")}
            </Label>
            <Input
              value={patient[field] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              className="mt-1 placeholder:italic placeholder:text-gray-500"
              placeholder={
                patient[field]?.trim()
                  ? field
                      .split("_")
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" ")
                  : "Pending doctor's input"
              }
            />
          </div>
        ))}
      </div>

      <hr className="border-gray-300" />
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-orange-600" />
        Vital Signs:
        </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label className="font-medium text-gray-700">Blood Pressure</Label>
          <Input
            value={patient.vital_signs?.blood_pressure || ""}
            onChange={(e) => handleNestedChange("vital_signs", "blood_pressure", e.target.value)}
            className="mt-1"
            placeholder="e.g. 120/80"
          />
        </div>
        <div>
          <Label className="font-medium text-gray-700">Heart Rate</Label>
          <Input
            value={patient.vital_signs?.heart_rate || ""}
            onChange={(e) => handleNestedChange("vital_signs", "heart_rate", e.target.value)}
            className="mt-1"
            placeholder="bpm"
          />
        </div>
        <div>
          <Label className="font-medium text-gray-700">Temperature</Label>
          <Input
            value={patient.vital_signs?.temperature || ""}
            onChange={(e) => handleNestedChange("vital_signs", "temperature", e.target.value)}
            className="mt-1"
            placeholder="°F or °C"
          />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <Button disabled={isSaving} onClick={handleSave}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="Confirm Save"
        description={
        <>
            Are you sure you want to save changes for{" "}
            <strong>
            {patient.first_name} {patient.last_name}
            </strong>{" "}
            (<strong>MRN: {patient.medical_record_number || "N/A"}</strong>)?
        </>
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={performSave}
      />
    </div>
  );
}
