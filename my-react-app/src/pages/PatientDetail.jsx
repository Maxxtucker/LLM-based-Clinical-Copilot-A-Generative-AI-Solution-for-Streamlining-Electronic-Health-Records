// PatientDetail.jsx — CHUNK 1
import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Edit3, User, Calendar, Clipboard, Phone, Activity, Mail, MapPin, Mic, Ruler, Dumbbell, Save,  } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import ConfirmDialog from "../components/ui/confirmdialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { format } from "date-fns";

import SummaryGenerator from "../components/ai/SummaryGenerator";

const statusColors = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  inactive: "bg-yellow-100 text-yellow-800 border-yellow-200",
  discharged: "bg-gray-100 text-gray-800 border-gray-200"
};

function formatDate(dateString) {
  return format(new Date(dateString), "dd MMM yyyy");
}

function getVitalSignColor(type, value, age) {
  if (!value) return "";

  if (type === "blood_pressure") {
    const [sys, dia] = String(value).split("/").map(Number);
    if (isNaN(sys) || isNaN(dia)) return "";

    if (sys < 120 && dia < 80) {
      return "bg-green-50 text-green-600";
    } else if ((sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return "bg-amber-50 text-amber-600";
    } else if (sys >= 140 || dia >= 90) {
      return "bg-red-50 text-red-600";
    }
  }

  if (type === "heart_rate") {
    const hr = Number(value);
    if (isNaN(hr)) return "";

    if (hr >= 60 && hr <= 100) {
      return "bg-green-50 text-green-600";
    } else if ((hr >= 50 && hr < 60) || (hr > 100 && hr <= 110)) {
      return "bg-yellow-50 text-yellow-600";
    } else {
      return "bg-red-50 text-red-600";
    }
  }

  if (type === "temperature") {
    const temp = Number(value);
    if (isNaN(temp)) return "";

    if (temp >= 36.1 && temp <= 37.2) {
      return "bg-green-50 text-green-600";
    } else if ((temp >= 35.5 && temp < 36.1) || (temp > 37.2 && temp <= 38)) {
      return "bg-yellow-50 text-yellow-600";
    } else {
      return "bg-red-50 text-red-600";
    }
  }

  return "";
}

export default function PatientDetail() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get("id");
  const [confirmOpen, setConfirmOpen] = useState(false);


  const loadPatient = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error(`Failed to load patient (${res.status})`);
      const data = await res.json();
      // keep id consistent
      setPatient({ ...data, id: data._id || data.id });
      setFormData(JSON.parse(JSON.stringify({ ...data, id: data._id || data.id }))); // deep clone
    } catch (error) {
      console.error("Error loading patient:", error);
      setPatient(null);
    }
    setIsLoading(false);
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId, loadPatient]);

  // helper to update nested fields safely
  const safeSetForm = (path, value) => {
    // path: array of keys or dot-separated string
    const keys = Array.isArray(path) ? path : String(path).split(".");
    setFormData(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (cur[k] === undefined || cur[k] === null) cur[k] = {};
        cur = cur[k];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Cancel: revert formData to last saved patient
      setFormData(JSON.parse(JSON.stringify(patient || {})));
      setIsEditing(false);
    } else {
      setFormData(JSON.parse(JSON.stringify(patient || {})));
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!patient?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const updated = await res.json();
      setPatient({ ...updated, id: updated._id || updated.id });
      setFormData(JSON.parse(JSON.stringify({ ...updated, id: updated._id || updated.id })));
      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
      // You may show a toast here in your app
    } finally {
      setIsSaving(false);
    }
  };

  const handleSummaryGenerated = async (summary) => {
    try {
      await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_summary: true,
          ai_summary_content: summary
        })
      });
      setPatient(prev => ({
        ...prev,
        ai_summary: true,
        ai_summary_content: summary
      }));
      // keep form data in sync if in edit mode
      setFormData(prev => ({ ...prev, ai_summary: true, ai_summary_content: summary }));
    } catch (e) {
      console.error("Failed updating summary", e);
    }
  };

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

  const age = patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : "N/A";
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
              {`${patient.first_name || ""} ${patient.last_name || ""}`}
            </h1>
            <p className="text-neutral-600 mt-1">MRN: {patient.medical_record_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleToggleEdit}
              disabled={isSaving}
            >
              <Edit3 className="w-4 h-4" />
              Edit Patient
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="text-neutral-600 hover:bg-neutral-100 border-neutral-300"
                onClick={handleToggleEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setConfirmOpen(true)}
                disabled={isSaving}
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>

        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
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
                        <p className="text-neutral-500">Age</p>
                        <p className="font-medium">{age} years</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-neutral-500">Gender</p>
                        {isEditing ? (
                          <select
                            className="border border-neutral-300 rounded-md px-2 py-1"
                            value={formData.gender || ""}
                            onChange={(e) => safeSetForm("gender", e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <p className="font-medium capitalize">{patient.gender || "N/A"}</p>
                        )}
                      </div>
                    </div>

                    {/* Height */}
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-neutral-500">Height</p>
                        {isEditing ? (
                          <input
                            className="border border-neutral-300 rounded-md px-2 py-1 w-full"
                            value={formData.vital_signs?.height ?? ""}
                            onChange={(e) => safeSetForm("vital_signs.height", e.target.value)}
                            placeholder="cm"
                          />
                        ) : (
                          <p className="font-medium">{patient.vital_signs?.height ? `${patient.vital_signs.height} cm` : "N/A"}</p>
                        )}
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-neutral-500">Weight</p>
                        {isEditing ? (
                          <input
                            className="border border-neutral-300 rounded-md px-2 py-1 w-full"
                            value={formData.vital_signs?.weight ?? ""}
                            onChange={(e) => safeSetForm("vital_signs.weight", e.target.value)}
                            placeholder="kg"
                          />
                        ) : (
                          <p className="font-medium">{patient.vital_signs?.weight ? `${patient.vital_signs.weight} kg` : "N/A"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {isEditing ? (
                      <>
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-neutral-400 mt-2" />
                          <div className="w-full">
                            <p className="text-neutral-500 text-sm">Phone</p>
                            <input
                              className="border border-neutral-300 rounded-md px-2 py-1 w-full"
                              value={formData.phone ?? ""}
                              onChange={(e) => safeSetForm("phone", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-neutral-400 mt-2" />
                          <div className="w-full">
                            <p className="text-neutral-500 text-sm">Email</p>
                            <input
                              className="border border-neutral-300 rounded-md px-2 py-1 w-full"
                              value={formData.email ?? ""}
                              onChange={(e) => safeSetForm("email", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-neutral-400 mt-2" />
                          <div className="w-full">
                            <p className="text-neutral-500 text-sm">Address</p>
                            <input
                              className="border border-neutral-300 rounded-md px-2 py-1 w-full"
                              value={formData.address ?? ""}
                              onChange={(e) => safeSetForm("address", e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {patient.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            <div>
                              <p className="text-neutral-500">Phone</p>
                              <p className="font-medium">{patient.phone}</p>
                            </div>
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-neutral-400" />
                            <div>
                              <p className="text-neutral-500">Email</p>
                              <p className="font-medium">{patient.email}</p>
                            </div>
                          </div>
                        )}
                        {patient.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-neutral-400" />
                            <div>
                              <p className="text-neutral-500 text-sm">Address</p>
                              <p className="font-medium">{patient.address}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Medical Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border-0 shadow-sm relative">
                <button
                  className="absolute top-4 right-4 p-2 border border-neutral-200 rounded-md hover:bg-neutral-100 transition"
                  title="Voice dictation"
                  type="button"
                >
                  <Mic className="w-5 h-5 text-neutral-600" />
                </button>

                <CardHeader className="pb-4 flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clipboard className="w-5 h-5 text-emerald-600" />
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Chief Complaint</h4>
                    {isEditing ? (
                      <textarea
                        className="text-neutral-800 bg-white w-full border border-neutral-300 p-3 rounded-lg"
                        value={formData.chief_complaint ?? ""}
                        onChange={(e) => safeSetForm("chief_complaint", e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        {patient.chief_complaint || <span className="italic text-neutral-400">Pending doctor's input</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Medical History</h4>
                    {isEditing ? (
                      <textarea
                        className="text-neutral-800 bg-white w-full border border-neutral-300 p-3 rounded-lg"
                        value={formData.medical_history ?? ""}
                        onChange={(e) => safeSetForm("medical_history", e.target.value)}
                        rows={4}
                      />
                    ) : (
                      <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        {patient.medical_history || <span className="italic text-neutral-400">Pending doctor's input</span>}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Current Medications</h4>
                      {isEditing ? (
                        <textarea
                          className="text-neutral-800 bg-white w-full border border-neutral-300 p-3 rounded-lg"
                          value={formData.current_medications ?? ""}
                          onChange={(e) => safeSetForm("current_medications", e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                          {patient.current_medications || <span className="italic text-neutral-400">Pending doctor's input</span>}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Allergies</h4>
                      {isEditing ? (
                        <textarea
                          className="text-neutral-800 bg-white w-full border border-neutral-300 p-3 rounded-lg"
                          value={formData.allergies ?? ""}
                          onChange={(e) => safeSetForm("allergies", e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <p className="text-neutral-600 bg-red-50 p-3 rounded-lg">
                          {patient.allergies || <span className="italic text-neutral-400">Pending doctor's input</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Current Symptoms</h4>
                    {isEditing ? (
                      <textarea
                        className="text-neutral-800 bg-white w-full border border-neutral-300 p-3 rounded-lg"
                        value={formData.symptoms ?? ""}
                        onChange={(e) => safeSetForm("symptoms", e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        {patient.symptoms || <span className="italic text-neutral-400">Pending doctor's input</span>}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Diagnosis</h4>
                      {isEditing ? (
                        <textarea
                          className="text-neutral-800 bg-white w-full border border-neutral-300 p-3 rounded-lg"
                          value={formData.diagnosis ?? ""}
                          onChange={(e) => safeSetForm("diagnosis", e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <p className="text-neutral-600 bg-blue-50 p-3 rounded-lg">
                          {patient.diagnosis || <span className="italic text-neutral-400">Pending doctor's input</span>}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Treatment Plan</h4>
                      {isEditing ? (
                        <textarea
                          className="text-neutral-800 bg-white w-full border border-neutral-300 p-3 rounded-lg"
                          value={formData.treatment_plan ?? ""}
                          onChange={(e) => safeSetForm("treatment_plan", e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <p className="text-neutral-600 bg-green-50 p-3 rounded-lg">
                          {patient.treatment_plan || <span className="italic text-neutral-400">Pending doctor's input</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vital Signs */}
            {Object.values(patient.vital_signs || {}).some(value => value) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Activity className="w-5 h-5 text-orange-600" />
                      Vital Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Blood pressure */}
                      <div className={`text-center p-3 rounded-lg ${getVitalSignColor("blood_pressure", formData.vital_signs?.blood_pressure ?? patient.vital_signs?.blood_pressure, age)}`}>
                        <p className="text-xs text-neutral-500 mb-1">Blood Pressure</p>
                        {isEditing ? (
                          <input
                            className="border border-neutral-300 rounded-md px-2 py-1 w-full bg-white text-center font-medium"
                            value={formData.vital_signs?.blood_pressure ?? ""}
                            onChange={(e) => safeSetForm("vital_signs.blood_pressure", e.target.value)}
                            placeholder="e.g. 120/80"
                          />
                        ) : (
                          <p className="font-bold">{patient.vital_signs?.blood_pressure}</p>
                        )}
                      </div>

                      {/* Heart rate */}
                      <div className={`text-center p-3 rounded-lg ${getVitalSignColor("heart_rate", formData.vital_signs?.heart_rate ?? patient.vital_signs?.heart_rate, age)}`}>
                        <p className="text-xs text-neutral-500 mb-1">Heart Rate (bpm)</p>
                        {isEditing ? (
                          <input
                            className="border border-neutral-300 rounded-md px-2 py-1 w-full bg-white text-center font-medium"
                            value={formData.vital_signs?.heart_rate ?? ""}
                            onChange={(e) => safeSetForm("vital_signs.heart_rate", e.target.value)}
                            placeholder="bpm"
                          />
                        ) : (
                          <p className="font-bold">{patient.vital_signs?.heart_rate}</p>
                        )}
                      </div>

                      {/* Temperature */}
                      <div className={`text-center p-3 rounded-lg ${getVitalSignColor("temperature", formData.vital_signs?.temperature ?? patient.vital_signs?.temperature, age)}`}>
                        <p className="text-xs text-neutral-500 mb-1">Temperature (°C)</p>
                        {isEditing ? (
                          <input
                            className="border border-neutral-300 rounded-md px-2 py-1 w-full bg-white text-center font-medium"
                            value={formData.vital_signs?.temperature ?? ""}
                            onChange={(e) => safeSetForm("vital_signs.temperature", e.target.value)}
                            placeholder="°C"
                          />
                        ) : (
                          <p className="font-bold">{patient.vital_signs?.temperature}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SummaryGenerator patient={patient} onSummaryGenerated={handleSummaryGenerated} />

            <div className="border rounded-lg shadow-sm bg-white p-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                Past Visits
              </h3>

              {patient.past_visits && patient.past_visits.length > 0 ? (
                <div className="space-y-4 max-h-48 overflow-y-auto text-sm text-neutral-700">
                  {patient.past_visits.map((visit, index) => (
                    <div key={index} className="pb-2 border-b border-neutral-200 last:border-b-0">
                      <p className="font-bold text-neutral-900">{formatDate(visit.visit_date)}</p>
                      <p><span className="font-semibold">Diagnosis:</span> {visit.diagnosis}</p>
                      {/* show notes if available */}
                      {visit.notes && <p className="text-neutral-600 text-sm">Notes: {visit.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-neutral-400 text-sm">No past visits recorded.</p>
              )}
            </div>

            <div className="border rounded-lg shadow-sm bg-white p-4 mt-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                Past Vital Readings
              </h3>

              {patient.past_vital_readings && patient.past_vital_readings.length > 0 ? (
                <div className="space-y-4 max-h-48 overflow-y-auto text-sm text-neutral-700">
                  {patient.past_vital_readings.map((reading, index) => {
                    const dateObj = new Date(reading.date);
                    const dateTimeFormatted = `${format(dateObj, "dd MMM yyyy")} @ ${format(dateObj, "h:mm a")}`;

                    const extractTextColorClass = (cls) => {
                      const match = cls && cls.match(/text-\S+/);
                      return match ? match[0] : "";
                    };

                    const bpColor = extractTextColorClass(getVitalSignColor("blood_pressure", reading.blood_pressure, age));
                    const hrColor = extractTextColorClass(getVitalSignColor("heart_rate", reading.heart_rate, age));
                    const tempColor = extractTextColorClass(getVitalSignColor("temperature", reading.temperature, age));

                    return (
                      <div key={index} className="pb-2 border-b border-neutral-200 last:border-b-0">
                        <p className="font-bold text-neutral-900">{dateTimeFormatted}</p>
                        <p>
                          <span className="font-semibold">Blood Pressure:</span>{" "}
                          <span className={bpColor || "text-neutral-700"}>
                            {reading.blood_pressure || "-"}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold">Heart Rate:</span>{" "}
                          <span className={hrColor || "text-neutral-700"}>
                            {reading.heart_rate ?? "-"} bpm
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold">Temperature:</span>{" "}
                          <span className={tempColor || "text-neutral-700"}>
                            {reading.temperature ?? "-"} °C
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="italic text-neutral-400 text-sm">No past vital readings recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Save"
        description="Are you sure you want to save these changes?"
        onConfirm={() => {
          setConfirmOpen(false);
          handleSave();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
