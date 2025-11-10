import React, { useState, useRef, useEffect } from "react";
import { Brain, FileText, Edit3, Download, Save, X, Zap, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";
import ReportMessage from "@/modules/reports/components/ReportMessage";
import ReportInput from "@/modules/reports/components/ReportInput";
import ReportPrompts from "@/modules/reports/components/ReportPrompts";
import { classifyQuery } from "@/modules/ai/services/RAGService";
import {
  generateComprehensiveReport,
  generateVisualizationData,
  generateEnhancedPDFContent,
  generateHTMLReportWithCharts,
} from "@/modules/reports/services/ReportRAGService";

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
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut, PolarArea, Radar, Scatter, Bubble } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
);

export default function ReportGenerator() {
  const [messages, setMessages] = useState([
    {
      text: "👋 Welcome to the **Enhanced AI Report Generator**!\n\nI can help you generate comprehensive macro-level analysis reports about your patient population with **RAG-enhanced insights** and **data visualizations**.\n\n**Enhanced Features:**\n- 🔍 **Smart patient filtering** using RAG and keyword matching to find relevant patients\n- 📊 **Data visualizations** and statistical insights\n- 📈 **Comprehensive reports** with demographics, patterns, and trends\n- 📄 **Enhanced PDF export** with visualizations\n\n**Try asking the quick prompts above!**",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportMode, setReportMode] = useState('fast'); // 'fast' or 'deep'
  
  // Report editing state
  const [generatedReport, setGeneratedReport] = useState("");
  const [editedReport, setEditedReport] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Enhanced report state
  const [visualizationData, setVisualizationData] = useState(null);
  const [lastRelevantPatientCount, setLastRelevantPatientCount] = useState(0);
  // const [reportType, setReportType] = useState(""); // Removed unused variable

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  const summaryData = visualizationData?.summary || {};
  const summaryAgeGroups = summaryData?.ageGroups ? Object.entries(summaryData.ageGroups) : [];
  const summaryGenderDistribution = summaryData?.genderDistribution ? Object.entries(summaryData.genderDistribution) : [];
  const summaryTopConditions = Array.isArray(summaryData?.topConditions) ? summaryData.topConditions : [];
  const summaryKeyFindings = Array.isArray(summaryData?.keyFindings) ? summaryData.keyFindings : [];
  const topConditionsDisplay = summaryTopConditions.length > 0
    ? summaryTopConditions
    : summaryKeyFindings.map((finding, idx) => ({ condition: finding, count: null, id: idx }));
  const totalPatientsDisplay = summaryData?.totalPatients ?? lastRelevantPatientCount ?? 0;
  const maxAgeGroupCount = summaryAgeGroups.reduce((max, [, count]) => Math.max(max, Number(count) || 0), 0) || 1;
  const normalizedTopConditions = topConditionsDisplay.map((item, idx) => {
    if (typeof item === 'string') {
      return { condition: item, count: null, id: idx };
    }
    return item;
  });
  const maxConditionCount = normalizedTopConditions.reduce((max, item) => Math.max(max, Number(item.count) || 0), 0) || 1;

  const scrollToBottom = () => {
    if (shouldAutoScroll.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Only auto-scroll when user sends a message, not when AI responds
  useEffect(() => {
    // Only scroll if the last message is from the user
    if (messages.length > 0 && messages[messages.length - 1]?.isUser) {
      shouldAutoScroll.current = true;
      scrollToBottom();
    } else {
      // Don't auto-scroll when AI responds
      shouldAutoScroll.current = false;
    }
  }, [messages]);

  const defaultChartColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];

  const resolveChartType = (viz) => {
    const typeSource = (viz?.chartType || viz?.type || 'bar').toString().toLowerCase();
    if (typeSource.includes('doughnut')) return 'doughnut';
    if (typeSource.includes('polar')) return 'polarArea';
    if (typeSource.includes('radar')) return 'radar';
    if (typeSource.includes('scatter')) return 'scatter';
    if (typeSource.includes('bubble')) return 'bubble';
    if (typeSource.includes('line')) return 'line';
    if (typeSource.includes('pie')) return 'pie';
    return 'bar';
  };

  const createChartData = (viz = {}) => {
    console.log('Creating chart data for:', viz.title, viz.data);

    // If LLM already provided Chart.js datasets, respect them
    if (Array.isArray(viz?.data?.labels) && Array.isArray(viz?.data?.datasets)) {
      const chartData = {
        labels: viz.data.labels,
        datasets: viz.data.datasets.map((dataset, idx) => ({
          borderWidth: dataset.borderWidth ?? 2,
          borderColor: dataset.borderColor || '#fff',
          backgroundColor: dataset.backgroundColor || defaultChartColors[idx % defaultChartColors.length],
          ...dataset,
        })),
      };
      console.log('Generated chart data (LLM provided):', chartData);
      return chartData;
    }

    // Support structures like { labels: [], datasets: [] }
    if (Array.isArray(viz?.labels) && Array.isArray(viz?.datasets)) {
      const chartData = {
        labels: viz.labels,
        datasets: viz.datasets,
      };
      console.log('Generated chart data (labels/datasets pair):', chartData);
      return chartData;
    }

    // Support array of { label, value }
    if (Array.isArray(viz?.data) && viz.data.every(item => typeof item === 'object')) {
      const labels = viz.data.map(item => item.label || item.name || '');
      const values = viz.data.map(item => item.value ?? item.count ?? 0);
      const chartData = {
        labels,
        datasets: [{
          label: viz.title,
          data: values,
          backgroundColor: values.map((_, idx) => defaultChartColors[idx % defaultChartColors.length]),
          borderColor: '#fff',
          borderWidth: 2,
        }],
      };
      console.log('Generated chart data (array map):', chartData);
      return chartData;
    }

    const entries = Object.entries(viz?.data || {});
    const labels = entries.map(([label]) => label);
    const values = entries.map(([, value]) => value);

    const fallbackData = {
      labels,
      datasets: [{
        label: viz.title,
        data: values,
        backgroundColor: values.map((_, idx) => defaultChartColors[idx % defaultChartColors.length]),
        borderColor: '#fff',
        borderWidth: 2,
      }],
    };
    
    console.log('Generated chart data (fallback):', fallbackData);
    return fallbackData;
  };

  const renderChart = (viz) => {
    const type = resolveChartType(viz);
    const data = createChartData(viz);
    const mergedOptions = {
      ...(type === 'pie' || type === 'doughnut' ? pieChartOptions : chartOptions),
      ...(viz?.options || {}),
    };

    switch (type) {
      case 'pie':
        return <Pie data={data} options={mergedOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={mergedOptions} />;
      case 'line':
        return <Line data={data} options={mergedOptions} />;
      case 'polarArea':
        return <PolarArea data={data} options={mergedOptions} />;
      case 'radar':
        return <Radar data={data} options={mergedOptions} />;
      case 'scatter':
        return <Scatter data={data} options={mergedOptions} />;
      case 'bubble':
        return <Bubble data={data} options={mergedOptions} />;
      default:
        return <Bar data={data} options={mergedOptions} />;
    }
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
    // Enable auto-scroll when user sends a message
    shouldAutoScroll.current = true;
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);
    
    // Scroll to bottom after user message is added
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    try {
      const apiResponse = await fetch('/api/patients?status=active&limit=200');
      let patients = [];
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        // Handle paginated response - extract the data array (supports { items, total, page } shape)
        if (Array.isArray(data)) {
          patients = data;
        } else if (Array.isArray(data.items)) {
          patients = data.items;
        } else if (Array.isArray(data.data)) {
          patients = data.data;
        } else if (Array.isArray(data.patients)) {
          patients = data.patients;
        } else {
          patients = [];
        }
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

      // Step 1: Get analytical text (markdown) from LLM via RAG (or direct in deep mode)
      const aiResponse = await generateComprehensiveReport(userMessage, patients, reportMode);
      console.log(`✅ Comprehensive report generated with ${reportMode} mode`);

      // Extract message, report, and relevantPatients from response object
      const chatMessage = aiResponse.message || aiResponse;
      const reportContent = aiResponse.report || aiResponse;
      const relevantPatients = aiResponse.relevantPatients || patients; // fallback to all patients if not filtered
      setLastRelevantPatientCount(relevantPatients.length);

      console.log(`📊 Using ${relevantPatients.length} patients for visualization (filtered from ${patients.length} total)`);

      // ✅ If no patients found (report is null), just show the error message
      if (!reportContent || relevantPatients.length === 0) {
        console.warn('⚠️ No report generated - no matching patients found');
        // Disable auto-scroll when AI responds
        shouldAutoScroll.current = false;
        setMessages(prev => [...prev, { text: chatMessage, isUser: false }]);
        setGeneratedReport(null);
        setEditedReport(null);
        setVisualizationData(null);
        return;
      }

      // Step 2: Prefer LLM-driven visualization data regardless of mode
      let vizData = aiResponse.visualizationData || null;
      if (vizData) {
        console.log('✅ Using LLM-generated visualization data');
      } else {
        console.warn('⚠️ No visualization data returned by LLM - falling back to template generation');
        vizData = generateVisualizationData(relevantPatients, queryClassification);
      }
      
      setVisualizationData(vizData);

      // Step 3: Ask LLM to render full HTML with embedded charts
      try {
        const htmlReport = await generateHTMLReportWithCharts(reportContent, vizData);
        // Disable auto-scroll when AI responds
        shouldAutoScroll.current = false;
        setMessages(prev => [...prev, { text: chatMessage, isUser: false }]);
        setGeneratedReport(htmlReport); // now HTML
        setEditedReport(htmlReport);
      } catch (e) {
        console.error('Failed to create HTML report via LLM, falling back to markdown rendering:', e);
        // Disable auto-scroll when AI responds
        shouldAutoScroll.current = false;
        setMessages(prev => [...prev, { text: chatMessage, isUser: false }]);
        setGeneratedReport(reportContent);
        setEditedReport(reportContent);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      // Disable auto-scroll when AI responds
      shouldAutoScroll.current = false;
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
      : generateEnhancedPDFContent(reportContent, visualizationData);

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#fafafa] to-[#FEF5F5] overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-shrink-0 bg-white border-b border-neutral-200 p-6 shadow-sm"
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">AI Report Generator</h1>
            <p className="text-neutral-600">Generate custom macro-level patient analysis reports</p>
          </div>
          {/* Mode Toggle */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative group">
              <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg p-1 shadow-sm">
                {/* Fast Mode Button */}
                <button
                  onClick={() => setReportMode('fast')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                    reportMode === 'fast'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Fast</span>
                </button>

                {/* Deep Mode Button */}
                <button
                  onClick={() => setReportMode('deep')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                    reportMode === 'deep'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Deep</span>
                </button>
              </div>

              {/* Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-neutral-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Analysis Modes:</p>
                  </div>
                </div>
                <div className="space-y-2 text-neutral-200">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-green-400">Fast Mode:</span> Uses RAG + vector search (semantic similarity) for quick, efficient, filtered analysis. Best for most queries.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-blue-400">Deep Mode:</span> Sends ALL patient data directly to LLM with no filtering or restrictions. Let AI decide what's relevant. ⚠️ <span className="text-yellow-300">More costly & slower</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Split View */}
      <div className="flex-1 flex max-w-[1800px] mx-auto w-full gap-6 p-6 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Left Side - Chat */}
        <div className="w-1/2 flex flex-col h-full overflow-hidden">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 pr-2 space-y-4"
            style={{ minHeight: 0, maxHeight: '100%' }}
          >
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
          <div className="flex-shrink-0 border-t border-neutral-200 bg-white">
            <ReportInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>


        {/* Right Side - Report Preview */}
        <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden h-full">
          <div className="flex-shrink-0 p-6 flex items-center justify-between border-b border-neutral-200">
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
            <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0 }}>
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
                <div className="space-y-6" style={{ width: '100%', overflowX: 'hidden' }}>
                  
                  {/* Report Content */}
                  {/* A4 Medical Report Format */}
                  <div id="report-a4" className="bg-white shadow-lg mx-auto" style={{ 
                    width: '100%',       // make width responsive
                    maxWidth: '100%',                    
                    minHeight: '297mm',  // keep A4 height
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '11pt',
                    lineHeight: '1.4',
                    color: '#000',
                    boxSizing: 'border-box',
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
                        style={{ width: '100%', minHeight: '297mm', border: '1px solid #e5e7eb' }}
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
                      width: '100%', 
                      maxWidth: '100%',
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
                        {visualizationData.visualizations.map((viz, index) => {
                          const chartTypeLabel = viz.chartType || viz.type || 'Chart';
                          const dataPointCount = Array.isArray(viz?.data?.labels)
                            ? viz.data.labels.length
                            : Object.keys(viz?.data || {}).length;
                          return (
                            <div key={index} className="border border-gray-300 p-4">
                              <div className="mb-4">
                                <h3 className="text-lg font-bold text-black mb-2 uppercase tracking-wide">{viz.title || `Visualization ${index + 1}`}</h3>
                                {viz.description && (
                                  <p className="text-sm font-bold text-gray-700 mb-3">{viz.description}</p>
                                )}
                                <div className="flex gap-4 text-xs font-bold text-gray-600">
                                  <span><strong>Chart Type:</strong> {chartTypeLabel}</span>
                                  <span><strong>Data Points:</strong> {dataPointCount}</span>
                                </div>
                              </div>
                              
                              {/* Professional Chart Container */}
                              <div className="h-96 w-full border border-gray-200 bg-gray-50">
                                {viz.data ? (
                                  renderChart(viz)
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                      <div className="text-lg font-bold mb-2">📊 CHART DATA LOADING</div>
                                      <div className="text-sm font-bold">Generating visualization for {viz.title || `Visualization ${index + 1}`}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* A4 Summary Statistics */}
                      <div className="border border-gray-300 p-4 mx-8">
                        <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide border-b border-gray-400 pb-2">SUMMARY STATISTICS</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-3 border border-gray-300 bg-gray-50">
                            <div className="text-2xl font-bold text-black">{totalPatientsDisplay}</div>
                            <div className="text-sm font-bold text-gray-700">TOTAL PATIENTS</div>
                          </div>
                          <div className="text-center p-3 border border-gray-300 bg-gray-50">
                            <div className="text-2xl font-bold text-black">{normalizedTopConditions.length}</div>
                            <div className="text-sm font-bold text-gray-700">TOP CONDITIONS</div>
                          </div>
                          <div className="text-center p-3 border border-gray-300 bg-gray-50">
                            <div className="text-2xl font-bold text-black">{summaryAgeGroups.length}</div>
                            <div className="text-sm font-bold text-gray-700">AGE GROUPS</div>
                          </div>
                          <div className="text-center p-3 border border-gray-300 bg-gray-50">
                            <div className="text-2xl font-bold text-black">{summaryGenderDistribution.length}</div>
                            <div className="text-sm font-bold text-gray-700">GENDER CATEGORIES</div>
                          </div>
                        </div>
                        
                        {/* A4 Data Display */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="border border-gray-300 p-4">
                            <h5 className="font-bold text-black mb-4 uppercase tracking-wide border-b border-gray-400 pb-1">AGE DISTRIBUTION</h5>
                            {summaryAgeGroups.length > 0 ? (
                              <div className="space-y-2">
                                {summaryAgeGroups.map(([age, count]) => (
                                  <div key={age} className="flex items-center justify-between border border-gray-200 p-2 bg-gray-50">
                                    <span className="font-bold text-black">{age}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-gray-300 h-2">
                                        <div 
                                          className="bg-gray-600 h-2" 
                                          style={{ width: `${(Number(count) / maxAgeGroupCount) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-bold text-black w-8 text-right">{count}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">LLM did not return structured age buckets for this run.</p>
                            )}
                          </div>
                          
                          <div className="border border-gray-300 p-4">
                            <h5 className="font-bold text-black mb-4 uppercase tracking-wide border-b border-gray-400 pb-1">TOP MEDICAL CONDITIONS</h5>
                            {normalizedTopConditions.length > 0 ? (
                              <div className="space-y-2">
                                {normalizedTopConditions.map((item, idx) => (
                                  <div key={item.condition || item.id || idx} className="flex items-center justify-between border border-gray-200 p-2 bg-gray-50">
                                    <span className="font-bold text-black capitalize">{item.condition || item.label || `Finding ${idx + 1}`}</span>
                                    <div className="flex items-center gap-2">
                                      {item.count !== null && item.count !== undefined ? (
                                        <>
                                          <div className="w-16 bg-gray-300 h-2">
                                            <div 
                                              className="bg-gray-600 h-2" 
                                              style={{ width: `${(Number(item.count) / maxConditionCount) * 100}%` }}
                                            ></div>
                                          </div>
                                          <span className="text-sm font-bold text-black w-8 text-right">{item.count}</span>
                                        </>
                                      ) : (
                                        <span className="text-sm text-gray-600">{item.condition || summaryKeyFindings[idx]}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">No condition-level breakdown provided. Review key findings in the report body.</p>
                            )}
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
