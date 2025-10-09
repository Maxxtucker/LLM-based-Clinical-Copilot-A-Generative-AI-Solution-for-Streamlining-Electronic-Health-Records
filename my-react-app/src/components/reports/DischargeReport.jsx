import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { FileText, Loader2, Download, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { PDFService } from "../../services/PDFService";

export default function DischargeReport({ patients, isLoading }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
  const [showDropdown, setShowDropdown] = useState(false);

  const getSelectedPatientData = () => {
    return patients.find(p => p.id.toString() === selectedPatient);
  };

  // Auto-fill admission_date, discharge_date (today), and primary_diagnosis when patient changes
  useEffect(() => {
    if (selectedPatient) {
      const patient = getSelectedPatientData();
      if (patient) {
        setFormData(prev => ({
          ...prev,
          admission_date: patient.createdAt ? patient.createdAt.split('T')[0] : '',
          discharge_date: new Date().toISOString().split('T')[0], // default today
          primary_diagnosis: patient.diagnosis || '',
          // optionally reset other fields if needed:
          // attending_physician: '',
          // discharge_disposition: '',
          // hospital_course: '',
          // etc.
        }));
      }
    } else {
      // Clear form if no patient selected
      setFormData({
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
    }
  }, [selectedPatient, patients]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateReport = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setIsGenerating(true);
    const patient = getSelectedPatientData();

    try {
      const formattedHTML = PDFService.formatReportHTML(patient, formData, 'discharge');
      setGeneratedReport(formattedHTML);
    } catch (error) {
      console.error('Error generating discharge report:', error);
      alert('Error generating report. Please try again.');
    }
    setIsGenerating(false);
  };

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

  const filteredPatients = patients.filter((p) =>
    `${p.first_name} ${p.last_name} ${p.medical_record_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
              <div className="relative mt-1">
                <Input
                  type="text"
                  readOnly
                  placeholder="Select a patient..."
                  value={
                    selectedPatient
                      ? `${getSelectedPatientData()?.first_name} ${getSelectedPatientData()?.last_name} (${getSelectedPatientData()?.medical_record_number})`
                      : ''
                  }
                  onClick={() => setShowDropdown(prev => !prev)}
                />
                {showDropdown && (
                <div className="absolute z-10 w-full mt-1 max-h-[320px] bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden">
                  {/* Search bar inside dropdown */}
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      autoFocus
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="max-h-[240px] overflow-y-auto">
                    {/* Empty option at the top */}
                    <div
                      key="empty-option"
                      onMouseDown={() => {
                        setSelectedPatient('');
                        setSearchTerm('');
                        setShowDropdown(false);
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-500"
                    >
                      — None / Clear Selection —
                    </div>

                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onMouseDown={() => {
                            setSelectedPatient(patient.id.toString());
                            setSearchTerm('');
                            setShowDropdown(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            selectedPatient === patient.id.toString() ? "bg-blue-100" : ""
                          }`}
                        >
                          {patient.first_name} {patient.last_name} - {patient.medical_record_number}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">No patients found</div>
                    )}
                  </div>
                </div>
              )}
              </div>
              {selectedPatient && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {
                    patients.find(p => p.id.toString() === selectedPatient)?.first_name
                  } {
                    patients.find(p => p.id.toString() === selectedPatient)?.last_name
                  }
                </p>
              )}
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
                <Label>Admission Date *</Label>
                <Input
                  type="date"
                  value={formData.admission_date}
                  onChange={(e) => handleChange('admission_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Discharge Date *</Label>
                <Input
                  type="date"
                  value={formData.discharge_date}
                  onChange={(e) => handleChange('discharge_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Attending Physician *</Label>
                <Input
                  value={formData.attending_physician}
                  onChange={(e) => handleChange('attending_physician', e.target.value)}
                  placeholder="Dr. Smith"
                />
              </div>
              <div>
                <Label>Discharge Disposition</Label>
                <Input
                  value={formData.discharge_disposition}
                  onChange={(e) => handleChange('discharge_disposition', e.target.value)}
                  placeholder="e.g., Home, Rehab, Hospice"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Diagnosis</Label>
                <Input
                  value={formData.primary_diagnosis}
                  onChange={(e) => handleChange('primary_diagnosis', e.target.value)}
                />
              </div>
              <div>
                <Label>Discharge Condition</Label>
                <Input
                  value={formData.discharge_condition}
                  onChange={(e) => handleChange('discharge_condition', e.target.value)}
                  placeholder="e.g., Stable, Improved"
                />
              </div>
            </div>

            <div>
              <Label>Hospital Course</Label>
              <Textarea
                value={formData.hospital_course}
                onChange={(e) => handleChange('hospital_course', e.target.value)}
                placeholder="Describe the patient's hospital course..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Procedures Performed</Label>
                <Textarea
                  value={formData.procedures_performed}
                  onChange={(e) => handleChange('procedures_performed', e.target.value)}
                />
              </div>
              <div>
                <Label>Complications</Label>
                <Textarea
                  value={formData.complications}
                  onChange={(e) => handleChange('complications', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Discharge Medications</Label>
              <Textarea
                value={formData.discharge_medications}
                onChange={(e) => handleChange('discharge_medications', e.target.value)}
              />
            </div>

            <div>
              <Label>Follow-up Instructions</Label>
              <Textarea
                value={formData.follow_up_instructions}
                onChange={(e) => handleChange('follow_up_instructions', e.target.value)}
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
