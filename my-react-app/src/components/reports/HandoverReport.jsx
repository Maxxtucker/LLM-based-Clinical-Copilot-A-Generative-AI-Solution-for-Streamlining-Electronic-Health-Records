import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Download, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

export default function HandoverReport({ patients, isLoading }) {
  const [selectedPatient, setSelectedPatient] = useState('');
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
        <div class="handover-report">
          <h1>MEDICAL HANDOVER REPORT</h1>
          <h2>Patient Information</h2>
          <p><strong>Name:</strong> ${patient.first_name} ${patient.last_name}</p>
          <p><strong>MRN:</strong> ${patient.medical_record_number}</p>
          <p><strong>Age:</strong> ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}</p>
          <p><strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
          
          <h2>Handover Details</h2>
          <p><strong>Date:</strong> ${formData.handover_date || new Date().toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${formData.handover_time || new Date().toLocaleTimeString()}</p>
          <p><strong>From Team:</strong> ${formData.from_team || 'Current Team'}</p>
          <p><strong>To Team:</strong> ${formData.to_team || 'Next Team'}</p>
          
          <h2>Situation</h2>
          <p><strong>Current Condition:</strong> ${formData.current_condition || 'Stable'}</p>
          <p><strong>Key Issues:</strong> ${formData.key_issues || 'None identified'}</p>
          
          <h2>Background</h2>
          <p><strong>Primary Diagnosis:</strong> ${patient.diagnosis || 'N/A'}</p>
          <p><strong>Medical History:</strong> ${patient.medical_history || 'N/A'}</p>
          <p><strong>Current Medications:</strong> ${patient.current_medications || 'N/A'}</p>
          
          <h2>Assessment</h2>
          <p><strong>Clinical Assessment:</strong> ${formData.current_condition || 'Patient stable, continue current care plan'}</p>
          <p><strong>Risk Factors:</strong> ${formData.safety_concerns || 'None identified'}</p>
          
          <h2>Recommendations</h2>
          <p><strong>Immediate Actions:</strong> ${formData.tasks_to_complete || 'Continue monitoring'}</p>
          <p><strong>Follow-up Required:</strong> ${formData.pending_investigations || 'Routine follow-up'}</p>
        </div>
      `;

      setGeneratedReport(mockResponse);
    } catch (error) {
      console.error('Error generating handover report:', error);
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
            Generate Handover Report
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
              <Select value={formData.handover_type} onValueChange={(value) => handleChange('handover_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shift">Shift Handover</SelectItem>
                  <SelectItem value="transfer">Patient Transfer</SelectItem>
                  <SelectItem value="discharge">Discharge Handover</SelectItem>
                  <SelectItem value="emergency">Emergency Handover</SelectItem>
                </SelectContent>
              </Select>
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
                  Generate Handover Report
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