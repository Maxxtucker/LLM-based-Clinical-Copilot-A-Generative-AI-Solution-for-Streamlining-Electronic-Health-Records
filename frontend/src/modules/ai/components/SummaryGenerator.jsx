import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Wand2, Loader2, Save, RefreshCw, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { generatePatientSummary } from "@/modules/ai/services/OpenAIService";

export default function SummaryGenerator({ patient, onSummaryGenerated }) {
  const [summary, setSummary] = useState(patient?.ai_summary_content || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-neutral-50">
        <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-neutral-100">
          <div className="space-y-3">
            <div className="flex items-center">
              <CardTitle className="flex items-center gap-2 text-xl text-neutral-800">
                <Brain className="w-5 h-5 text-purple-600" />
                AI-Generated Summary
              </CardTitle>
            </div>
            <div className="flex gap-2 justify-start">
              {summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSummary}
                  disabled={isGenerating}
                  className="gap-1 text-xs px-3 py-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </Button>
              )}
              <Button
                onClick={generateSummary}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 gap-1 text-xs px-3 py-1.5"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {!summary && !isGenerating && (
            <div className="text-center py-8 text-neutral-500">
              <Brain className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
              <p className="text-lg font-medium mb-2">No AI Summary Yet</p>
              <p className="text-sm">Click "Generate Summary" to create an AI-powered patient summary</p>
            </div>
          )}
          
          {(summary || isGenerating) && (
            <>
              {isGenerating ? (
                <div className="min-h-[300px] flex items-center justify-center text-neutral-500">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p>Generating comprehensive patient summary...</p>
                  </div>
                </div>
              ) : isEditing ? (
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[300px] text-sm leading-relaxed"
                  placeholder="AI-generated summary will appear here..."
                />
              ) : (
                <div className="min-h-[300px] p-6 border border-neutral-200 rounded-lg bg-white shadow-sm">
                  <div className="prose prose-sm max-w-none text-neutral-800 prose-headings:text-neutral-900 prose-headings:font-bold prose-h1:text-xl prose-h1:mb-4 prose-h1:border-b prose-h1:border-neutral-200 prose-h1:pb-2 prose-h1:uppercase prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-4 prose-h2:text-neutral-800 prose-h2:uppercase prose-h2:font-bold prose-strong:text-neutral-900 prose-strong:font-semibold prose-strong:block prose-strong:mb-1 prose-ul:my-2 prose-li:my-1 prose-p:my-2 prose-p:leading-relaxed prose-p:ml-0">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                </div>
              )}
              
              {summary && !isGenerating && (
                <div className="flex justify-end gap-3">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="gap-2 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="gap-2 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 gap-2"
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
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}