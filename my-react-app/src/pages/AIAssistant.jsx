import React, { useState, useRef, useEffect } from "react";
// import { Patient } from "./entities/Patient";
// import { InvokeLLM } from "@/integrations/Core";
import { Brain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import QuickPrompts from "../components/chat/QuickPrompts";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your AI medical assistant. I can help you analyze patient data, generate reports, and answer questions about your patients. What would you like to know?",
      isUser: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (userMessage) => {
    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      // Get all patient data to provide context
      // TEMP MOCK: replace Patient.list() with static mock data
      const patients = [
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
          vital_signs: {
            blood_pressure: "120/80",
            heart_rate: "75",
            temperature: "36.8°C"
          },
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
          vital_signs: {
            blood_pressure: "135/85",
            heart_rate: "88",
            temperature: "37.1°C"
          },
          diagnosis: "Angina",
          treatment_plan: "Further cardiac evaluation",
          ai_summary: false,
        }
      ];

      const prompt = `
        You are an AI medical assistant helping healthcare professionals analyze patient data and provide insights.
        
        Current patient database contains ${patients.length} patients with the following information:
        
        ${patients.map(patient => `
        Patient: ${patient.first_name} ${patient.last_name} (MRN: ${patient.medical_record_number})
        - Age: ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}
        - Gender: ${patient.gender || 'N/A'}
        - Status: ${patient.status}
        - Chief Complaint: ${patient.chief_complaint || 'None'}
        - Medical History: ${patient.medical_history || 'None'}
        - Current Medications: ${patient.current_medications || 'None'}
        - Allergies: ${patient.allergies || 'None'}
        - Vital Signs: BP: ${patient.vital_signs?.blood_pressure || 'N/A'}, HR: ${patient.vital_signs?.heart_rate || 'N/A'}, Temp: ${patient.vital_signs?.temperature || 'N/A'}
        - Diagnosis: ${patient.diagnosis || 'None'}
        - Treatment Plan: ${patient.treatment_plan || 'None'}
        - Has AI Summary: ${patient.ai_summary ? 'Yes' : 'No'}
        `).join('\n')}
        
        User Question: "${userMessage}"
        
        Please provide a helpful, professional response based on the patient data above. If the question requires specific medical analysis, provide detailed insights. If asking for patient lists or summaries, format them clearly. Always maintain patient confidentiality principles and provide clinically relevant information.
        
        Format your response in a clear, professional manner using markdown when appropriate for better readability.
      `;

      // const response = await InvokeLLM({ prompt });
      
      // Add AI response to chat
          // TEMP: Mock LLM response for front-end preview
      const response = `
      ### AI Summary:
      Here is a placeholder response from the AI assistant. Your LLM will eventually generate detailed medical insights here based on patient data and the user's query.

      This mock allows you to work on the front-end without wiring up a backend or LLM service.
      `;

      setMessages(prev => [...prev, { text: response, isUser: false }]);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { 
        text: "I apologize, but I encountered an error while processing your request. Please try again.", 
        isUser: false 
      }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-neutral-50 to-blue-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-neutral-200 p-6 shadow-sm"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">AI Medical Assistant</h1>
              <p className="text-neutral-600">Ask questions about your patients and get intelligent insights</p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-3 py-1 rounded-full">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-1">
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <QuickPrompts 
                onPromptSelect={handleSendMessage} 
                isLoading={isLoading}
              />
            </motion.div>
          )}
          
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message.text}
              isUser={message.isUser}
            />
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-neutral-500">Analyzing patient data...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}