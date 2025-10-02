import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Brain, Wand2, Loader2, Save, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { generatePatientSummary } from "../../services/OpenAIService";

export default function SummaryGenerator({ patient, onSummaryGenerated }) {
  const [summary, setSummary] = useState(patient.ai_summary_content || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const response = await generatePatientSummary(patient);
      setSummary(response);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Error generating summary. Please check your OpenAI API key and try again.');
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update the patient with the AI summary content
      const response = await fetch(`/api/patients/${patient._id || patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_summary: true,
          ai_summary_content: summary
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save summary');
      }

      const updatedPatient = await response.json();
      console.log('Summary saved successfully');
      
      // Show success message
      alert('AI Summary saved successfully!');
      
      // Call the callback if provided
      if (onSummaryGenerated) {
        await onSummaryGenerated(summary);
      }
    } catch (error) {
      console.error('Error saving summary:', error);
      alert('Failed to save summary. Please try again.');
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