import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Download, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ReferralReport({ patients, isLoading }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [formData, setFormData] = useState({
    referring_physician: '',
    referring_physician_contact: '',
    specialist_name: '',
    specialist_department: '',
    specialty: '',
    referral_reason: '',
    clinical_question: '',
    urgency: '',
    investigations_done: '',
    preferred_appointment_timeframe: '',
    patient_mobility: '',
    interpreter_needed: ''
  });
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSelectedPatientData = () => {
    return patients.find(p => p.id === selectedPatient);
  };

  const generateReport = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setIsGenerating(true);
    const patient = getSelectedPatientData();

    try {
      // Mock response for now
      const mockResponse = `
        <div class="referral-letter">
          <h1>MEDICAL REFERRAL LETTER</h1>
          <h2>Patient Information</h2>
          <p><strong>Name:</strong> ${patient.first_name} ${patient.last_name}</p>
          <p><strong>MRN:</strong> ${patient.medical_record_number}</p>
          <p><strong>DOB:</strong> ${patient.date_of_birth || 'N/A'}</p>
          <p><strong>Age:</strong> ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}</p>
          <p><strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
          
          <h2>Referring Physician</h2>
          <p><strong>Name:</strong> ${formData.referring_physician || 'Dr. Smith'}</p>
          <p><strong>Contact:</strong> ${formData.referring_physician_contact || 'N/A'}</p>
          
          <h2>Referral Details</h2>
          <p><strong>Specialist:</strong> ${formData.specialist_name || 'To be assigned'}</p>
          <p><strong>Department:</strong> ${formData.specialist_department || 'N/A'}</p>
          <p><strong>Specialty:</strong> ${formData.specialty || 'N/A'}</p>
          <p><strong>Reason for Referral:</strong> ${formData.referral_reason || 'N/A'}</p>
          <p><strong>Clinical Question:</strong> ${formData.clinical_question || 'N/A'}</p>
          <p><strong>Urgency:</strong> ${formData.urgency || 'Routine'}</p>
          
          <h2>Clinical Information</h2>
          <p><strong>Primary Diagnosis:</strong> ${patient.diagnosis || 'N/A'}</p>
          <p><strong>Medical History:</strong> ${patient.medical_history || 'N/A'}</p>
          <p><strong>Current Medications:</strong> ${patient.current_medications || 'N/A'}</p>
          <p><strong>Allergies:</strong> ${patient.allergies || 'None known'}</p>
          
          <h2>Investigations Done</h2>
          <p>${formData.investigations_done || 'None documented'}</p>
          
          <h2>Special Requirements</h2>
          <p><strong>Patient Mobility:</strong> ${formData.patient_mobility || 'Independent'}</p>
          <p><strong>Interpreter Needed:</strong> ${formData.interpreter_needed || 'No'}</p>
        </div>
      `;

      setGeneratedReport(mockResponse);
    } catch (error) {
      console.error('Error generating referral report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading patients...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Generate Referral Letter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient-select">Select Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} (MRN: {patient.medical_record_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referring-physician">Referring Physician</Label>
              <Input
                id="referring-physician"
                value={formData.referring_physician}
                onChange={(e) => handleChange('referring_physician', e.target.value)}
                placeholder="Dr. John Smith"
              />
            </div>

            <div>
              <Label htmlFor="referring-contact">Physician Contact</Label>
              <Input
                id="referring-contact"
                value={formData.referring_physician_contact}
                onChange={(e) => handleChange('referring_physician_contact', e.target.value)}
                placeholder="Phone: 123-456-7890"
              />
            </div>

            <div>
              <Label htmlFor="specialist-name">Specialist Name</Label>
              <Input
                id="specialist-name"
                value={formData.specialist_name}
                onChange={(e) => handleChange('specialist_name', e.target.value)}
                placeholder="Dr. Jane Specialist"
              />
            </div>

            <div>
              <Label htmlFor="specialist-department">Department</Label>
              <Input
                id="specialist-department"
                value={formData.specialist_department}
                onChange={(e) => handleChange('specialist_department', e.target.value)}
                placeholder="Cardiology"
              />
            </div>

            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Select value={formData.specialty} onValueChange={(value) => handleChange('specialty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="dermatology">Dermatology</SelectItem>
                  <SelectItem value="oncology">Oncology</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleChange('urgency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="semi-urgent">Semi-Urgent</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeframe">Preferred Timeframe</Label>
              <Input
                id="timeframe"
                value={formData.preferred_appointment_timeframe}
                onChange={(e) => handleChange('preferred_appointment_timeframe', e.target.value)}
                placeholder="Within 2 weeks"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="referral-reason">Reason for Referral</Label>
              <Textarea
                id="referral-reason"
                value={formData.referral_reason}
                onChange={(e) => handleChange('referral_reason', e.target.value)}
                placeholder="Describe the reason for referral..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="clinical-question">Clinical Question</Label>
              <Textarea
                id="clinical-question"
                value={formData.clinical_question}
                onChange={(e) => handleChange('clinical_question', e.target.value)}
                placeholder="What specific question or concern needs to be addressed?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="investigations">Investigations Done</Label>
              <Textarea
                id="investigations"
                value={formData.investigations_done}
                onChange={(e) => handleChange('investigations_done', e.target.value)}
                placeholder="List any investigations or tests already performed..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={generateReport}
              disabled={isGenerating || !selectedPatient}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Referral Letter
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Referral Letter</CardTitle>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: generatedReport }}
            />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}