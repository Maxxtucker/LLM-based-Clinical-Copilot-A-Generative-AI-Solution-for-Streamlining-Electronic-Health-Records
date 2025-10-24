import React, { useState, useRef, useEffect } from "react";
import { Brain, Sparkles, FileText, Edit3, Download, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import ReportMessage from "../components/reports/ReportMessage";
import { Button } from "../components/ui/button";

import ReportInput from "../components/reports/ReportInput";
import ReportPrompts from "../components/reports/ReportPrompts";
import { generateRAGPatientInsights, classifyQuery } from "../services/RAGService";

export default function ReportGenerator() {
  const [messages, setMessages] = useState([
    {
      text: "👋 Welcome to the **AI Report Generator**!\n\nI can help you generate comprehensive macro-level analysis reports about your patient population.\n\n**Try asking:**\n- \"Analyze disease distribution by age group\"\n- \"Generate demographic overview report\"\n- \"Show treatment outcomes analysis\"\n\nWhat report would you like me to generate?",
      isUser: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Report editing state
  const [generatedReport, setGeneratedReport] = useState("");
  const [editedReport, setEditedReport] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (userMessage) => {
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      const apiResponse = await fetch('/api/patients');
      let patients = [];
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        patients = data;
      } else {
        // Fallback mock data
        patients = [
          {
            id: 1,
            first_name: "Alice",
            last_name: "Tan",
            gender: "female",
            date_of_birth: "1988-05-12",
            phone: "+65 9123 4567",
            status: "active",
            medical_record_number: "MRN001",
            chief_complaint: "Frequent headaches for the past 2 weeks",
            medical_history: "Hypertension",
            current_medications: "Paracetamol",
            allergies: "Penicillin",
            vital_signs: { blood_pressure: "120/80", heart_rate: "75", temperature: "36.8°C" },
            diagnosis: "Migraine",
            treatment_plan: "Lifestyle modification, pain management",
            ai_summary: true,
          },
          {
            id: 2,
            first_name: "John",
            last_name: "Lim",
            gender: "male",
            date_of_birth: "1975-09-23",
            phone: "+65 9876 5432",
            status: "inactive",
            medical_record_number: "MRN002",
            chief_complaint: "Chest pain when exercising",
            medical_history: "Hyperlipidemia",
            current_medications: "Atorvastatin",
            allergies: "None",
            vital_signs: { blood_pressure: "135/85", heart_rate: "88", temperature: "37.1°C" },
            diagnosis: "Angina",
            treatment_plan: "Further cardiac evaluation",
            ai_summary: false,
          }
        ];
      }

      const queryClassification = classifyQuery(userMessage);
      console.log('Query classified as:', queryClassification);

      const aiResponse = await generateRAGPatientInsights(patients, userMessage);
      console.log('✅ RAG-enhanced AI response received');

      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
      
      // Update the report preview
      setGeneratedReport(aiResponse);
      setEditedReport(aiResponse);

    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { 
        text: "I encountered an error while processing your request. Please try again.", 
        isUser: false 
      }]);
    }

    setIsLoading(false);
  };

  const handleEdit = () => setIsEditing(true);
  const handleSaveEdit = () => { setGeneratedReport(editedReport); setIsEditing(false); };
  const handleCancelEdit = () => { setEditedReport(generatedReport); setIsEditing(false); };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const reportContent = isEditing ? editedReport : generatedReport;
    const htmlContent = reportContent
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Report - MediSynth AI</title>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#fafafa] to-[#FEF5F5]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-neutral-200 p-6 shadow-sm"
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">AI Report Generator</h1>
            <p className="text-neutral-600">Generate custom macro-level patient analysis reports</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-gradient-to-r from-red-100 to-pink-100 px-3 py-1 rounded-full">
            <Sparkles className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              To be filled up
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Split View */}
      <div className="flex-1 flex max-w-[1800px] mx-auto w-full gap-6 p-6">
        {/* Left Side - Chat */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                <ReportPrompts onPromptSelect={handleSendMessage} isLoading={isLoading} />
              </motion.div>
            )}
            
            {messages.map((message, index) => (
              <ReportMessage key={index} message={message.text} isUser={message.isUser} />
            ))}

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-neutral-50 border border-rose-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-orange-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-neutral-600">Analyzing patient data and generating report...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-neutral-200">
            <ReportInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>


        {/* Right Side - Report Preview */}
        <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900"> Report Preview</h2>
            <div className="flex gap-2">
              {!isEditing && <button onClick={handleEdit}><Edit3 /></button>}
              {isEditing && (
                <>
                  <button onClick={handleSaveEdit}><Save /></button>
                  <button onClick={handleCancelEdit}><X /></button>
                </>
              )}
              <button onClick={exportToPDF}><Download /></button>
            </div>
          </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {!generatedReport ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-neutral-600 mb-2">No Report Generated Yet</h3>
                  <p className="text-sm max-w-md">
                    Use the chat on the left to request a report. Once generated, it will appear here for preview and editing.
                  </p>
                </div>
              ) : isEditing ? (
                <textarea
                  className="w-full h-full border border-neutral-300 p-4 rounded-lg"
                  value={editedReport}
                  onChange={(e) => setEditedReport(e.target.value)}
                />
              ) : (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedReport.replace(/\n/g, "<br>") }}
                />
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
