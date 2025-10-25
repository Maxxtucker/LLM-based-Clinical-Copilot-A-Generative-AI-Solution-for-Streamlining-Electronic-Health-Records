import React, { useState, useRef, useEffect } from "react";
import { Brain, Sparkles, FileText, Edit3, Download, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import ReportMessage from "../components/reports/ReportMessage";

import ReportInput from "../components/reports/ReportInput";
import ReportPrompts from "../components/reports/ReportPrompts";
import { classifyQuery } from "../services/RAGService";
import { generateComprehensiveReport, generateVisualizationData, generateEnhancedPDFContent, generateHTMLReportWithCharts } from "../services/ReportRAGService";

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function ReportGenerator() {
  const [messages, setMessages] = useState([
    {
      text: "👋 Welcome to the **Enhanced AI Report Generator**!\n\nI can help you generate comprehensive macro-level analysis reports about your patient population with **RAG-enhanced insights** and **data visualizations**.\n\n**Enhanced Features:**\n- 🔍 **RAG-powered analysis** with top-20 similar patients\n- 📊 **Data visualizations** and statistical insights\n- 📈 **Comprehensive reports** with demographics, patterns, and trends\n- 📄 **Enhanced PDF export** with visualizations\n\n**Try asking:**\n- \"Analyze disease distribution by age group\"\n- \"Generate demographic overview report\"\n- \"Show treatment outcomes analysis\"\n- \"Create cardiovascular risk assessment report\"\n\nWhat comprehensive report would you like me to generate?",
      isUser: false
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Report editing state
  const [generatedReport, setGeneratedReport] = useState("");
  const [editedReport, setEditedReport] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Enhanced report state
  const [visualizationData, setVisualizationData] = useState(null);
  // const [reportType, setReportType] = useState(""); // Removed unused variable

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to create chart data from visualization data
  const createChartData = (viz) => {
    console.log('Creating chart data for:', viz.title, viz.data);
    const labels = Object.keys(viz.data);
    const data = Object.values(viz.data);
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
      '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];

    const chartData = {
      labels,
      datasets: [{
        label: viz.title,
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2,
        hoverBackgroundColor: colors.slice(0, labels.length).map(color => color + '80'),
      }]
    };
    
    console.log('Generated chart data:', chartData);
    return chartData;
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#667eea',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          font: {
            size: 11,
            weight: 'bold'
          },
          stepSize: 1
        }
      },
      x: {
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          font: {
            size: 10,
            weight: 'bold'
          },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#667eea',
        borderWidth: 1
      }
    }
  };

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

      // Step 1: Get analytical text (markdown) from LLM via RAG
      const aiResponse = await generateComprehensiveReport(userMessage, patients);
      console.log('✅ Comprehensive report generated with RAG context');

      // Step 2: Build visualization data JSON
      const vizData = generateVisualizationData(patients, queryClassification);
      console.log('Generated visualization data:', vizData);
      setVisualizationData(vizData);

      // Step 3: Ask LLM to render full HTML with embedded charts
      try {
        const htmlReport = await generateHTMLReportWithCharts(aiResponse, vizData);
        setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
        setGeneratedReport(htmlReport); // now HTML
        setEditedReport(htmlReport);
      } catch (e) {
        console.error('Failed to create HTML report via LLM, falling back to markdown rendering:', e);
      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
      setGeneratedReport(aiResponse);
      setEditedReport(aiResponse);
      }

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
    const reportContent = isEditing ? editedReport : generatedReport;

    // If the report is already a complete HTML document (LLM-rendered), use it as-is.
    const isFullHtml = typeof reportContent === 'string' && (reportContent.trim().startsWith('<!DOCTYPE html>') || reportContent.trim().startsWith('<html'));

    // Helper to inject/ensure A4 CSS if HTML came from LLM
    const injectA4Css = (html) => {
      const a4Css = `@page{size:A4;margin:20mm;} body{font-family:Arial, sans-serif;font-size:11pt;line-height:1.5;color:#000;background:#fff;width:210mm;margin:0 auto;} h1,h2,h3{font-weight:700;margin:0 0 8px;} p,li{line-height:1.5;}`;
      if (/<head[^>]*>/i.test(html)) {
        return html.replace(/<head[^>]*>/i, (m) => `${m}\n<style>${a4Css}</style>`);
      }
      // No head tag: wrap it
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${a4Css}</style></head><body>${html}</body></html>`;
    };

    // Priority: if report is full HTML from LLM, use it verbatim (with minimal A4 CSS). Otherwise build our own HTML.
    let htmlContent = isFullHtml
      ? injectA4Css(reportContent)
      : (visualizationData
          ? generateEnhancedPDFContent(reportContent, visualizationData)
          : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Medical Report - Clinical Copilot</title>
                <style>@page{size:A4;margin:20mm;} body{font-family:Arial, sans-serif;font-size:11pt;line-height:1.5;margin:0;padding:20mm;color:#000;background:#fff;} h1{font-size:18pt;border-bottom:2px solid #333;padding-bottom:5px;} h2{font-size:16pt;border-bottom:1px solid #666;padding-bottom:3px;} h3{font-size:14pt;} strong{font-weight:bold;}</style>
              </head><body>
                <h1>COMPREHENSIVE MEDICAL REPORT</h1>
                ${reportContent
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
                  .replace(/\n/gim, '<br>')}
              </body></html>`);

    // Ensure a floating print button and a safe print hook exist for any HTML (LLM or our own)
    const injectPrintUI = (html) => {
      const btnCss = `.print-btn{position:fixed;top:12mm;right:12mm;background:#111;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;z-index:9999;font-size:12px} @media print{.print-btn{display:none}}`;
      const btnHtml = `<button class="print-btn" onclick="window.print()">Print</button>`;
      const hook = `<script>(function(){window.onbeforeprint=function(){ if(window.renderCharts) try{window.renderCharts()}catch(e){} };})();</script>`;
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (m) => `${m}\n<style>${btnCss}</style>`);
      }
      if (/<body[^>]*>/i.test(html)) {
        html = html.replace(/<body[^>]*>/i, (m) => `${m}${btnHtml}`);
        // Add hook right before closing body
        html = html.replace(/<\/body>/i, `${hook}</body>`);
      }
      return html;
    };
    htmlContent = injectPrintUI(htmlContent);

    // Open a brand-new tab and write the HTML directly (prevents blank page in some browsers)
    // New behavior: if the preview contains an iframe (LLM HTML), clone that exact HTML for download
    const iframe = document.querySelector('iframe[title="Report Preview (A4)"]');
    if (iframe && iframe.srcdoc) {
      // Ensure the LLM HTML has A4 rules and our print UI
      let clonedHtml = injectA4Css(iframe.srcdoc);
      clonedHtml = injectPrintUI(clonedHtml);
      const blob = new Blob([clonedHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        const a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return;
    }

    // Otherwise use htmlContent built above
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank');
    if (!opened) {
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
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
            <div className="p-6 flex-1 overflow-y-auto overflow-x-auto">
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
                <div className="space-y-6" style={{ width: '100%', overflowX: 'auto' }}>
                  
                  {/* Report Content */}
                  {/* A4 Medical Report Format */}
                  <div id="report-a4" className="bg-white shadow-lg mx-auto" style={{ 
                    width: '210mm', 
                    minHeight: '297mm', 
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12pt',
                    lineHeight: '1.4',
                    color: '#000',
                    minWidth: '210mm',
                    maxWidth: '100%'
                  }}>
                    {!(typeof generatedReport === 'string' && (generatedReport.trim().startsWith('<!DOCTYPE html') || generatedReport.trim().startsWith('<html')) ) && (
                      <div className="text-center mb-8 border-b-2 border-gray-300 pb-4 px-8">
                        <h1 className="text-2xl font-bold text-black mb-2">COMPREHENSIVE MEDICAL REPORT</h1>
                        <p className="text-sm font-bold text-gray-600">Generated by Clinical Copilot AI</p>
                        <p className="text-sm font-bold text-gray-600">Generated on: {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString()}</p>
                      </div>
                    )}

                    {/* Report Content with Professional Medical Formatting */}
                    {generatedReport.trim().startsWith('<!DOCTYPE html>') || generatedReport.trim().startsWith('<html') ? (
                      <iframe
                        title="Report Preview (A4)"
                        srcDoc={generatedReport}
                        style={{ width: '210mm', minHeight: '297mm', border: '1px solid #e5e7eb' }}
                />
              ) : (
                <div
                        className="medical-report-content px-8"
                        style={{ width: '100%' }}
                        dangerouslySetInnerHTML={{ 
                          __html: `
                            <style>
                              .medical-report-content { width: 100%; box-sizing: border-box; }
                              .medical-report-content p { width: 100%; max-width: none; text-align: justify; line-height: 1.6; }
                              .medical-report-content h1, .medical-report-content h2, .medical-report-content h3 { width: 100%; max-width: none; }
                              .medical-report-content li { width: 100%; max-width: none; }
                              .medical-report-content strong { display: inline; font-weight: bold; }
                              .medical-report-content * { box-sizing: border-box; }
                            </style>
                            ${generatedReport
                            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-black mt-6 mb-3 tracking-wide">$1</h3>')
                            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-black mt-8 mb-4 tracking-wide border-b border-gray-400 pb-1">$1</h2>')
                            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-black mt-8 mb-6 tracking-wide border-b-2 border-gray-600 pb-2">$1</h1>')
                            .replace(/^- (.*)$/gim, '<div class="bullet">$1</div>')
                            .replace(/^(\d+)\. (.*)$/gim, '<div class="numbered"><span class="num">$1.</span> $2</div>')
                            .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-black">$1</strong>')
                            .replace(/\*(.*?)\*/gim, '<em class="italic text-black">$1</em>')
                            .replace(/^\|(.*)\|$/gim, '<div class="bg-gray-100 p-3 my-2 font-bold text-black border border-gray-300">$1</div>')
                            .replace(/\n/gim, '<br>')}`
                        }}
                      />
                    )}
                  </div>
                  
                  {/* A4 Medical Report Charts Section */}
                  {visualizationData && !(typeof generatedReport === 'string' && (generatedReport.trim().startsWith('<!DOCTYPE html') || generatedReport.trim().startsWith('<html'))) && (
                    <div className="bg-white shadow-lg mt-4 mx-auto" style={{ 
                      width: '210mm', 
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '12pt',
                      lineHeight: '1.4',
                      color: '#000',
                      minWidth: '210mm'
                    }}>
                      {/* Charts Header */}
                      <div className="text-center mb-6 border-b-2 border-gray-300 pb-4 px-8">
                        <h2 className="text-xl font-bold text-black uppercase tracking-wide">DATA VISUALIZATIONS</h2>
                      </div>
                      
                      {/* Professional Charts Grid - A4 Format */}
                      <div className="grid grid-cols-1 gap-8 mb-6 px-8">
                        {visualizationData.visualizations.map((viz, index) => (
                          <div key={index} className="border border-gray-300 p-4">
                            <div className="mb-4">
                              <h3 className="text-lg font-bold text-black mb-2 uppercase tracking-wide">{viz.title}</h3>
                              <p className="text-sm font-bold text-gray-700 mb-3">{viz.description}</p>
                              <div className="flex gap-4 text-xs font-bold text-gray-600">
                                <span><strong>Chart Type:</strong> {viz.chartType}</span>
                                <span><strong>Data Points:</strong> {Object.keys(viz.data).length}</span>
                              </div>
                            </div>
                            
                            {/* Professional Chart Container */}
                            <div className="h-96 w-full border border-gray-200 bg-gray-50">
                              {viz.data && Object.keys(viz.data).length > 0 ? (
                                viz.chartType === 'Pie Chart' ? (
                                  <Pie data={createChartData(viz)} options={pieChartOptions} />
                                ) : viz.chartType === 'Bar Chart' ? (
                                  <Bar data={createChartData(viz)} options={chartOptions} />
                                ) : (
                                  <Line data={createChartData(viz)} options={chartOptions} />
                                )
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <div className="text-center text-gray-500">
                                    <div className="text-lg font-bold mb-2">📊 CHART DATA LOADING</div>
                                    <div className="text-sm font-bold">Generating visualization for {viz.title}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* A4 Summary Statistics */}
                      <div className="border border-gray-300 p-4 mx-8">
                        <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide border-b border-gray-400 pb-2">SUMMARY STATISTICS</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-3 border border-gray-300 bg-gray-50">
                            <div className="text-2xl font-bold text-black">{visualizationData.summary.totalPatients}</div>
                            <div className="text-sm font-bold text-gray-700">TOTAL PATIENTS</div>
                          </div>
                          <div className="text-center p-3 border border-gray-300 bg-gray-50">
                            <div className="text-2xl font-bold text-black">{visualizationData.summary.topConditions.length}</div>
                            <div className="text-sm font-bold text-gray-700">TOP CONDITIONS</div>
                          </div>
                          <div className="text-center p-3 border border-gray-300 bg-gray-50">
                            <div className="text-2xl font-bold text-black">{Object.keys(visualizationData.summary.ageGroups).length}</div>
                            <div className="text-sm font-bold text-gray-700">AGE GROUPS</div>
                          </div>
                          <div className="text-center p-3 border border-gray-300 bg-gray-50">
                            <div className="text-2xl font-bold text-black">{Object.keys(visualizationData.summary.genderDistribution).length}</div>
                            <div className="text-sm font-bold text-gray-700">GENDER CATEGORIES</div>
                          </div>
                        </div>
                        
                        {/* A4 Data Display */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="border border-gray-300 p-4">
                            <h5 className="font-bold text-black mb-4 uppercase tracking-wide border-b border-gray-400 pb-1">AGE DISTRIBUTION</h5>
                            <div className="space-y-2">
                              {Object.entries(visualizationData.summary.ageGroups).map(([age, count]) => (
                                <div key={age} className="flex items-center justify-between border border-gray-200 p-2 bg-gray-50">
                                  <span className="font-bold text-black">{age}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-300 h-2">
                                      <div 
                                        className="bg-gray-600 h-2" 
                                        style={{ width: `${(count / Math.max(...Object.values(visualizationData.summary.ageGroups))) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-bold text-black w-8 text-right">{count}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="border border-gray-300 p-4">
                            <h5 className="font-bold text-black mb-4 uppercase tracking-wide border-b border-gray-400 pb-1">TOP MEDICAL CONDITIONS</h5>
                            <div className="space-y-2">
                              {visualizationData.summary.topConditions.map((condition, idx) => (
                                <div key={idx} className="flex items-center justify-between border border-gray-200 p-2 bg-gray-50">
                                  <span className="font-bold text-black capitalize">{condition}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-300 h-2">
                                      <div 
                                        className="bg-gray-600 h-2" 
                                        style={{ width: `${((idx + 1) / visualizationData.summary.topConditions.length) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-bold text-black w-8 text-right">{idx + 1}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
