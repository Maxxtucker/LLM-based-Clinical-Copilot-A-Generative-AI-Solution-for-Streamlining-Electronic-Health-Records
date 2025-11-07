import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Wand2, Loader2, Save, RefreshCw, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { generatePatientSummary } from "@/modules/ai/services/OpenAIService";
import { getVisits, getCheckups } from "@/modules/patients/services/PatientService.ts";

export default function SummaryGenerator({ patient, onSummaryGenerated }) {
  const [summary, setSummary] = useState(patient?.ai_summary_content || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      // Fetch recent visits and checkups for comprehensive context
      const [visits, checkups] = await Promise.all([
        getVisits(patient._id || patient.id, 5), // Get last 5 visits
        getCheckups(patient._id || patient.id, 5) // Get last 5 checkups
      ]);
      
      const response = await generatePatientSummary(patient, visits, checkups);
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

      await response.json();
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
      <style>{`
        .summary-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .summary-scroll::-webkit-scrollbar-track {
          background: #e0f2fe;
          border-radius: 4px;
        }
        .summary-scroll::-webkit-scrollbar-thumb {
          background: #93c5fd;
          border-radius: 4px;
        }
        .summary-scroll::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
      `}</style>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white rounded-t-lg">
          <div className="space-y-3">
            <div className="flex items-center">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                AI-Generated Patient Summary
              </CardTitle>
            </div>
            <div className="flex gap-2 justify-start pt-2">
              {summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSummary}
                  disabled={isGenerating}
                  className="gap-1 text-xs px-3 py-1.5 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </Button>
              )}
              <Button
                onClick={generateSummary}
                disabled={isGenerating}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-200 gap-1 text-xs px-3 py-1.5 font-semibold"
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
                    {summary ? 'Regenerate Summary' : 'Generate Summary'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {!summary && !isGenerating && (
            <div className="h-[400px] flex items-center justify-center border-2 border-blue-100 rounded-xl bg-gradient-to-br from-white via-blue-50/20 to-white">
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-neutral-700 mb-2">No AI Summary Yet</p>
                <p className="text-sm text-neutral-500 max-w-md mx-auto">
                  Click "Generate Summary" to create an AI-powered comprehensive patient summary based on their medical history, visits, and vital signs.
                </p>
              </div>
            </div>
          )}
          
          {(summary || isGenerating) && (
            <>
              {isGenerating ? (
                <div className="h-[400px] flex items-center justify-center border-2 border-blue-100 rounded-xl bg-gradient-to-br from-white via-blue-50/20 to-white">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                    <p className="text-base font-medium text-neutral-700 mb-1">Generating Summary</p>
                    <p className="text-sm text-neutral-500">Analyzing patient data and creating comprehensive summary...</p>
                  </div>
                </div>
              ) : isEditing ? (
                <div className="h-[400px] border-2 border-blue-100 rounded-xl bg-white">
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="h-full text-sm leading-relaxed resize-none rounded-xl"
                    placeholder="AI-generated summary will appear here..."
                  />
                </div>
              ) : (
                <div className="summary-scroll h-[400px] p-6 border-2 border-blue-100 rounded-xl bg-gradient-to-br from-white via-blue-50/20 to-white shadow-inner overflow-y-auto">
                  <div className="prose prose-sm max-w-none 
                    prose-headings:font-bold prose-headings:text-neutral-900 prose-headings:mt-0
                    prose-h1:text-2xl prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b-2 prose-h1:border-blue-200 prose-h1:text-blue-900
                    prose-h2:text-lg prose-h2:mb-4 prose-h2:mt-6 prose-h2:text-blue-800 prose-h2:font-semibold prose-h2:pb-2 prose-h2:border-b prose-h2:border-neutral-200
                    prose-h3:text-base prose-h3:mb-3 prose-h3:mt-4 prose-h3:text-neutral-800 prose-h3:font-semibold
                    prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:my-3 prose-p:text-[14px]
                    prose-strong:text-neutral-900 prose-strong:font-semibold
                    prose-ul:my-4 prose-ul:pl-6 prose-ul:space-y-2
                    prose-li:text-neutral-700 prose-li:leading-relaxed prose-li:marker:text-blue-600 prose-li:text-[14px]
                    prose-ol:my-4 prose-ol:pl-6 prose-ol:space-y-2
                    prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:italic
                    prose-table:w-full prose-table:my-4 prose-table:border-collapse
                    prose-th:bg-blue-50 prose-th:border prose-th:border-neutral-300 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-neutral-900
                    prose-td:border prose-td:border-neutral-300 prose-td:px-4 prose-td:py-2 prose-td:text-neutral-700
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-700 hover:prose-a:underline
                    prose-hr:border-neutral-200 prose-hr:my-6">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => (
                          <h1 className="text-2xl font-bold text-blue-900 mb-4 pb-3 border-b-2 border-blue-200" {...props} />
                        ),
                        h2: ({node, ...props}) => (
                          <h2 className="text-lg font-semibold text-blue-800 mb-3 mt-5 pb-2 border-b border-neutral-200" {...props} />
                        ),
                        h3: ({node, ...props}) => (
                          <h3 className="text-base font-semibold text-neutral-800 mb-2 mt-4" {...props} />
                        ),
                        p: ({node, ...props}) => (
                          <p className="text-neutral-700 leading-relaxed my-3 text-sm" {...props} />
                        ),
                        ul: ({node, ...props}) => (
                          <ul className="list-disc pl-6 space-y-2 my-4" {...props} />
                        ),
                        ol: ({node, ...props}) => (
                          <ol className="list-decimal pl-6 space-y-2 my-4" {...props} />
                        ),
                        li: ({node, ...props}) => (
                          <li className="text-neutral-700 leading-relaxed text-sm marker:text-blue-600 mb-1.5 pl-1" {...props} />
                        ),
                        strong: ({node, ...props}) => (
                          <strong className="font-semibold text-neutral-900" {...props} />
                        ),
                        code: ({node, inline, ...props}) => 
                          inline ? (
                            <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                          ) : (
                            <code className="block bg-neutral-100 text-neutral-800 p-3 rounded-lg text-xs font-mono my-3 overflow-x-auto" {...props} />
                          ),
                        blockquote: ({node, ...props}) => (
                          <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-4 italic text-neutral-700" {...props} />
                        ),
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-neutral-300 rounded-lg" {...props} />
                          </div>
                        ),
                        th: ({node, ...props}) => (
                          <th className="bg-blue-50 border border-neutral-300 px-4 py-2 text-left font-semibold text-neutral-900" {...props} />
                        ),
                        td: ({node, ...props}) => (
                          <td className="border border-neutral-300 px-4 py-2 text-neutral-700" {...props} />
                        ),
                        hr: ({node, ...props}) => (
                          <hr className="border-neutral-200 my-6" {...props} />
                        ),
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              {summary && !isGenerating && (
                <div className="flex justify-end gap-3">
                  {!isEditing ? (
                    <>
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="gap-2 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
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