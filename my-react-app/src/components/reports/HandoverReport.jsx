import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Download, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { PDFService } from "../../services/PDFService";

export default function HandoverReport({ patients, isLoading }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    handover_date: '',
    handover_time: '',
    from_team: '',
    to_team: '',
    handover_type: '',
    patient_location: '',
    current_condition: '',
    key_issues: '',
    active_problems: '',
    recent_changes: '',
    current_treatments: '',
    pending_investigations: '',
    tasks_to_complete: '',
    safety_concerns: '',
    family_communication: '',
    anticipated_needs: '',
    code_status: ''
  });
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
      const formattedHTML = PDFService.formatReportHTML(patient, formData, 'handover');
      setGeneratedReport(formattedHTML);
    } catch (error) {
      console.error('Error generating handover report:', error);
      alert('Error generating report. Please try again.');
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
    const filename = `handover_notes_${patient.medical_record_number}_${new Date().toISOString().split('T')[0]}.pdf`;

    try {
      const htmlContent = PDFService.formatReportHTML(patient, formData, 'handover');
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
            Handover Report Generator
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
            <CardTitle>Handover Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="handover-date">Handover Date</Label>
                <Input
                  id="handover-date"
                  type="date"
                  value={formData.handover_date}
                  onChange={(e) => handleChange('handover_date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="handover-time">Handover Time</Label>
                <Input
                  id="handover-time"
                  type="time"
                  value={formData.handover_time}
                  onChange={(e) => handleChange('handover_time', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="from-team">From Team</Label>
                <Input
                  id="from-team"
                  value={formData.from_team}
                  onChange={(e) => handleChange('from_team', e.target.value)}
                  placeholder="e.g., Day Shift Team A"
                />
              </div>

              <div>
                <Label htmlFor="to-team">To Team</Label>
                <Input
                  id="to-team"
                  value={formData.to_team}
                  onChange={(e) => handleChange('to_team', e.target.value)}
                  placeholder="e.g., Night Shift Team B"
                />
              </div>

              <div>
                <Label htmlFor="handover-type">Handover Type</Label>
                <Input
                  id="handover-type"
                  value={formData.handover_type}
                  onChange={(e) => handleChange('handover_type', e.target.value)}
                  placeholder="e.g., Shift, Transfer, Discharge"
                />
              </div>

              <div>
                <Label htmlFor="patient-location">Patient Location</Label>
                <Input
                  id="patient-location"
                  value={formData.patient_location}
                  onChange={(e) => handleChange('patient_location', e.target.value)}
                  placeholder="e.g., Room 101, Bed A"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="current-condition">Current Condition</Label>
                <Textarea
                  id="current-condition"
                  value={formData.current_condition}
                  onChange={(e) => handleChange('current_condition', e.target.value)}
                  placeholder="Describe patient's current condition..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="key-issues">Key Issues</Label>
                <Textarea
                  id="key-issues"
                  value={formData.key_issues}
                  onChange={(e) => handleChange('key_issues', e.target.value)}
                  placeholder="List key issues or concerns..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="safety-concerns">Safety Concerns</Label>
                <Textarea
                  id="safety-concerns"
                  value={formData.safety_concerns}
                  onChange={(e) => handleChange('safety_concerns', e.target.value)}
                  placeholder="Any safety concerns or precautions..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tasks-to-complete">Tasks to Complete</Label>
                <Textarea
                  id="tasks-to-complete"
                  value={formData.tasks_to_complete}
                  onChange={(e) => handleChange('tasks_to_complete', e.target.value)}
                  placeholder="Tasks that need to be completed..."
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
                    Generate Handover Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Report */}
      {generatedReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Handover Report</CardTitle>
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