
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Download, Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
//import { InvokeLLM } from "@/integrations/Core";

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
      const prompt = `
        Generate a professional medical handover report in structured HTML format using SBAR methodology:

        PATIENT INFORMATION:
        Name: ${patient.first_name} ${patient.last_name}
        MRN: ${patient.medical_record_number}
        Age: ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}
        Gender: ${patient.gender || 'N/A'}

        HANDOVER DETAILS:
        Date: ${formData.handover_date}
        Time: ${formData.handover_time}
        From Team: ${formData.from_team}
        To Team: ${formData.to_team}
        Handover Type: ${formData.handover_type}
        Patient Location: ${formData.patient_location}

        SITUATION:
        Current Condition: ${formData.current_condition || 'Stable'}
        Key Issues: ${formData.key_issues}
        Recent Changes: ${formData.recent_changes || 'No significant changes'}

        BACKGROUND:
        Primary Diagnosis: ${patient.diagnosis || 'N/A'}
        Medical History: ${patient.medical_history || 'N/A'}
        Current Medications: ${patient.current_medications || 'N/A'}
        Allergies: ${patient.allergies || 'NKDA'}
        Active Problems: ${formData.active_problems}

        ASSESSMENT:
        Current Vital Signs:
        BP: ${patient.vital_signs?.blood_pressure || 'N/A'}
        HR: ${patient.vital_signs?.heart_rate || 'N/A'}
        Temp: ${patient.vital_signs?.temperature || 'N/A'}
        
        Current Treatments: ${formData.current_treatments || patient.treatment_plan || 'N/A'}
        Pending Investigations: ${formData.pending_investigations || 'None'}

        RECOMMENDATIONS/ACTIONS:
        Tasks to Complete: ${formData.tasks_to_complete || 'None specified'}
        Safety Concerns: ${formData.safety_concerns || 'None identified'}
        Anticipated Needs: ${formData.anticipated_needs || 'Continue current care'}

        ADDITIONAL INFORMATION:
        Family Communication: ${formData.family_communication || 'N/A'}
        Code Status: ${formData.code_status || 'Not specified'}

        Please format this as a structured HTML handover report with:
        1. Clear SBAR (Situation, Background, Assessment, Recommendations) format
        2. Professional medical document header with handover details
        3. Tables for organized data (vital signs, medications, tasks)
        4. Color-coded sections for easy reference during handover
        5. Clear action items and priority tasks highlighted
        6. Professional typography suitable for quick reference
        7. Structured layout for care transition documentation
        8. Print-friendly format with clear sections

        Return only the HTML content without markdown formatting.
      `;

      //const response = await InvokeLLM({ prompt });
      //setGeneratedReport(response);
    } catch (error) {
      console.error('Error generating handover report:', error);
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
            <Download className="w-5 h-5 text-purple-600" />
            Handover Notes Generator
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

      {/* Handover Details Form */}
      {selectedPatient && (
        <Card className="border-0 shadow-sm no-print">
          <CardHeader>
            <CardTitle>Handover Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Handover Date *</Label>
                <Input
                  type="date"
                  value={formData.handover_date}
                  onChange={(e) => handleChange('handover_date', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Handover Time *</Label>
                <Input
                  type="time"
                  value={formData.handover_time}
                  onChange={(e) => handleChange('handover_time', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">From Team *</Label>
                <Input
                  value={formData.from_team}
                  onChange={(e) => handleChange('from_team', e.target.value)}
                  placeholder="Day Team / Night Team"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">To Team *</Label>
                <Input
                  value={formData.to_team}
                  onChange={(e) => handleChange('to_team', e.target.value)}
                  placeholder="Day Team / Night Team"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Handover Type *</Label>
                <Select value={formData.handover_type} onValueChange={(value) => handleChange('handover_type', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select handover type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shift_change">Shift Change</SelectItem>
                    <SelectItem value="transfer">Transfer Between Units</SelectItem>
                    <SelectItem value="discharge_planning">Discharge Planning</SelectItem>
                    <SelectItem value="procedure">Pre/Post Procedure</SelectItem>
                    <SelectItem value="specialist_consult">Specialist Consult</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Patient Location</Label>
                <Input
                  value={formData.patient_location}
                  onChange={(e) => handleChange('patient_location', e.target.value)}
                  placeholder="Ward 3A, Room 312, Bed 2"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Current Condition & Key Issues *</Label>
              <Textarea
                value={formData.key_issues}
                onChange={(e) => handleChange('key_issues', e.target.value)}
                placeholder="Current condition and main issues requiring attention..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Active Problems</Label>
                <Textarea
                  value={formData.active_problems}
                  onChange={(e) => handleChange('active_problems', e.target.value)}
                  placeholder="Current active medical problems..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Recent Changes</Label>
                <Textarea
                  value={formData.recent_changes}
                  onChange={(e) => handleChange('recent_changes', e.target.value)}
                  placeholder="Recent changes in condition or treatment..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Current Treatments</Label>
                <Textarea
                  value={formData.current_treatments}
                  onChange={(e) => handleChange('current_treatments', e.target.value)}
                  placeholder="Current medications and treatments..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Pending Investigations</Label>
                <Textarea
                  value={formData.pending_investigations}
                  onChange={(e) => handleChange('pending_investigations', e.target.value)}
                  placeholder="Tests, scans, or procedures pending..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-neutral-700">Tasks to Complete</Label>
              <Textarea
                value={formData.tasks_to_complete}
                onChange={(e) => handleChange('tasks_to_complete', e.target.value)}
                placeholder="Specific tasks the next team needs to complete..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Safety Concerns</Label>
                <Textarea
                  value={formData.safety_concerns}
                  onChange={(e) => handleChange('safety_concerns', e.target.value)}
                  placeholder="Fall risk, infection precautions, etc..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Anticipated Needs</Label>
                <Textarea
                  value={formData.anticipated_needs}
                  onChange={(e) => handleChange('anticipated_needs', e.target.value)}
                  placeholder="What might the patient need during the next shift..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700">Family Communication</Label>
                <Textarea
                  value={formData.family_communication}
                  onChange={(e) => handleChange('family_communication', e.target.value)}
                  placeholder="Family updates, concerns, contact information..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Code Status</Label>
                <Select value={formData.code_status} onValueChange={(value) => handleChange('code_status', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select code status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_code">Full Code</SelectItem>
                    <SelectItem value="dnr">DNR (Do Not Resuscitate)</SelectItem>
                    <SelectItem value="dni">DNI (Do Not Intubate)</SelectItem>
                    <SelectItem value="comfort_care">Comfort Care Only</SelectItem>
                    <SelectItem value="limited_intervention">Limited Intervention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={generateReport}
                disabled={isGenerating || !selectedPatient}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Notes...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Handover Notes
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
                <CardTitle>Generated Handover Notes</CardTitle>
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
