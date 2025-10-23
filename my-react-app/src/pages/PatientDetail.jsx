import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Edit3, User, Calendar, Clipboard, Phone, Activity, Mail, MapPin, Ruler, Dumbbell, Save, X, Trash2} from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteConfirm1, setShowDeleteConfirm1] = useState(false);
  const [showDeleteConfirm2, setShowDeleteConfirm2] = useState(false);
  
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

  const handleConversationExtracted = async (extractedData) => {
    try {
      console.log('Extracted data received:', extractedData);
      
      // Update patient data with extracted information
      const updateData = {
        ...patient,
        // Map extracted data to patient fields based on backend structure
        chief_complaint: extractedData.medicalInfo?.chiefComplaint || patient.chief_complaint,
        symptoms: extractedData.medicalInfo?.symptoms?.join(', ') || patient.symptoms,
        medical_history: extractedData.medicalInfo?.medicalHistory?.join(', ') || patient.medical_history,
        current_medications: extractedData.medicalInfo?.currentMedications?.join(', ') || patient.current_medications,
        allergies: extractedData.medicalInfo?.allergies?.join(', ') || patient.allergies,
        diagnosis: extractedData.medicalInfo?.diagnosis || patient.diagnosis,
        treatment_plan: extractedData.medicalInfo?.treatmentPlan || patient.treatment_plan,
        // Update vital signs if extracted
        vital_signs: {
          ...patient.vital_signs,
          ...(extractedData.vitalSigns && {
            blood_pressure: extractedData.vitalSigns.blood_pressure || patient.vital_signs?.blood_pressure,
            heart_rate: extractedData.vitalSigns.heart_rate || patient.vital_signs?.heart_rate,
            temperature: extractedData.vitalSigns.temperature || patient.vital_signs?.temperature,
            weight: extractedData.vitalSigns.weight || patient.vital_signs?.weight,
            height: extractedData.vitalSigns.height || patient.vital_signs?.height
          })
        }
      };

      // Fetch updated patient data from backend (backend already updated it during speech processing)
      const response = await fetch(`/api/patients/${patient._id}`);
      
      if (response.ok) {
        const updatedPatientData = await response.json();
        setPatient(updatedPatientData);
        console.log('Patient data refreshed with conversation extraction');
      } else {
        console.error('Failed to fetch updated patient data');
      }
    } catch (error) {
      console.error('Error updating patient with extracted data:', error);
    }
  };

  const handleEditField = (field, value) => {
    setEditedFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const updatedVitals = {
        ...patient.vital_signs,
        ...editedFields.vital_signs
      };

      const updateData = {
        ...patient,
        ...editedFields,
        vital_signs: updatedVitals
      };

      const response = await fetch(`/api/patients/${patient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatient(updatedPatient);
        setEditedFields({});
        setIsEditing(false);
        console.log("Patient data updated successfully");
      } else {
        console.error("Failed to update patient data");
      }
    } catch (error) {
      console.error("Error updating patient:", error);
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

const handleEditVitalSign = (vitalField, value) => {
  setEditedFields(prev => ({
    ...prev,
    vital_signs: {
      ...prev.vital_signs,
      [vitalField]: value
    }
  }));
};

  const handleCancelEdit = () => {
    setEditedFields({});
    setIsEditing(false);
  };

  const handleDeletePatient = async () => {
    try {
      const response = await fetch(`/api/patients/${patient._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log("Patient deleted successfully");
        navigate(createPageUrl("Dashboard"));
      } else {
        console.error("Failed to delete patient");
        alert("Failed to delete patient. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("Error deleting patient. Please try again.");
    }
  };

  const renderEditableField = (fieldName, label, placeholder = "Pending doctor's input") => {
    const currentValue = editedFields[fieldName] !== undefined ? editedFields[fieldName] : patient[fieldName];
    
    return (
      <div>
        <h4 className="font-semibold text-neutral-700 mb-2">{label}</h4>
        {isEditing ? (
          <Textarea
            value={currentValue || ''}
            onChange={(e) => handleEditField(fieldName, e.target.value)}
            placeholder={placeholder}
            className="bg-neutral-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
          />
        ) : (
          <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
            {currentValue || (
              <span className="italic text-neutral-400">{placeholder}</span>
            )}
          </p>
        )}
      </div>
    );
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
          {!isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
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
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              {showConfirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                    <h2 className="text-lg font-semibold text-neutral-800 mb-2">Confirm Save</h2>
                    <p className="text-sm text-neutral-600 mb-4">
                      Are you sure you want to save the changes to <strong>{patient.first_name} {patient.last_name}</strong> (<strong>{patient.medical_record_number}</strong>)'s record?
                    </p>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowConfirmDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setShowConfirmDialog(false);
                          handleSaveChanges(); // Call actual save
                        }}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  {/* Age (edit date_of_birth instead) */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <div>
                      <p className="text-neutral-500">Date of Birth</p>
                      {isEditing ? (
                        <input
                          type="date"
                          className="bg-neutral-50 p-2 rounded-lg w-full border border-neutral-200 text-sm"
                          value={editedFields.date_of_birth || patient.date_of_birth || ""}
                          onChange={(e) => handleEditField("date_of_birth", e.target.value)}
                        />
                      ) : (
                        <p className="font-medium">{patient.date_of_birth ? formatDate(patient.date_of_birth) : "N/A"}</p>
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
                          type="text"
                          className="bg-neutral-50 p-2 rounded-lg w-full border border-neutral-200 text-sm"
                          value={editedFields.vital_signs?.height || patient.vital_signs?.height || ""}
                          onChange={(e) => handleEditVitalSign("height", e.target.value)}
                        />
                      ) : (
                        <p className="font-medium">{patient.vital_signs?.height || "N/A"}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-neutral-400" />
                    <div>
                      <p className="text-neutral-500">Weight (kg)</p>
                      {isEditing ? (
                        <input
                          type="text"
                          className="bg-neutral-50 p-2 rounded-lg w-full border border-neutral-200 text-sm"
                          value={editedFields.vital_signs?.weight || patient.vital_signs?.weight || ""}
                          onChange={(e) => handleEditVitalSign("weight", e.target.value)}
                        />
                      ) : (
                        <p className="font-medium">{patient.vital_signs?.weight || "N/A"}</p>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border-0 shadow-sm relative">
                <CardHeader className="pb-4 flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clipboard className="w-5 h-5 text-emerald-600" />
                    Medical Information
                  </CardTitle>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <VoiceRecordingButton
                      patientId={patient._id}
                      onProcessingComplete={handleConversationExtracted}
                      onError={(error) => console.error('Voice processing error:', error)}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                  {renderEditableField('chief_complaint', 'Chief Complaint')}
                  {renderEditableField('medical_history', 'Medical History')}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderEditableField('current_medications', 'Current Medications')}
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Allergies</h4>
                      {isEditing ? (
                        <Textarea
                          value={editedFields.allergies !== undefined ? editedFields.allergies : patient.allergies || ''}
                          onChange={(e) => handleEditField('allergies', e.target.value)}
                          placeholder="No known allergies"
                          className="bg-red-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                        />
                      ) : (
                        <p className="text-neutral-600 bg-red-50 p-3 rounded-lg">
                          {patient.allergies || (
                            <span className="italic text-neutral-400">No known allergies</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {renderEditableField('symptoms', 'Current Symptoms')}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Diagnosis</h4>
                      {isEditing ? (
                        <Textarea
                          value={editedFields.diagnosis !== undefined ? editedFields.diagnosis : patient.diagnosis || ''}
                          onChange={(e) => handleEditField('diagnosis', e.target.value)}
                          placeholder="Pending doctor's input"
                          className="bg-blue-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                        />
                      ) : (
                        <p className="text-neutral-600 bg-blue-50 p-3 rounded-lg">
                          {patient.diagnosis || (
                            <span className="italic text-neutral-400">Pending doctor's input</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-700 mb-2">Treatment Plan</h4>
                      {isEditing ? (
                        <Textarea
                          value={editedFields.treatment_plan !== undefined ? editedFields.treatment_plan : patient.treatment_plan || ''}
                          onChange={(e) => handleEditField('treatment_plan', e.target.value)}
                          placeholder="Pending doctor's input"
                          className="bg-green-50 p-3 rounded-lg border-0 resize-none min-h-[60px]"
                        />
                      ) : (
                        <p className="text-neutral-600 bg-green-50 p-3 rounded-lg">
                          {patient.treatment_plan || (
                            <span className="italic text-neutral-400">Pending doctor's input</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vital Signs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4 flex">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="w-5 h-5 text-orange-600" />
                    Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                    {/* Blood Pressure */}
                    <div className={`text-center p-3 rounded-lg ${getVitalSignColor("blood_pressure", patient.vital_signs?.blood_pressure, age)}`}>
                      <p className="text-xs text-neutral-500 mb-1">Blood Pressure</p>
                      {isEditing ? (
                        <input
                          className="w-full text-center bg-white p-2 rounded-lg border"
                          value={editedFields.vital_signs?.blood_pressure || patient.vital_signs?.blood_pressure || ""}
                          placeholder="Pending input"
                          onChange={(e) => handleEditVitalSign("blood_pressure", e.target.value)}
                        />
                      ) : (
                        patient.vital_signs?.blood_pressure?.trim() ? (
                          <p className="font-bold">{patient.vital_signs.blood_pressure}</p>
                        ) : (
                          <div className="border border-neutral-200 bg-white p-2 rounded-lg">
                            <p className="text-sm text-neutral-400 italic">Pending input</p>
                          </div>
                        )
                      )}
                    </div>

                    {/* Heart Rate */}
                    <div className={`text-center p-3 rounded-lg ${getVitalSignColor("heart_rate", patient.vital_signs?.heart_rate, age)}`}>
                      <p className="text-xs text-neutral-500 mb-1">Heart Rate (bpm)</p>
                      {isEditing ? (
                        <input
                          className="w-full text-center bg-white p-2 rounded-lg border"
                          value={editedFields.vital_signs?.heart_rate || patient.vital_signs?.heart_rate || ""}
                          placeholder="Pending input"
                          onChange={(e) => handleEditVitalSign("heart_rate", e.target.value)}
                        />
                      ) : (
                        patient.vital_signs?.heart_rate?.toString().trim() ? (
                          <p className="font-bold">{patient.vital_signs.heart_rate}</p>
                        ) : (
                          <div className="border border-neutral-200 bg-white p-2 rounded-lg">
                            <p className="text-sm text-neutral-400 italic">Pending input</p>
                          </div>
                        )
                      )}
                    </div>

                    {/* Temperature */}
                    <div className={`text-center p-3 rounded-lg ${getVitalSignColor("temperature", patient.vital_signs?.temperature, age)}`}>
                      <p className="text-xs text-neutral-500 mb-1">Temperature (°C)</p>
                      {isEditing ? (
                        <input
                          className="w-full text-center bg-white p-2 rounded-lg border"
                          value={editedFields.vital_signs?.temperature || patient.vital_signs?.temperature || ""}
                          placeholder="Pending input"
                          onChange={(e) => handleEditVitalSign("temperature", e.target.value)}
                        />
                      ) : (
                        patient.vital_signs?.temperature?.toString().trim() ? (
                          <p className="font-bold">{patient.vital_signs.temperature}</p>
                        ) : (
                          <div className="border border-neutral-200 bg-white p-2 rounded-lg">
                            <p className="text-sm text-neutral-400 italic">Pending input</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div> 
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

      {/* Delete Confirmation (step 1) */}
      <ConfirmDialog
        open={showDeleteConfirm1}
        title="Delete Patient"
        description={`Are you sure you want to delete ${patient?.first_name} ${patient?.last_name} (MRN: ${patient?.medical_record_number})? This action cannot be undone.`}
        onConfirm={() => {
          setShowDeleteConfirm1(false);
          setShowDeleteConfirm2(true);
        }}
        onCancel={() => setShowDeleteConfirm1(false)}
        confirmLabel="Continue"
        cancelLabel="Cancel"
      />

      {/* Delete Confirmation (step 2) */}
      <ConfirmDialog
        open={showDeleteConfirm2}
        title="Final Confirmation"
        description="This will permanently delete this patient's record. Are you absolutely sure?"
        onConfirm={() => {
          setShowDeleteConfirm2(false);
          handleDeletePatient();
        }}
        onCancel={() => setShowDeleteConfirm2(false)}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
