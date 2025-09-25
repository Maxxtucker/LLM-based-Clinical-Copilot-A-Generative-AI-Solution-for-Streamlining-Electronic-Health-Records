
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FileText, Loader2, Download, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
//import { InvokeLLM } from "@/integrations/Core";

export default function DischargeReport({ patients, isLoading }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [formData, setFormData] = useState({
    admission_date: '',
    discharge_date: '',
    attending_physician: '',
    discharge_disposition: '',
    hospital_course: '',
    discharge_medications: '',
    follow_up_instructions: '',
    discharge_condition: '',
    primary_diagnosis: '',
    secondary_diagnoses: '',
    procedures_performed: '',
    complications: ''
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
    return patients.find(p => p.id.toString() === selectedPatient);
  };

  const selectedPatientData = getSelectedPatientData();

  const generateReport = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setIsGenerating(true);
    const patient = getSelectedPatientData();

    try {
      const prompt = `
        Generate a professional discharge summary in structured HTML format for the following patient:

        PATIENT INFORMATION:
        Name: ${patient.first_name} ${patient.last_name}
        MRN: ${patient.medical_record_number}
        Age: ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}
        Gender: ${patient.gender || 'N/A'}

        ADMISSION DETAILS:
        Admission Date: ${formData.admission_date}
        Discharge Date: ${formData.discharge_date}
        Attending Physician: ${formData.attending_physician}
        Length of Stay: ${formData.admission_date && formData.discharge_date ? 
          Math.ceil((new Date(formData.discharge_date) - new Date(formData.admission_date)) / (1000 * 60 * 60 * 24)) + ' days' : 'N/A'}

        CLINICAL INFORMATION:
        Primary Diagnosis: ${formData.primary_diagnosis || patient.diagnosis || 'N/A'}
        Secondary Diagnoses: ${formData.secondary_diagnoses || 'None'}
        Chief Complaint: ${patient.chief_complaint || 'N/A'}
        Medical History: ${patient.medical_history || 'N/A'}
        Procedures Performed: ${formData.procedures_performed || 'None'}
        Complications: ${formData.complications || 'None'}
        Hospital Course: ${formData.hospital_course || 'Standard recovery course'}

        DISCHARGE INFORMATION:
        Discharge Condition: ${formData.discharge_condition || 'Stable'}
        Discharge Disposition: ${formData.discharge_disposition || 'Home'}
        Discharge Medications: ${formData.discharge_medications || patient.current_medications || 'As prescribed'}
        Follow-up Instructions: ${formData.follow_up_instructions || 'Follow up with primary care physician in 1-2 weeks'}

        VITAL SIGNS (Last Recorded):
        Blood Pressure: ${patient.vital_signs?.blood_pressure || 'N/A'}
        Heart Rate: ${patient.vital_signs?.heart_rate || 'N/A'}
        Temperature: ${patient.vital_signs?.temperature || 'N/A'}

        Please format this as a structured HTML discharge summary with the following requirements:
        1. Use proper HTML structure with div tags and classes.
        2. Include a professional header with hospital/clinic letterhead style.
        3. Organize information in clear sections with headings (e.g., h2, h3).
        4. Use tables for structured data where appropriate (e.g., vital signs, medications, patient details if tabular).
        5. Maintain professional medical document formatting, akin to a clinical report.
        6. Ensure proper spacing and typography for readability.
        7. Make it print-ready and professional looking.
        8. Use modern CSS (e.g., Tailwind CSS classes if applicable for visual styling like borders, padding, text size).

        Return only the HTML content without any markdown formatting, code blocks, or additional text. Ensure the HTML is well-formed.
      `;

      //const response = await InvokeLLM({ prompt });
      //setGeneratedReport(response);
    } catch (error) {
      console.error('Error generating discharge report:', error);
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
            <FileText className="w-5 h-5 text-blue-600" />
            Discharge Summary Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Select Patient *</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger
                  className="mt-1"
                  renderValue={(val) => {
                    const patient = patients.find(p => p.id.toString() === val);
                    return patient
                      ? `${patient.first_name} ${patient.last_name} (${patient.medical_record_number})`
                      : "Choose a patient";
                  }}
                />
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.first_name} {patient.last_name} - {patient.medical_record_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discharge Details Form */}
      {selectedPatient && (
        <Card className="border-0 shadow-sm no-print">
          <CardHeader>
            <CardTitle>Discharge Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Admission Date *</Label>
                <Input
                  type="date"
                  value={formData.admission_date}
                  onChange={(e) => handleChange('admission_date', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Discharge Date *</Label>
                <Input
                  type="date"
                  value={formData.discharge_date}
                  onChange={(e) => handleChange('discharge_date', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Attending Physician *</Label>
                <Input
                  value={formData.attending_physician}
                  onChange={(e) => handleChange('attending_physician', e.target.value)}
                  placeholder="Dr. Smith"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Discharge Disposition</Label>
                <Select value={formData.discharge_disposition} onValueChange={(value) => handleChange('discharge_disposition', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select disposition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="skilled_nursing">Skilled Nursing Facility</SelectItem>
                    <SelectItem value="rehab">Rehabilitation Center</SelectItem>
                    <SelectItem value="assisted_living">Assisted Living</SelectItem>
                    <SelectItem value="hospice">Hospice Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Primary Diagnosis</Label>
                <Input
                  value={formData.primary_diagnosis}
                  onChange={(e) => handleChange('primary_diagnosis', e.target.value)}
                  placeholder="Primary diagnosis"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Discharge Condition</Label>
                <Select value={formData.discharge_condition} onValueChange={(value) => handleChange('discharge_condition', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="improved">Improved</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Hospital Course</Label>
              <Textarea
                value={formData.hospital_course}
                onChange={(e) => handleChange('hospital_course', e.target.value)}
                placeholder="Describe the patient's hospital course..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Procedures Performed</Label>
                <Textarea
                  value={formData.procedures_performed}
                  onChange={(e) => handleChange('procedures_performed', e.target.value)}
                  placeholder="List procedures performed..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Complications</Label>
                <Textarea
                  value={formData.complications}
                  onChange={(e) => handleChange('complications', e.target.value)}
                  placeholder="Any complications..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Discharge Medications</Label>
              <Textarea
                value={formData.discharge_medications}
                onChange={(e) => handleChange('discharge_medications', e.target.value)}
                placeholder="List discharge medications and instructions..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Follow-up Instructions</Label>
              <Textarea
                value={formData.follow_up_instructions}
                onChange={(e) => handleChange('follow_up_instructions', e.target.value)}
                placeholder="Follow-up appointments and instructions..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={generateReport}
                disabled={isGenerating || !selectedPatient}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Discharge Summary
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
                <CardTitle>Generated Discharge Summary</CardTitle>
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
