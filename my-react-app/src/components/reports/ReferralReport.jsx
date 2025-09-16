
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Users, Loader2, Download, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
//import { InvokeLLM } from "@/integrations/Core";

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
    relevant_history: '',
    current_symptoms: '',
    medications_relevant: '',
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
      const prompt = `
        Generate a professional medical referral letter in structured HTML format for the following patient:

        PATIENT INFORMATION:
        Name: ${patient.first_name} ${patient.last_name}
        MRN: ${patient.medical_record_number}
        DOB: ${patient.date_of_birth || 'N/A'}
        Age: ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}
        Gender: ${patient.gender || 'N/A'}
        Address: ${patient.address || 'N/A'}
        Phone: ${patient.phone || 'N/A'}

        REFERRING PHYSICIAN:
        Name: ${formData.referring_physician}
        Contact: ${formData.referring_physician_contact}

        REFERRAL TO:
        Specialist: ${formData.specialist_name || 'To be assigned'}
        Department: ${formData.specialist_department}
        Specialty: ${formData.specialty}

        REFERRAL DETAILS:
        Reason for Referral: ${formData.referral_reason}
        Clinical Question: ${formData.clinical_question}
        Urgency: ${formData.urgency}
        Preferred Timeframe: ${formData.preferred_appointment_timeframe}

        CLINICAL INFORMATION:
        Current Chief Complaint: ${patient.chief_complaint || 'N/A'}
        Relevant History: ${formData.relevant_history || patient.medical_history || 'N/A'}
        Current Symptoms: ${formData.current_symptoms || patient.symptoms || 'N/A'}
        Current Medications: ${formData.medications_relevant || patient.current_medications || 'N/A'}
        Allergies: ${patient.allergies || 'NKDA'}
        
        Recent Vital Signs:
        BP: ${patient.vital_signs?.blood_pressure || 'N/A'}
        HR: ${patient.vital_signs?.heart_rate || 'N/A'}
        Temp: ${patient.vital_signs?.temperature || 'N/A'}

        INVESTIGATIONS COMPLETED:
        ${formData.investigations_done || 'None specified'}

        ADDITIONAL INFORMATION:
        Patient Mobility: ${formData.patient_mobility || 'Not specified'}
        Interpreter Needed: ${formData.interpreter_needed || 'Not specified'}

        Please format this as a professional HTML referral letter with:
        1. Professional business letter format with HTML structure
        2. Clear header with date and recipient information
        3. Professional salutation and body structure
        4. Tables for organized clinical data (vital signs, medications, investigations)
        5. Clear sections with proper headings
        6. Professional closing and contact information
        7. Clean typography and spacing for print
        8. Medical document styling

        Return only the HTML content without markdown formatting.
      `;

      //const response = await InvokeLLM({ prompt });
      //setGeneratedReport(response);
    } catch (error) {
      console.error('Error generating referral report:', error);
      alert('Error generating report. Please try again.');
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <Card className="border-0 shadow-sm no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Referral Letter Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Select Patient *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} - {patient.medical_record_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Details Form */}
      {selectedPatient && (
        <Card className="border-0 shadow-sm no-print">
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Referring Physician *</Label>
                <Input
                  value={formData.referring_physician}
                  onChange={(e) => handleChange('referring_physician', e.target.value)}
                  placeholder="Dr. John Smith"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Contact Information *</Label>
                <Input
                  value={formData.referring_physician_contact}
                  onChange={(e) => handleChange('referring_physician_contact', e.target.value)}
                  placeholder="Phone: (555) 123-4567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Specialist Name</Label>
                <Input
                  value={formData.specialist_name}
                  onChange={(e) => handleChange('specialist_name', e.target.value)}
                  placeholder="Dr. Jane Doe (if known)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Department/Clinic</Label>
                <Input
                  value={formData.specialist_department}
                  onChange={(e) => handleChange('specialist_department', e.target.value)}
                  placeholder="Cardiology Department"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Specialty *</Label>
                <Select value={formData.specialty} onValueChange={(value) => handleChange('specialty', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="endocrinology">Endocrinology</SelectItem>
                    <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="oncology">Oncology</SelectItem>
                    <SelectItem value="orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="psychiatry">Psychiatry</SelectItem>
                    <SelectItem value="pulmonology">Pulmonology</SelectItem>
                    <SelectItem value="rheumatology">Rheumatology</SelectItem>
                    <SelectItem value="urology">Urology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Urgency Level *</Label>
                <Select value={formData.urgency} onValueChange={(value) => handleChange('urgency', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent (within 2 weeks)</SelectItem>
                    <SelectItem value="semi_urgent">Semi-urgent (within 4-6 weeks)</SelectItem>
                    <SelectItem value="routine">Routine (within 3 months)</SelectItem>
                    <SelectItem value="non_urgent">Non-urgent (flexible)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Reason for Referral *</Label>
              <Textarea
                value={formData.referral_reason}
                onChange={(e) => handleChange('referral_reason', e.target.value)}
                placeholder="Primary reason for referral..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Specific Clinical Question</Label>
              <Textarea
                value={formData.clinical_question}
                onChange={(e) => handleChange('clinical_question', e.target.value)}
                placeholder="What specific questions do you want answered?"
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Relevant Clinical History</Label>
              <Textarea
                value={formData.relevant_history}
                onChange={(e) => handleChange('relevant_history', e.target.value)}
                placeholder="Relevant medical history for this referral..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Current Symptoms</Label>
                <Textarea
                  value={formData.current_symptoms}
                  onChange={(e) => handleChange('current_symptoms', e.target.value)}
                  placeholder="Current presenting symptoms..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Relevant Medications</Label>
                <Textarea
                  value={formData.medications_relevant}
                  onChange={(e) => handleChange('medications_relevant', e.target.value)}
                  placeholder="Medications relevant to referral..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Investigations Completed</Label>
              <Textarea
                value={formData.investigations_done}
                onChange={(e) => handleChange('investigations_done', e.target.value)}
                placeholder="Tests, scans, procedures already completed..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Preferred Timeframe</Label>
                <Input
                  value={formData.preferred_appointment_timeframe}
                  onChange={(e) => handleChange('preferred_appointment_timeframe', e.target.value)}
                  placeholder="e.g., Mornings preferred"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Patient Mobility</Label>
                <Select value={formData.patient_mobility} onValueChange={(value) => handleChange('patient_mobility', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select mobility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent</SelectItem>
                    <SelectItem value="assisted_walking">Assisted walking</SelectItem>
                    <SelectItem value="wheelchair">Wheelchair</SelectItem>
                    <SelectItem value="bedridden">Bedridden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Interpreter Needed</Label>
                <Select value={formData.interpreter_needed} onValueChange={(value) => handleChange('interpreter_needed', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Interpreter?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="mandarin">Mandarin</SelectItem>
                    <SelectItem value="other">Other (specify in notes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={generateReport}
                disabled={isGenerating || !selectedPatient}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Letter...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Referral Letter
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Report */}
      {generatedReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="no-print">
              <div className="flex justify-between items-center">
                <CardTitle>Generated Referral Letter</CardTitle>
                <Button variant="outline" className="gap-2" onClick={handlePrint}>
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                <div 
                  className="p-8 printable-content"
                  dangerouslySetInnerHTML={{ __html: generatedReport }}
                  style={{
                    fontFamily: 'Times New Roman, serif',
                    lineHeight: '1.6',
                    fontSize: '12px'
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
