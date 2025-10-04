import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Edit3, User, Calendar, Phone, Activity, Mail, MapPin, Mic, Ruler, Dumbbell} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
    // value format "systolic/diastolic"
    const [sys, dia] = value.split("/").map(Number);
    if (isNaN(sys) || isNaN(dia)) return "";

    if (sys < 120 && dia < 80) {
      return "bg-green-50 text-green-600";
    } else if ((sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return "bg-amber-50 text-amber-600"; // amber = yellow in tailwind, need to add amber manually or use yellow
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
      return "bg-yellow-50 text-yellow-600"; // amber fallback using yellow
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
  
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('id');

  const loadPatient = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error(`Failed to load patient (${res.status})`);
      const data = await res.json();
      setPatient({ ...data, id: data._id });
    } catch (error) {
      console.error('Error loading patient:', error);
      setPatient(null);
    }
    setIsLoading(false);
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId, loadPatient]);

  const handleSummaryGenerated = async (summary) => {
    try {
      await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (e) {
      console.error('Failed updating summary', e);
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
            <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const age = patient.date_of_birth 
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : 'N/A';

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
            <Button variant="outline" className="gap-2">
              <Edit3 className="w-4 h-4" />
              Edit Patient
            </Button>
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
                        <p className="font-medium capitalize">{patient.gender || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Height */}
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-neutral-500">Height</p>
                        <p className="font-medium">{patient.vital_signs?.height ? `${patient.vital_signs.height} cm` : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-neutral-500">Weight</p>
                        <p className="font-medium">{patient.vital_signs?.weight ? `${patient.vital_signs.weight} kg` : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                  type="button">
                  <Mic className="w-5 h-5 text-neutral-600" />
                </button>

                <CardHeader className="pb-4 flex justify-between items-start">
                  <CardTitle className="text-xl">Medical Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Chief Complaint</h4>
                    <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                      {patient.chief_complaint || (
                        <span className="italic text-neutral-400">Pending doctor's input</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Medical History</h4>
                    <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                      {patient.medical_history || (
                        <span className="italic text-neutral-400">Pending doctor's input</span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Current Medications</h4>
                      <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        {patient.current_medications || (
                          <span className="italic text-neutral-400">Pending doctor's input</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Allergies</h4>
                      <p className="text-neutral-600 bg-red-50 p-3 rounded-lg">
                        {patient.allergies || (
                          <span className="italic text-neutral-400">Pending doctor's input</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">Current Symptoms</h4>
                    <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                      {patient.symptoms || (
                        <span className="italic text-neutral-400">Pending doctor's input</span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Diagnosis</h4>
                      <p className="text-neutral-600 bg-blue-50 p-3 rounded-lg">
                        {patient.diagnosis || (
                          <span className="italic text-neutral-400">Pending doctor's input</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Treatment Plan</h4>
                      <p className="text-neutral-600 bg-green-50 p-3 rounded-lg">
                        {patient.treatment_plan || (
                          <span className="italic text-neutral-400">Pending doctor's input</span>
                        )}
                      </p>
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
                    <CardTitle className="text-xl">Vital Signs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {patient.vital_signs?.blood_pressure && (
                        <div className={`text-center p-3 rounded-lg ${getVitalSignColor("blood_pressure", patient.vital_signs.blood_pressure, age)}`}>
                          <p className="text-xs text-neutral-500 mb-1">Blood Pressure</p>
                          <p className="font-bold">{patient.vital_signs.blood_pressure}</p>
                        </div>
                      )}
                      {patient.vital_signs?.heart_rate && (
                        <div className={`text-center p-3 rounded-lg ${getVitalSignColor("heart_rate", patient.vital_signs.heart_rate, age)}`}>
                          <p className="text-xs text-neutral-500 mb-1">Heart Rate (bpm)</p>
                          <p className="font-bold">{patient.vital_signs.heart_rate}</p>
                        </div>
                      )}
                      {patient.vital_signs?.temperature && (
                        <div className={`text-center p-3 rounded-lg ${getVitalSignColor("temperature", patient.vital_signs.temperature, age)}`}>
                          <p className="text-xs text-neutral-500 mb-1">Temperature (°C)</p>
                          <p className="font-bold">{patient.vital_signs.temperature}</p>
                        </div>
                      )}
                      {/* {patient.vital_signs?.weight && (
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-neutral-500 mb-1">Weight</p>
                          <p className="font-bold text-blue-600">{patient.vital_signs.weight}</p>
                        </div>
                      )}
                      {patient.vital_signs?.height && (
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-xs text-neutral-500 mb-1">Height</p>
                          <p className="font-bold text-green-600">{patient.vital_signs.height}</p>
                        </div>
                      )} */}
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

                    // Extract only text color classes from getVitalSignColor
                    const extractTextColorClass = (cls) => {
                      // Find the text-* class from string (e.g. "bg-red-100 text-red-700" -> "text-red-700")
                      const match = cls.match(/text-\S+/);
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
    </div>
  );
}
