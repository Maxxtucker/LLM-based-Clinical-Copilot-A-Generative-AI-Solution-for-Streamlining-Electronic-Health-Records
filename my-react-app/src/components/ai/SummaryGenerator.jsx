import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Wand2, Loader2, Save, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { InvokeLLM } from "@/integrations/Core";

export default function SummaryGenerator({ patient, onSummaryGenerated }) {
  const [summary, setSummary] = useState(patient.ai_summary || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const prompt = `
        Please generate a comprehensive medical patient summary for the following patient information. 
        Focus on key medical insights, patterns, and important clinical considerations.
        
        Patient Information:
        - Name: ${patient.first_name} ${patient.last_name}
        - Age: ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}
        - Gender: ${patient.gender || 'N/A'}
        - MRN: ${patient.medical_record_number}
        
        Chief Complaint: ${patient.chief_complaint || 'None provided'}
        
        Medical History: ${patient.medical_history || 'None provided'}
        
        Current Medications: ${patient.current_medications || 'None provided'}
        
        Allergies: ${patient.allergies || 'None provided'}
        
        Current Symptoms: ${patient.symptoms || 'None provided'}
        
        Lab Results: ${patient.lab_results || 'None provided'}
        
        Vital Signs:
        - Blood Pressure: ${patient.vital_signs?.blood_pressure || 'N/A'}
        - Heart Rate: ${patient.vital_signs?.heart_rate || 'N/A'}
        - Temperature: ${patient.vital_signs?.temperature || 'N/A'}
        - Weight: ${patient.vital_signs?.weight || 'N/A'}
        - Height: ${patient.vital_signs?.height || 'N/A'}
        
        Diagnosis: ${patient.diagnosis || 'None provided'}
        
        Treatment Plan: ${patient.treatment_plan || 'None provided'}
        
        Please provide a structured summary that includes:
        1. Patient Overview
        2. Key Medical Concerns
        3. Clinical Assessment
        4. Treatment Recommendations
        5. Follow-up Considerations
        
        Keep the summary professional, concise, and clinically relevant.
      `;

      const response = await InvokeLLM({ prompt });
      setSummary(response);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSummaryGenerated(summary);
    } catch (error) {
      console.error('Error saving summary:', error);
    }
    setIsSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Brain className="w-5 h-5 text-purple-600" />
              AI-Generated Summary
            </CardTitle>
            <div className="flex gap-2">
              {summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSummary}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
              )}
              <Button
                onClick={generateSummary}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!summary && !isGenerating && (
            <div className="text-center py-8 text-neutral-500">
              <Brain className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
              <p className="text-lg font-medium mb-2">No AI Summary Yet</p>
              <p className="text-sm">Click "Generate Summary" to create an AI-powered patient summary</p>
            </div>
          )}
          
          {(summary || isGenerating) && (
            <>
              <Textarea
                value={isGenerating ? 'Generating comprehensive patient summary...' : summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-[300px] text-sm leading-relaxed"
                placeholder="AI-generated summary will appear here..."
                disabled={isGenerating}
              />
              
              {summary && !isGenerating && (
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Summary
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}