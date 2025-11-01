// src/pages/PatientDetail.jsx
// src/pages/PatientDetail.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Edit3, User, Calendar, Clipboard, Phone, Activity, Mail,
  MapPin, Ruler, Dumbbell, Save, X, Trash2, FileText, Stethoscope, Pill
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import ConfirmDialog from "../components/ui/confirmdialog";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { format } from "date-fns";

import SummaryGenerator from "../components/ai/SummaryGenerator";
import VoiceRecordingButton from "../components/speech/VoiceRecordingButton";

/* ---------- helpers ---------- */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try { return format(new Date(dateString), "dd MMM yyyy"); }
  catch { return "N/A"; }
}
function formatDateTime(dateStringOrNumber) {
  if (!dateStringOrNumber) return "N/A";
  try {
    const d = new Date(dateStringOrNumber);
    return `${format(d, "dd MMM yyyy")} @ ${format(d, "h:mm a")}`;
  } catch {
    return "N/A";
  }
}
function getVitalSignColor(type, value) {
  if (value === undefined || value === null || value === "") return "";
  if (type === "blood_pressure") {
    const [sys, dia] = String(value).split("/").map(Number);
    if (!Number.isFinite(sys) || !Number.isFinite(dia)) return "";
    if (sys < 120 && dia < 80) return "bg-green-50 text-green-600";
    if ((sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89)) return "bg-yellow-50 text-yellow-600";
    if (sys >= 140 || dia >= 90) return "bg-red-50 text-red-600";
    return "";
  }
  if (type === "heart_rate") {
    const hr = Number(value);
    if (!Number.isFinite(hr)) return "";
    if (hr >= 60 && hr <= 100) return "bg-green-50 text-green-600";
    if ((hr >= 50 && hr < 60) || (hr > 100 && hr <= 110)) return "bg-yellow-50 text-yellow-600";
    return "bg-red-50 text-red-600";
  }
  if (type === "temperature") {
    const t = Number(value);
    if (!Number.isFinite(t)) return "";
    if (t >= 36.1 && t <= 37.2) return "bg-green-50 text-green-600";
    if ((t >= 35.5 && t < 36.1) || (t > 37.2 && t <= 38)) return "bg-yellow-50 text-yellow-600";
    return "bg-red-50 text-red-600";
  }
  return "";
}
// extract just the text-* class from the bg/text pair
function textClassOnly(cls) {
  const m = (cls || "").match(/text-\S+/);
  return m ? m[0] : "";
}

