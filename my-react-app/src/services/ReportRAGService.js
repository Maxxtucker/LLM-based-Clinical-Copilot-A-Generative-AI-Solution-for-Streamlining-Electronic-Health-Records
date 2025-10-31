/**
 * Report RAG Service
 * Specialized RAG service for comprehensive report generation with enhanced data analysis
 */

import { generateAIResponse } from './OpenAIService';

// const API_BASE_URL = 'http://localhost:5001/api'; // Removed unused variable

/**
 * Enhanced RAG search for reports with top-k=20 for comprehensive analysis
 */
async function searchSimilarPatientsForReport(query, topK = 20) {
  try {
    const response = await fetch('/api/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK }),
    });

    if (!response.ok) {
      throw new Error(`Vector search failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Report RAG Search Error:', error);
    return [];
  }
}

/**
 * Generate comprehensive report with RAG context and visualizations
 */
export async function generateComprehensiveReport(userQuery, allPatients) {
  try {
    console.log('🔍 Searching for similar patients for report generation...');
    
    // Search for similar patients with top-k=20
    const similarPatients = await searchSimilarPatientsForReport(userQuery, 20);
    
    let ragContext = '';
    if (similarPatients && similarPatients.length > 0) {
      console.log(`✅ Found ${similarPatients.length} similar patients for report context`);
      
      // Deduplicate by patient_id to avoid showing the same patient multiple times
      const uniquePatients = [];
      const seenPatientIds = new Set();
      
      for (const patient of similarPatients) {
        const patientId = patient.patient_id;
        if (!seenPatientIds.has(patientId)) {
          seenPatientIds.add(patientId);
          uniquePatients.push(patient);
        }
      }

      console.log(`📊 Deduplicated to ${uniquePatients.length} unique patients for report`);
      
      // Format patient data for report context
      ragContext = uniquePatients.map((patient, index) => {
        const patientData = patient.content || patient;
        return `
**Patient ${index + 1}:**
${patientData}`;
      }).join('\n\n');
    } else {
      console.log('⚠️ No similar patients found, using general patient data for report');
      // Fallback to general patient data
      ragContext = allPatients.slice(0, 20).map((patient, index) => `
**Patient ${index + 1}:**
- Name: ${patient.first_name} ${patient.last_name}
- MRN: ${patient.medical_record_number}
- Age: ${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}
- Gender: ${patient.gender}
- Chief Complaint: ${patient.chief_complaint || 'N/A'}
- Medical History: ${patient.medical_history || 'N/A'}
- Diagnosis: ${patient.diagnosis || 'N/A'}
- Current Medications: ${patient.current_medications || 'N/A'}
- Allergies: ${patient.allergies || 'None known'}
- Treatment Plan: ${patient.treatment_plan || 'N/A'}
- Vital Signs: ${JSON.stringify(patient.vital_signs || {})}
- AI Summary: ${patient.ai_summary_content || 'N/A'}`).join('\n\n');
    }

    // Enhanced system message for comprehensive reports
    const systemMessage = `You are **MedReport AI**, a specialized clinical report generator that creates comprehensive, data-driven medical reports with visualizations and insights.

## Your Role
Generate detailed, professional medical reports that include:
- **Executive Summary** with key findings
- **Data Analysis** with statistical insights
- **Patient Demographics** breakdown
- **Clinical Patterns** and trends
- **Risk Assessment** and recommendations
- **Visualization Suggestions** for charts and graphs
- **Actionable Insights** for clinical decision-making

## Report Structure Requirements
1. **Executive Summary** (2-3 paragraphs)
2. **Patient Demographics Analysis**
3. **Clinical Findings & Patterns**
4. **Risk Stratification**
5. **Treatment Outcomes Analysis**
6. **Recommendations & Next Steps**
7. **Data Visualization Suggestions**

## Data Analysis Guidelines
- Calculate percentages, averages, and trends
- Identify patterns and correlations
- Highlight outliers and concerning cases
- Provide statistical insights where relevant
- Suggest visualizations (charts, graphs, tables)

## Visualization Suggestions Format
For each visualization, provide:
- **Chart Type**: (Bar, Line, Pie, Scatter, etc.)
- **Data Source**: What data to visualize
- **Purpose**: Why this visualization is important
- **Key Insights**: What the chart should reveal

## Report Quality Standards
- Use professional medical terminology
- Include specific numbers and statistics
- Provide actionable recommendations
- Highlight critical findings
- Maintain clinical accuracy
- Use clear, structured formatting with markdown

## Response Format
Structure your response as a comprehensive medical report with clear sections, statistical analysis, and visualization recommendations.`;

    const prompt = `
${systemMessage}

---

**Report Request:** "${userQuery}"

**Patient Database Context (${allPatients.length} total patients):**
${ragContext}

---

## CRITICAL: Comprehensive Report Generation

**Step 1: Data Analysis**
- Analyze the patient data for patterns, trends, and insights
- Calculate relevant statistics and percentages
- Identify high-risk patients and concerning patterns
- Note demographic distributions and clinical correlations

**Step 2: Report Structure**
- Create a professional executive summary
- Organize findings into logical sections
- Include specific data points and statistics
- Provide clear, actionable recommendations

**Step 3: Visualization Planning**
- Suggest 3-5 key visualizations that would enhance the report
- Specify what data each chart should show
- Explain the clinical value of each visualization

**Step 4: Clinical Insights**
- Identify patterns across the patient population
- Highlight risk factors and concerning trends
- Provide evidence-based recommendations
- Suggest areas for further investigation

Generate a comprehensive medical report that would be valuable for clinical decision-making, quality improvement, and patient care optimization.`;

    console.log('🤖 Generating comprehensive report with RAG context...');
    const report = await generateAIResponse(prompt, systemMessage);

    // ✅ Only return success message in chat (not the report itself)
    if (report && report.trim().length > 0) {
      console.log('✅ Report generated successfully!');
      return {
        message: "✅ **Report generated successfully!** You can view, edit it, and see the visualizations in the preview panel on the right.",
        report, // still included for backend or preview use
      };
    } else {
      console.warn('⚠️ Empty report generated.');
      return {
        message: "I apologize, but I encountered an error while generating your report. Please try again with a different request.",
        report: null,
      };
    }
  } catch (error) {
    console.error('❌ Error generating comprehensive report:', error);
    return {
      message: "I apologize, but I encountered an error while generating your report. Please try again with a different request.",
      report: null,
    };
  }
}

/**
 * Given an analysis report (markdown/text) ask LLM to produce a complete, printable HTML document
 * with embedded charts (Chart.js) based on the provided visualizationData JSON.
 * The HTML must be standalone (includes CSS + CDN scripts) and A4 print CSS.
 */
export async function generateHTMLReportWithCharts(reportText, visualizationData) {
  const systemMessage = `You are a medical report generator and renderer. Output ONLY valid HTML (no markdown fences or prose).\n\nGoals:\n- Produce a professional clinical report on A4 with natural sectioning. The LLM is free to decide section order and headings that best suit the content.\n- Keep typography compact and readable; avoid large gaps.\n\nHard requirements:\n- Return a complete standalone HTML document suitable for A4 print (@page A4; margin 16-20mm; white background; Arial 11pt).\n- Include a concise header with title and timestamp.\n- Embed data visualizations using Chart.js CDN and the provided JSON; render them responsively in 2-column layout when possible, using ~260px height each so multiple charts can share a page. Use page-break-inside: avoid.\n- If datasets are empty, show a small inline note.\n- No code fences; return raw HTML only.`;

  const prompt = `Create the medical report HTML with embedded charts. The report should look like a typical hospital medical report (natural structure; don't force a rigid template).\n\n[analysis]\n${reportText}\n\n[visualizations JSON]\n${JSON.stringify(visualizationData || {}, 2)}\n\nNotes for layout:\n- Use two-column grid for charts on desktop/print; single column on small widths.\n- Chart canvas height around 260px; legend below or small.\n- Avoid excessive top/bottom margins for headings.`;

  let html = await generateAIResponse(prompt, systemMessage);
  // Strip accidental markdown code fences if present
  if (typeof html === 'string') {
    html = html.trim();
    if (html.startsWith('```')) {
      html = html.replace(/^```[a-zA-Z]*\n?/,'');
      html = html.replace(/```\s*$/,'');
    }
  }
  return html;
}

/**
 * Generate data visualizations for the report
 */
export function generateVisualizationData(patients, reportType) {
  const visualizations = [];
  
  // Demographics analysis
  const ageGroups = {
    '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0
  };
  
  const genderDistribution = { male: 0, female: 0, other: 0 };
  const conditionDistribution = {};
  const vitalSignsData = [];
  
  patients.forEach(patient => {
    // Age grouping
    const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
    if (age <= 18) ageGroups['0-18']++;
    else if (age <= 35) ageGroups['19-35']++;
    else if (age <= 50) ageGroups['36-50']++;
    else if (age <= 65) ageGroups['51-65']++;
    else ageGroups['65+']++;
    
    // Gender distribution
    genderDistribution[patient.gender] = (genderDistribution[patient.gender] || 0) + 1;
    
    // Condition tracking
    if (patient.diagnosis) {
      const conditions = patient.diagnosis.split(',').map(c => c.trim());
      conditions.forEach(condition => {
        conditionDistribution[condition] = (conditionDistribution[condition] || 0) + 1;
      });
    }
    
    // Vital signs data
    if (patient.vital_signs) {
      vitalSignsData.push({
        patient: `${patient.first_name} ${patient.last_name}`,
        bloodPressure: patient.vital_signs.blood_pressure,
        heartRate: patient.vital_signs.heart_rate,
        temperature: patient.vital_signs.temperature,
        weight: patient.vital_signs.weight
      });
    }
  });
  
  // Generate visualization suggestions
  visualizations.push({
    type: 'demographics',
    title: 'Patient Age Distribution',
    data: ageGroups,
    chartType: 'bar',
    description: 'Distribution of patients across age groups'
  });
  
  visualizations.push({
    type: 'demographics',
    title: 'Gender Distribution',
    data: genderDistribution,
    chartType: 'pie',
    description: 'Gender breakdown of patient population'
  });
  
  visualizations.push({
    type: 'clinical',
    title: 'Top Medical Conditions',
    data: Object.entries(conditionDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
    chartType: 'bar',
    description: 'Most common diagnoses in the patient population'
  });
  
  return {
    visualizations,
    summary: {
      totalPatients: patients.length,
      ageGroups,
      genderDistribution,
      topConditions: Object.entries(conditionDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    }
  };
}

/**
 * Enhanced PDF export with interactive visualizations and modern styling
 */
export function generateEnhancedPDFContent(report, visualizationData) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprehensive Medical Report - Clinical Copilot</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        
        .container { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 20px; 
          background: white; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
          border-radius: 15px;
          margin-top: 20px;
          margin-bottom: 20px;
        }
        
        .header { 
          text-align: center; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px; 
          border-radius: 15px 15px 0 0;
          margin: -20px -20px 30px -20px;
        }
        
        .header h1 { 
          font-size: 2.5em; 
          margin-bottom: 10px; 
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p { 
          font-size: 1.1em; 
          opacity: 0.9; 
        }
        
        .summary-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
          gap: 20px; 
          margin: 30px 0; 
        }
        
        .summary-card { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px; 
          border-radius: 15px; 
          text-align: center;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          transition: transform 0.3s ease;
        }
        
        .summary-card:hover { 
          transform: translateY(-5px); 
        }
        
        .summary-card h3 { 
          font-size: 2em; 
          margin-bottom: 10px; 
        }
        
        .summary-card p { 
          font-size: 1.1em; 
          opacity: 0.9; 
        }
        
        .section { 
          margin: 40px 0; 
          padding: 30px; 
          background: #f8f9fa; 
          border-radius: 15px; 
          border-left: 5px solid #667eea;
        }
        
        .section h2 { 
          color: #667eea; 
          font-size: 1.8em; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #e9ecef; 
          padding-bottom: 10px; 
        }
        
        .section h3 { 
          color: #495057; 
          font-size: 1.4em; 
          margin: 20px 0 15px 0; 
        }
        
        .chart-container { 
          background: white; 
          padding: 30px; 
          border-radius: 15px; 
          margin: 20px 0; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          position: relative;
          height: 260px;
          page-break-inside: avoid;
        }
        
        .chart-title { 
          font-size: 1.3em; 
          color: #495057; 
          margin-bottom: 20px; 
          text-align: center;
          font-weight: 600;
        }
        
        .chart-description { 
          color: #6c757d; 
          margin-bottom: 20px; 
          text-align: center;
          font-style: italic;
        }
        
        .data-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0; 
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .data-table th, .data-table td { 
          padding: 15px; 
          text-align: left; 
          border-bottom: 1px solid #e9ecef;
        }
        
        .data-table th { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          font-weight: 600;
        }
        
        .data-table tr:hover { 
          background-color: #f8f9fa; 
        }
        
        .footer { 
          margin-top: 50px; 
          text-align: center; 
          color: #6c757d; 
          font-size: 14px; 
          padding: 30px;
          background: #f8f9fa;
          border-radius: 15px;
        }
        
        .badge { 
          display: inline-block; 
          padding: 5px 12px; 
          background: #667eea; 
          color: white; 
          border-radius: 20px; 
          font-size: 0.9em; 
          margin: 2px; 
        }
        
        .highlight { 
          background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
          padding: 25px; 
          border-radius: 15px; 
          margin: 25px 0; 
          border-left: 5px solid #667eea;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .highlight::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
        }
        
        .metric-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .metric-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: rotate(45deg);
          transition: all 0.6s;
        }
        
        .metric-card:hover::before {
          animation: shimmer 1.5s ease-in-out;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .chart-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media print { .chart-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 900px) { .chart-grid { grid-template-columns: 1fr; } }
        .chart-wrapper { background: white; border-radius: 12px; padding: 12px; border: 1px solid #e9ecef; position: relative; overflow: hidden; page-break-inside: avoid; height: 280px; }
        .chart-container { height: 100%; width: 100%; }
        .chart-wrapper canvas { width: 100% !important; height: 100% !important; display: block; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        
        .chart-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
        }
        
        @media print {
          body { background: white; }
          .container { box-shadow: none; margin: 0; }
          .chart-container { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Comprehensive Medical Report</h1>
          <p>Generated by Clinical Copilot AI</p>
          <p>📅 Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <h3>${visualizationData?.summary?.totalPatients || 0}</h3>
            <p>Total Patients Analyzed</p>
          </div>
          <div class="summary-card">
            <h3>${Object.keys(visualizationData?.summary?.ageGroups || {}).length}</h3>
            <p>Age Groups</p>
          </div>
          <div class="summary-card">
            <h3>${Object.keys(visualizationData?.summary?.genderDistribution || {}).length}</h3>
            <p>Gender Categories</p>
          </div>
          <div class="summary-card">
            <h3>${visualizationData?.summary?.topConditions?.length || 0}</h3>
            <p>Top Conditions</p>
          </div>
        </div>
        
        <div class="section">
          <h2>📊 Report Analysis</h2>
          <div class="highlight">
            ${report.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/^## (.*$)/gm, '<h2>$2</h2>').replace(/^### (.*$)/gm, '<h3>$3</h3>')}
          </div>
        </div>
        
        <div class="section">
          <h2>📈 Interactive Data Visualizations</h2>
          ${visualizationData?.visualizations?.length ? `
            <div class="chart-grid">
              ${visualizationData.visualizations.map((viz, index) => `
                <div class="chart-wrapper">
                  <div class="chart-title">${viz.title}</div>
                  <div class="chart-description">${viz.description}</div>
                  <div class="chart-container"><canvas id="chart${index}"></canvas></div>
                </div>
              `).join('')}
            </div>
          ` : '<p>No visualization data available</p>'}
        </div>
        
        <div class="section">
          <h2>📋 Summary Statistics</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Patients</td>
                <td>${visualizationData?.summary?.totalPatients || 0}</td>
                <td>Number of patients analyzed in this report</td>
              </tr>
              <tr>
                <td>Age Distribution</td>
                <td>${Object.keys(visualizationData?.summary?.ageGroups || {}).join(', ')}</td>
                <td>Age groups represented in the data</td>
              </tr>
              <tr>
                <td>Gender Distribution</td>
                <td>${Object.keys(visualizationData?.summary?.genderDistribution || {}).join(', ')}</td>
                <td>Gender categories in the patient population</td>
              </tr>
              <tr>
                <td>Top Conditions</td>
                <td>${visualizationData?.summary?.topConditions?.join(', ') || 'N/A'}</td>
                <td>Most common medical conditions</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>🤖 This report was generated by Clinical Copilot AI using RAG-enhanced analysis</p>
          <p>📞 For questions about this report, please contact your clinical team</p>
          <p>🔒 This report contains confidential medical information</p>
        </div>
      </div>
      
      <script>
        (function(){
          function ready(fn){
            if(document.readyState !== 'loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); }
          }
          function renderCharts(){
            if (!window.Chart) { setTimeout(renderCharts, 60); return; }
            ${visualizationData?.visualizations?.map((viz, index) => `
              (function(){
                var el = document.getElementById('chart${index}');
                if(!el) return;
                var ctx = el.getContext('2d');
                new Chart(ctx, {
                  type: '${viz.chartType === 'Pie Chart' ? 'pie' : viz.chartType === 'Bar Chart' ? 'bar' : 'line'}',
                  data: {
                    labels: ${JSON.stringify(Object.keys(viz.data || {}))},
                    datasets: [{
                      label: '${viz.title}',
                      data: ${JSON.stringify(Object.values(viz.data || {}))},
                      backgroundColor: ['#667eea','#764ba2','#f093fb','#f5576c','#4facfe','#00f2fe','#43e97b','#38f9d7','#ffecd2','#fcb69f','#a8edea','#fed6e3'],
                      borderColor: '#fff',
                      borderWidth: 2
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } } },
                    scales: { y: { beginAtZero: true } }
                  }
                });
              })();
            `).join('') || ''}
          }
          ready(renderCharts);
          // Ensure charts exist before print
          window.onbeforeprint = function(){ renderCharts(); };
        })();
      </script>
    </body>
    </html>
  `;
  
  return htmlContent;
}

const ReportRAGService = {
  generateComprehensiveReport,
  generateVisualizationData,
  generateEnhancedPDFContent,
  searchSimilarPatientsForReport
};

export default ReportRAGService;
