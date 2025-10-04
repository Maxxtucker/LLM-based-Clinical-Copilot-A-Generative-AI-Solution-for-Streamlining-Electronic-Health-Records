
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FileText, Loader2, Download, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { PDFService } from "../../services/PDFService";
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

  const handlePrint = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    const patient = getSelectedPatientData();
    const filename = `discharge_summary_${patient.medical_record_number}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    try {
      const htmlContent = PDFService.formatReportHTML(patient, formData, 'discharge');
      await PDFService.generatePDF(htmlContent, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSelectedPatientData = () => {
    return patients.find(p => p.id.toString() === selectedPatient);
  };


  const generateReport = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setIsGenerating(true);
    const patient = getSelectedPatientData();

    try {
      // Generate formatted HTML using PDFService
      const formattedHTML = PDFService.formatReportHTML(patient, formData, 'discharge');
      setGeneratedReport(formattedHTML);

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