/* ---------- component ---------- */
export default function PatientDetail() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteConfirm1, setShowDeleteConfirm1] = useState(false);
  const [showDeleteConfirm2, setShowDeleteConfirm2] = useState(false);

  // History states
  const [checkupHistory, setCheckupHistory] = useState([]); // vitals
  const [visitHistory, setVisitHistory] = useState([]);     // visits

  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get("id");

  const loadPatient = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error(`Failed to load patient (${res.status})`);
      const data = await res.json();
      setPatient({ ...data, id: data._id });
    } catch (error) {
      console.error("Error loading patient:", error);
      setPatient(null);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  async function refreshHistory(pid) {
    if (!pid) return;
    try {
      const res = await fetch(`/api/checkups/patient/${pid}`);
      if (!res.ok) throw new Error(`Failed to load vitals history (${res.status})`);
      const rows = await res.json();
      setCheckupHistory(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Error loading vitals history:", err);
      setCheckupHistory([]);
    }
  }
  async function refreshVisits(pid) {
    if (!pid) return;
    try {
      const res = await fetch(`/api/visits/patient/${pid}`);
      if (!res.ok) throw new Error(`Failed to load visits (${res.status})`);
      const rows = await res.json();
      setVisitHistory(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Error loading visit history:", err);
      setVisitHistory([]);
    }
  }

  useEffect(() => {
    if (patientId) {
      loadPatient();
      refreshHistory(patientId);
      refreshVisits(patientId);
    }
  }, [patientId, loadPatient]);

  const handleSummaryGenerated = async (summary) => {
    try {
      await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_summary: true, ai_summary_content: summary })
      });
      setPatient((prev) => ({ ...prev, ai_summary: true, ai_summary_content: summary }));
    } catch (e) {
      console.error("Failed updating summary", e);
    }
  };

  const handleConversationExtracted = async () => {
    try {
      const response = await fetch(`/api/patients/${patient._id}`);
      if (response.ok) {
        const updated = await response.json();
        setPatient({ ...updated, id: updated._id });
      }
      refreshHistory(patient._id);
      refreshVisits(patient._id);
    } catch (error) {
      console.error("Error refreshing after extraction:", error);
    }
  };

  const handleEditField = (field, value) => {
    setEditedFields((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditVitalSign = (vitalField, value) => {
    setEditedFields((prev) => ({
      ...prev,
      vital_signs: { ...prev.vital_signs, [vitalField]: value }
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const updatedVitals = { ...patient.vital_signs, ...editedFields.vital_signs };
      const updateData = { ...patient, ...editedFields, vital_signs: updatedVitals };
      const response = await fetch(`/api/patients/${patient._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        setPatient({ ...updatedPatient, id: updatedPatient._id });
        setEditedFields({});
        setIsEditing(false);
        refreshHistory(updatedPatient._id);
      } else {
        console.error("Failed to update patient data");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditedFields({});
    setIsEditing(false);
  };
  const handleDeletePatient = async () => {
    try {
      const response = await fetch(`/api/patients/${patient._id}`, { method: "DELETE" });
      if (response.ok) {
        navigate(createPageUrl("Dashboard"));
      } else {
        alert("Failed to delete patient. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("Error deleting patient. Please try again.");
    }
  };

  const renderInlineField = (field, label, placeholder = "Enter value") => {
    const currentValue = editedFields[field] !== undefined ? editedFields[field] : patient[field];
    return (
      <div className="flex items-center gap-2">
        <div>
          <p className="text-neutral-500">{label}</p>
          {isEditing ? (
            <input
              className="bg-neutral-50 p-2 rounded-lg w-full border border-neutral-200 text-sm"
              value={currentValue || ""}
              placeholder={placeholder}
              onChange={(e) => handleEditField(field, e.target.value)}
            />
          ) : (
            <p className="font-medium">{currentValue || "N/A"}</p>
          )}
        </div>
      </div>
    );
  };

  /* ---------- loading / not found ---------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-neutral-200 rounded-lg"></div>
                <div className="h-48 bg-neutral-200 rounded-lg"></div>
              </div>
              <div className="h-96 bg-neutral-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Patient Not Found</h2>
            <p className="text-neutral-600 mb-6">The patient you're looking for doesn't exist.</p>
            <Button onClick={() => navigate(createPageUrl("Dashboard"))}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="hover:bg-neutral-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-neutral-600 mt-1">MRN: {patient.medical_record_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit Patient
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm1(true)}
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Patient
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setShowConfirmDialog(true)} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Confirm Save modal */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold text-neutral-800 mb-2">Confirm Save</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Save changes to <strong>{patient.first_name} {patient.last_name}</strong> (MRN: <strong>{patient.medical_record_number}</strong>)?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                <Button onClick={() => { setShowConfirmDialog(false); handleSaveChanges(); }}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="w-5 h-5 text-blue-600" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-neutral-500">Date of Birth</p>
                        {isEditing ? (
                          <input
                            type="date"
                            className="bg-neutral-50 p-2 rounded-lg w-full border border-neutral-200 text-sm"
                            value={editedFields.date_of_birth || (patient.date_of_birth ? patient.date_of_birth.slice(0, 10) : "")}
                            onChange={(e) => handleEditField("date_of_birth", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium">{formatDate(patient.date_of_birth)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral-400" />
                      {renderInlineField("gender", "Gender")}
                    </div>

                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-neutral-500">Height (cm)</p>
                        {isEditing ? (
                          <input
                            className="bg-neutral-50 p-2 rounded-lg w-full border border-neutral-200 text-sm"
                            value={editedFields.vital_signs?.height || patient.vital_signs?.height || ""}
                            onChange={(e) => handleEditVitalSign("height", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium">{patient.vital_signs?.height ?? "N/A"}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-neutral-500">Weight (kg)</p>
                        {isEditing ? (
                          <input
                            className="bg-neutral-50 p-2 rounded-lg w-full border border-neutral-200 text-sm"
                            value={editedFields.vital_signs?.weight || patient.vital_signs?.weight || ""}
                            onChange={(e) => handleEditVitalSign("weight", e.target.value)}
                          />
                        ) : (
                          <p className="font-medium">{patient.vital_signs?.weight ?? "N/A"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      {renderInlineField("phone", "Phone")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      {renderInlineField("email", "Email")}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      {renderInlineField("address", "Address")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Medical Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <Card className="border-0 shadow-sm relative">
                <CardHeader className="pb-4 flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clipboard className="w-5 h-5 text-emerald-600" />
                    Medical Information
                  </CardTitle>
                  <div className="absolute top-4 right-4">
                    <VoiceRecordingButton
                      patientId={patient._id}
                      onProcessingComplete={handleConversationExtracted}
                      onError={(error) => console.error("Voice processing error:", error)}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Chief Complaint</h4>
                    {isEditing ? (
                      <Textarea
                        value={editedFields.chief_complaint ?? patient.chief_complaint ?? ""}
                        onChange={(e) => handleEditField("chief_complaint", e.target.value)}
                        className="bg-neutral-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                      />
                    ) : (
                      <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        {patient.chief_complaint || <span className="italic text-neutral-400">Pending</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Medical History</h4>
                    {isEditing ? (
                      <Textarea
                        value={editedFields.medical_history ?? patient.medical_history ?? ""}
                        onChange={(e) => handleEditField("medical_history", e.target.value)}
                        className="bg-neutral-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                      />
                    ) : (
                      <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        {patient.medical_history || <span className="italic text-neutral-400">Pending</span>}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Current Medications</h4>
                      {isEditing ? (
                        <Textarea
                          value={editedFields.current_medications ?? patient.current_medications ?? ""}
                          onChange={(e) => handleEditField("current_medications", e.target.value)}
                          className="bg-neutral-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                        />
                      ) : (
                        <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                          {patient.current_medications || <span className="italic text-neutral-400">None</span>}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Allergies</h4>
                      {isEditing ? (
                        <Textarea
                          value={editedFields.allergies ?? patient.allergies ?? ""}
                          onChange={(e) => handleEditField("allergies", e.target.value)}
                          className="bg-red-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                        />
                      ) : (
                        <p className="text-neutral-600 bg-red-50 p-3 rounded-lg">
                          {patient.allergies || <span className="italic text-neutral-400">No known allergies</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Current Symptoms</h4>
                    {isEditing ? (
                      <Textarea
                        value={editedFields.symptoms ?? patient.symptoms ?? ""}
                        onChange={(e) => handleEditField("symptoms", e.target.value)}
                        className="bg-neutral-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                      />
                    ) : (
                      <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        {patient.symptoms || <span className="italic text-neutral-400">Pending</span>}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Diagnosis</h4>
                      {isEditing ? (
                        <Textarea
                          value={editedFields.diagnosis ?? patient.diagnosis ?? ""}
                          onChange={(e) => handleEditField("diagnosis", e.target.value)}
                          className="bg-blue-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                        />
                      ) : (
                        <p className="text-neutral-600 bg-blue-50 p-3 rounded-lg">
                          {patient.diagnosis || <span className="italic text-neutral-400">Pending</span>}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Treatment Plan</h4>
                      {isEditing ? (
                        <Textarea
                          value={editedFields.treatment_plan ?? patient.treatment_plan ?? ""}
                          onChange={(e) => handleEditField("treatment_plan", e.target.value)}
                          className="bg-green-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                        />
                      ) : (
                        <p className="text-neutral-600 bg-green-50 p-3 rounded-lg">
                          {patient.treatment_plan || <span className="italic text-neutral-400">Pending</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vital Signs snapshot */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="w-5 h-5 text-orange-600" />
                    Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className={`text-center p-3 rounded-lg ${getVitalSignColor("blood_pressure", patient.vital_signs?.blood_pressure)}`}>
                      <p className="text-xs text-neutral-500 mb-1">Blood Pressure</p>
                      {isEditing ? (
                        <input
                          className="w-full text-center bg-white p-2 rounded-lg border"
                          value={editedFields.vital_signs?.blood_pressure || patient.vital_signs?.blood_pressure || ""}
                          placeholder="e.g. 118/76"
                          onChange={(e) => handleEditVitalSign("blood_pressure", e.target.value)}
                        />
                      ) : (
                        patient.vital_signs?.blood_pressure?.trim()
                          ? <p className="font-bold">{patient.vital_signs.blood_pressure}</p>
                          : <div className="border border-neutral-200 bg-white p-2 rounded-lg"><p className="text-sm text-neutral-400 italic">Pending</p></div>
                      )}
                    </div>

                    <div className={`text-center p-3 rounded-lg ${getVitalSignColor("heart_rate", patient.vital_signs?.heart_rate)}`}>
                      <p className="text-xs text-neutral-500 mb-1">Heart Rate (bpm)</p>
                      {isEditing ? (
                        <input
                          className="w-full text-center bg-white p-2 rounded-lg border"
                          value={editedFields.vital_signs?.heart_rate || patient.vital_signs?.heart_rate || ""}
                          onChange={(e) => handleEditVitalSign("heart_rate", e.target.value)}
                        />
                      ) : (
                        Number.isFinite(patient.vital_signs?.heart_rate)
                          ? <p className="font-bold">{patient.vital_signs.heart_rate}</p>
                          : <div className="border border-neutral-200 bg-white p-2 rounded-lg"><p className="text-sm text-neutral-400 italic">Pending</p></div>
                      )}
                    </div>

                    <div className={`text-center p-3 rounded-lg ${getVitalSignColor("temperature", patient.vital_signs?.temperature)}`}>
                      <p className="text-xs text-neutral-500 mb-1">Temperature (°C)</p>
                      {isEditing ? (
                        <input
                          className="w-full text-center bg-white p-2 rounded-lg border"
                          value={editedFields.vital_signs?.temperature || patient.vital_signs?.temperature || ""}
                          onChange={(e) => handleEditVitalSign("temperature", e.target.value)}
                        />
                      ) : (
                        Number.isFinite(patient.vital_signs?.temperature)
                          ? <p className="font-bold">{patient.vital_signs.temperature}</p>
                          : <div className="border border-neutral-200 bg-white p-2 rounded-lg"><p className="text-sm text-neutral-400 italic">Pending</p></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            <SummaryGenerator patient={patient} onSummaryGenerated={handleSummaryGenerated} />

            {/* Past Visits */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Past Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visitHistory.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-neutral-200" />
                    <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
                      {visitHistory.map((v, idx) => {
                        const dateStr = formatDate(v.visit_date);
                        return (
                          <li key={v._id || idx} className="relative pl-8">
                            <span className="absolute left-1.5 top-2 inline-block w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                            <div className="rounded-xl border border-neutral-100 bg-white hover:shadow-sm transition p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold text-neutral-900">{dateStr}</div>
                                {v.clinician && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-700">
                                    {v.clinician}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                {v.chief_complaint && (
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-neutral-400 mt-0.5" />
                                    <div>
                                      <div className="text-neutral-500">Chief Complaint</div>
                                      <div className="font-medium text-neutral-800">{v.chief_complaint}</div>
                                    </div>
                                  </div>
                                )}
                                {v.symptoms && (
                                  <div className="flex items-start gap-2">
                                    <Activity className="w-4 h-4 text-neutral-400 mt-0.5" />
                                    <div>
                                      <div className="text-neutral-500">Symptoms</div>
                                      <div className="font-medium text-neutral-800">{v.symptoms}</div>
                                    </div>
                                  </div>
                                )}
                                {v.diagnosis && (
                                  <div className="flex items-start gap-2">
                                    <Stethoscope className="w-4 h-4 text-blue-500 mt-0.5" />
                                    <div>
                                      <div className="text-neutral-500">Diagnosis</div>
                                      <div className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md inline-block">
                                        {v.diagnosis}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {v.treatment_plan && (
                                  <div className="flex items-start gap-2">
                                    <Pill className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    <div>
                                      <div className="text-neutral-500">Treatment</div>
                                      <div className="font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block">
                                        {v.treatment_plan}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 space-y-1.5 text-sm">
                                {v.medical_history && (
                                  <div>
                                    <span className="text-neutral-500">Medical History: </span>
                                    <span className="font-medium text-neutral-800">{v.medical_history}</span>
                                  </div>
                                )}
                                {v.current_medications && (
                                  <div>
                                    <span className="text-neutral-500">Medications: </span>
                                    <span className="font-medium text-neutral-800">{v.current_medications}</span>
                                  </div>
                                )}
                                {v.allergies && (
                                  <div>
                                    <span className="text-neutral-500">Allergies: </span>
                                    <span className="font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                                      {v.allergies}
                                    </span>
                                  </div>
                                )}
                                {v.notes && (
                                  <div className="italic text-neutral-600">{v.notes}</div>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="italic text-neutral-400 text-sm">No past visits recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* Past Vital Readings */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Past Vital Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {checkupHistory.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {checkupHistory.map((row) => {
                      const key = row._id || `${row.date}-${row?.vitals?.heart_rate || ""}`;
                      const when = formatDateTime(row.date);
                      const bpStr =
                        row?.vitals?.bp_sys != null && row?.vitals?.bp_dia != null
                          ? `${row.vitals.bp_sys}/${row.vitals.bp_dia}`
                          : "-";
                      const bpColor = textClassOnly(getVitalSignColor("blood_pressure", bpStr));
                      const hrColor = textClassOnly(getVitalSignColor("heart_rate", row?.vitals?.heart_rate));
                      const tColor  = textClassOnly(getVitalSignColor("temperature", row?.vitals?.temperature_c));
                      return (
                        <div key={key} className="rounded-xl border border-neutral-100 bg-white p-3 hover:shadow-sm transition">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-neutral-900">{when}</div>
                            {row.nurse_id && (
                              <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-700">
                                Nurse: {row.nurse_id}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 w-24">BP</span>
                              <span className={`font-semibold ${bpColor || "text-neutral-800"}`}>{bpStr}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 w-24">Heart Rate</span>
                              <span className={`font-semibold ${hrColor || "text-neutral-800"}`}>
                                {row?.vitals?.heart_rate ?? "-"} bpm
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 w-24">Temperature</span>
                              <span className={`font-semibold ${tColor || "text-neutral-800"}`}>
                                {row?.vitals?.temperature_c ?? "-"} °C
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 w-24">Weight</span>
                              <span className="font-semibold text-neutral-800">
                                {row?.vitals?.weight ?? "-"} kg
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500 w-24">Height</span>
                              <span className="font-semibold text-neutral-800">
                                {row?.vitals?.height ?? "-"} cm
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="italic text-neutral-400 text-sm">No past vital readings recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete confirmations */}
      <ConfirmDialog
        open={showDeleteConfirm1}
        title="Delete Patient"
        description={`Are you sure you want to delete ${patient?.first_name} ${patient?.last_name} (MRN: ${patient?.medical_record_number})? This action cannot be undone.`}
        onConfirm={() => { setShowDeleteConfirm1(false); setShowDeleteConfirm2(true); }}
        onCancel={() => setShowDeleteConfirm1(false)}
        confirmLabel="Continue"
        cancelLabel="Cancel"
      />
      <ConfirmDialog
        open={showDeleteConfirm2}
        title="Final Confirmation"
        description="This will permanently delete this patient's record. Are you absolutely sure?"
        onConfirm={() => { setShowDeleteConfirm2(false); handleDeletePatient(); }}
        onCancel={() => setShowDeleteConfirm2(false)}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}
