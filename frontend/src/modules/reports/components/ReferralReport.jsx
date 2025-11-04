import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { PDFService } from "@/modules/reports/services/PDFService";

export default function ReferralReport({ patients, isLoading }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSelectedPatientData = () => {
    return patients.find(p => p.id.toString() === selectedPatient);
  };

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.medical_record_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const generateReport = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setIsGenerating(true);
    const patient = getSelectedPatientData();

    try {
      const formattedHTML = PDFService.formatReportHTML(patient, formData, 'referral');
      setGeneratedReport(formattedHTML);
    } catch (error) {
      console.error('Error generating referral report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    const patient = getSelectedPatientData();
    const filename = `referral_letter_${patient.medical_record_number}_${new Date().toISOString().split('T')[0]}.pdf`;

    try {
      const htmlContent = PDFService.formatReportHTML(patient, formData, 'referral');
      await PDFService.generatePDF(htmlContent, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
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
      {/* Patient Selection */}
      <Card className="border-0 shadow-sm no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Generate Referral Letter
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

      {/* Show form only if patient selected */}
      {selectedPatient && (
        <Card className="border-0 shadow-sm no-print">
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="9876 5432"
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
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  placeholder="e.g., Cardiology"
                />
              </div>

              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Input
                  id="urgency"
                  value={formData.urgency}
                  onChange={(e) => handleChange('urgency', e.target.value)}
                  placeholder="Urgent / Semi-urgent / Routine"
                />
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
                    Generate Referral Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
