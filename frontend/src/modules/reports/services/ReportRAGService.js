/**
 * Report RAG Service
 * Specialized RAG service for comprehensive report generation with enhanced data analysis
 */

import { generateAIResponse } from '@/modules/ai/services/OpenAIService';

// const API_BASE_URL = 'http://localhost:5001/api'; // Removed unused variable

/**
 * LLM-based Query Classifier
 * Uses GPT-4o-mini to intelligently classify user queries
 * @returns {Promise<{type: 'population'|'condition-specific', confidence: string, reasoning: string}>}
 */
async function classifyQueryWithLLM(userQuery) {
  try {
    const systemMessage = `You are a medical query classifier. Your ONLY job is to classify queries into two categories and respond with ONLY a JSON object.

**Category 1: POPULATION-LEVEL ANALYSIS**
Queries asking for statistics/analysis about ALL patients.
Examples: "Analyze disease distribution", "Identify top comorbidities", "Show health trends"

**Category 2: CONDITION-SPECIFIC FILTERING**
Queries looking for specific patients with a condition.
Examples: "Patients who have vomiting", "Show me pregnant patients", "Find patients with diabetes"

RESPOND WITH ONLY THIS JSON (no other text):
{"type": "population" or "condition-specific", "confidence": "high/medium/low", "reasoning": "one sentence"}`;

    const userPrompt = `Classify this query: "${userQuery}"`;

    const response = await generateAIResponse(userPrompt, systemMessage);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const classification = JSON.parse(jsonMatch[0]);
      console.log(`🤖 LLM Classification:`, classification);
      return classification;
    }

    // Fallback if parsing fails
    console.warn('⚠️ Failed to parse LLM classification, using fallback');
    return { type: 'condition-specific', confidence: 'low', reasoning: 'Failed to parse LLM response' };
  } catch (error) {
    console.error('❌ LLM Classification Error:', error);
    // Return condition-specific as safe default
    return { type: 'condition-specific', confidence: 'low', reasoning: 'LLM classification failed' };
  }
}

/**
 * Enhanced RAG search for reports with top-k=50 for comprehensive analysis
 */
async function searchSimilarPatientsForReport(query, topK = 50) {
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
 * Generate deep mode report by sending all patient data directly to LLM
 * Minimal restrictions - let the LLM decide what's relevant AND what visualizations to show
 */
async function generateDeepModeReport(userQuery, patients, patientContext) {
  try {
    console.log(`🌊 Generating DEEP MODE report for ${patients.length} patients - NO RESTRICTIONS`);
    
    // Step 1: Generate the main report
    const systemMessage = `You are MedReport AI, a clinical report generator. Analyze the provided patient data and generate a comprehensive medical report based on the user's request.`;

    const userPrompt = `Generate a medical report based on this request: "${userQuery}"

Here is ALL the patient data (${patients.length} patients):

${patientContext}

Analyze the data and generate a comprehensive report that addresses the request. Include any relevant statistics, patterns, demographics, clinical findings, and recommendations. Use your medical knowledge to provide insights.`;

    const report = await generateAIResponse(userPrompt, systemMessage);
    
    console.log(`✅ DEEP MODE report generated successfully`);
    
    // Step 2: Ask LLM to generate visualization data
    console.log(`📊 DEEP MODE: Asking LLM to generate visualization data...`);
    const vizSystemMessage = `You are a data visualization expert. Analyze patient data and generate visualization configurations in JSON format.`;
    
    const vizPrompt = `Based on this query: "${userQuery}"

And these ${patients.length} patients:

${patientContext}

Generate 2-3 relevant data visualizations in this EXACT JSON format:

{
  "visualizations": [
    {
      "type": "bar" or "pie" or "line",
      "title": "Chart Title",
      "data": {
        "labels": ["Label1", "Label2", ...],
        "datasets": [{
          "label": "Dataset Name",
          "data": [value1, value2, ...]
        }]
      }
    }
  ],
  "summary": {
    "totalPatients": ${patients.length},
    "keyFindings": ["Finding 1", "Finding 2", "Finding 3"]
  }
}

Choose visualizations that are MOST RELEVANT to the query. Respond with ONLY valid JSON, no other text.`;

    let visualizationData = null;
    try {
      const vizResponse = await generateAIResponse(vizPrompt, vizSystemMessage);
      
      // Parse the JSON response
      const jsonMatch = vizResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        visualizationData = JSON.parse(jsonMatch[0]);
        console.log(`✅ DEEP MODE: LLM-generated visualization data:`, visualizationData);
      } else {
        console.warn(`⚠️ DEEP MODE: Could not parse visualization JSON from LLM response`);
      }
    } catch (vizError) {
      console.error(`❌ DEEP MODE: Error generating visualization data:`, vizError);
      // Continue without visualizations
    }
    
    return { report, visualizationData };
    
  } catch (error) {
    console.error('❌ Deep Mode Report Error:', error);
    throw error;
  }
}

/**
 * Generate comprehensive report with RAG context and visualizations
 * IMPORTANT: Uses RAG to find relevant patients, then uses those for both report AND visualizations
 * @param {string} userQuery - The user's query
 * @param {Array} allPatients - All available patients
 * @param {string} mode - 'fast' (RAG) or 'deep' (direct LLM) mode
 */
export async function generateComprehensiveReport(userQuery, allPatients, mode = 'fast') {
  try {
    console.log(`🔍 Starting report generation for query: "${userQuery}" in ${mode.toUpperCase()} mode`);
    
    // DEEP MODE: No restrictions, no filtering - send ALL patients to LLM
    if (mode === 'deep') {
      console.log(`🌊 DEEP MODE: Sending ALL ${allPatients.length} patients to LLM with NO filtering or restrictions`);
      console.log(`⚠️ Warning: This is more costly and slower than fast mode`);
      
      // Use ALL patients - no filtering whatsoever
      const relevantPatients = allPatients;
      
      // Build comprehensive patient context with ALL details
      const patientContext = relevantPatients.map((p, idx) => {
        return `**Patient ${idx + 1}: ${p.first_name} ${p.last_name}**
- Age: ${p.age || 'N/A'}
- Gender: ${p.gender || 'N/A'}
- Diagnosis: ${p.diagnosis || 'None'}
- Chief Complaint: ${p.chief_complaint || 'None'}
- Medical History: ${p.medical_history || 'None'}
- Treatment Plan: ${p.treatment_plan || 'None'}
- Current Medications: ${p.current_medications || 'None'}
- Allergies: ${p.allergies || 'None'}`;
      }).join('\n\n');
      
      // Generate report with minimal restrictions - let LLM decide what's relevant
      const { report, visualizationData } = await generateDeepModeReport(userQuery, relevantPatients, patientContext);
      
      return {
        message: report,
        report: report,
        relevantPatients: relevantPatients,
        visualizationData: visualizationData, // LLM-generated visualizations
      };
    }
    
    // FAST MODE: Use RAG + Vector Search (original implementation)
    console.log(`⚡ FAST MODE: Using RAG + vector search for efficient analysis`);
    
    const queryLower = userQuery.toLowerCase(); // Still needed for validation and filtering
    
    // Step 1: Use LLM to intelligently classify the query
    const llmClassification = await classifyQueryWithLLM(userQuery);
    const isPopulationQuery = llmClassification.type === 'population';
    
    console.log(`🤖 LLM Query Classification:`, {
      type: llmClassification.type,
      confidence: llmClassification.confidence,
      reasoning: llmClassification.reasoning
    });
    
    let relevantPatients = [];
    
    if (isPopulationQuery) {
      // Population-level query: use ALL patients for analysis
      console.log(`📊 Detected population-level analysis query - using all ${allPatients.length} patients`);
      relevantPatients = allPatients;
    } else {
      // Step 2: Condition-specific query - check for specific medical conditions
      const conditionKeywords = [
        'vomit', 'vomitting', 'nausea', 'fever', 'cough', 'pain', 'headache', 'diabetes', 
        'hypertension', 'pregnant', 'pregnancy', 'asthma', 'allergy', 'infection',
        'syndrome', 'disorder', 'symptom', 'presenting with',
        'suffering from', 'complaining of', 'who has', 'who have', 'patients with'
      ];
      
      const hasCondition = conditionKeywords.some(keyword => queryLower.includes(keyword));
      
      // Step 3: Condition-specific query - Use RAG to find relevant patients
      console.log(`🔍 Detected condition-specific query (hasCondition: ${hasCondition}) - using RAG search`);
      const ragResults = await searchSimilarPatientsForReport(userQuery, 20);
      console.log(`📊 RAG Search found ${ragResults.length} similar patients`);
      
      // Step 4: Extract patient IDs from RAG results and validate they actually match the query
      if (ragResults.length > 0) {
        const ragPatientIds = ragResults.map(r => r.patient_id?.toString());
        console.log(`🔎 Found RAG patient IDs:`, ragPatientIds);
        
        // Match RAG results with full patient data
        const ragMatchedPatients = allPatients.filter(p => 
          ragPatientIds.includes(p._id?.toString()) || ragPatientIds.includes(p.id?.toString())
        );
        
        console.log(`✅ Matched ${ragMatchedPatients.length} patients from RAG results with full data`);
        
        // SMART VALIDATION: Trust RAG more, only do light validation
        // Calculate average RAG score to assess confidence
        const avgScore = ragResults.reduce((sum, r) => sum + (r.score || 0), 0) / ragResults.length;
        const highConfidence = avgScore > 0.7; // If RAG is very confident, trust it more
        
        console.log(`📊 RAG average confidence score: ${avgScore.toFixed(3)}, highConfidence: ${highConfidence}`);
        
        if (highConfidence) {
          // High confidence RAG: Trust the results, minimal validation
          console.log(`✅ High confidence RAG - using all ${ragMatchedPatients.length} matched patients`);
          relevantPatients = ragMatchedPatients;
        } else {
          // Lower confidence: Do keyword validation
          console.log(`⚠️ Lower confidence RAG - applying keyword validation`);
          
          // Extract condition keywords from query and create variations
          let queryKeywords = queryLower
            .replace(/write|report|generate|create|show|find|patient|patients|who|has|have|with|the|and|or|a|an/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3);
          
          // Add common variations and fuzzy matching for typos
          const expandedKeywords = [...queryKeywords];
          queryKeywords.forEach(keyword => {
            // Handle plural/singular and tense variations
            if (keyword.endsWith('ing')) {
              expandedKeywords.push(keyword.slice(0, -3)); // vomitting -> vomit
              expandedKeywords.push(keyword.slice(0, -4)); // vomitting -> vomitt
            }
            if (keyword.endsWith('s')) {
              expandedKeywords.push(keyword.slice(0, -1)); // vomits -> vomit
            }
            if (keyword.endsWith('ed')) {
              expandedKeywords.push(keyword.slice(0, -2)); // vomited -> vomit
            }
            // Fuzzy matching: add variations with common typos
            // "heandache" -> "headache", etc.
            expandedKeywords.push(keyword.substring(0, keyword.length - 1)); // Remove last char
          });
          
          console.log(`🔍 Validating RAG results for keywords:`, [...new Set(expandedKeywords)]);
          
          // Filter to only keep patients that actually have the condition
          relevantPatients = ragMatchedPatients.filter(patient => {
            const patientText = [
              patient.diagnosis,
              patient.chief_complaint,
              patient.medical_history,
              patient.treatment_plan,
              patient.current_medications
            ].join(' ').toLowerCase();
            
            // Patient must match at least one of the condition keywords (with fuzzy matching)
            return expandedKeywords.some(keyword => {
              // Exact match or fuzzy match (Levenshtein distance of 1-2 characters)
              if (patientText.includes(keyword)) return true;
              
              // Fuzzy match: check if keyword is similar to any word in patientText
              const words = patientText.split(/\s+/);
              return words.some(word => {
                if (Math.abs(word.length - keyword.length) > 2) return false;
                let differences = 0;
                for (let i = 0; i < Math.max(word.length, keyword.length); i++) {
                  if (word[i] !== keyword[i]) differences++;
                  if (differences > 2) return false;
                }
                return differences <= 2;
              });
            });
          });
          
          console.log(`✅ After validation: ${relevantPatients.length} patients match the condition`);
        }
      }
      
      // Step 5: If RAG didn't find matches, try keyword filtering
      if (relevantPatients.length === 0) {
        console.log(`⚠️ No RAG matches found, falling back to keyword filtering`);
        
        // Extract medical condition keywords (filter out common words)
        const stopWords = ['with', 'have', 'having', 'patient', 'patients', 'report', 'generate', 'create', 'show', 'find', 'get', 'give', 'gives', 'who', 'that', 'about'];
        const keywords = queryLower
          .split(/\s+/)
          .filter(w => w.length > 3 && !stopWords.includes(w));
        
        relevantPatients = allPatients.filter(patient => {
          const searchText = [
            patient.diagnosis,
            patient.chief_complaint,
            patient.medical_history,
            patient.treatment_plan
          ].join(' ').toLowerCase();
          
          return keywords.some(keyword => searchText.includes(keyword));
        });
        
        console.log(`🔍 Keyword filter found ${relevantPatients.length} matching patients`);
      }
    }
    
    // Step 6: If still no results, inform the user
    if (relevantPatients.length === 0) {
      console.warn(`❌ No patients found matching query: "${userQuery}"`);
      return {
        message: `I couldn't find any patients matching "${userQuery}". Please try a different condition or query.`,
        report: null,
        relevantPatients: [], // ✅ Important: Return empty array so frontend doesn't fallback to all patients
      };
    }
    
    console.log(`📋 Generating report for ${relevantPatients.length} relevant patients`);
    
    // Calculate exact statistics for the AI to reference
    const ageGroups = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
    const genderCount = { male: 0, female: 0, other: 0, unknown: 0 };
    const diagnosisCount = {};
    
    relevantPatients.forEach(patient => {
      const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 35) ageGroups['19-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else if (age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
      
      const gender = (patient.gender || 'unknown').toLowerCase();
      genderCount[gender] = (genderCount[gender] || 0) + 1;
      
      if (patient.diagnosis) {
        const diagnoses = patient.diagnosis.split(',').map(d => d.trim());
        diagnoses.forEach(d => {
          diagnosisCount[d] = (diagnosisCount[d] || 0) + 1;
        });
      }
    });
    
    // Build data summary for AI
    const dataSummary = `
## DATA SUMMARY (Use these exact numbers in your report)

**Query:** "${userQuery}"
**Total Matching Patients:** ${relevantPatients.length}

**Age Distribution:**
${Object.entries(ageGroups).filter(([,count]) => count > 0).map(([range, count]) => `- ${range} years: ${count} patient${count !== 1 ? 's' : ''} (${((count/relevantPatients.length)*100).toFixed(1)}%)`).join('\n')}

**Gender Distribution:**
${Object.entries(genderCount).filter(([,count]) => count > 0).map(([gender, count]) => `- ${gender.charAt(0).toUpperCase() + gender.slice(1)}: ${count} patient${count !== 1 ? 's' : ''} (${((count/relevantPatients.length)*100).toFixed(1)}%)`).join('\n')}

**Top Diagnoses:**
${Object.entries(diagnosisCount).sort(([,a], [,b]) => b - a).slice(0, 5).map(([diagnosis, count]) => `- ${diagnosis}: ${count} patient${count !== 1 ? 's' : ''}`).join('\n')}
`;
    
    // Use RELEVANT patients for the report (filtered by RAG/keywords)
    // This ensures the report is about the specific condition requested
    const patientDetails = relevantPatients.map((patient, index) => {
      const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
      return `
**Patient ${index + 1}:**
- Name: ${patient.first_name} ${patient.last_name}
- MRN: ${patient.medical_record_number}
- Age: ${age} years
- Gender: ${patient.gender || 'Unknown'}
- Chief Complaint: ${patient.chief_complaint || 'Not specified'}
- Medical History: ${patient.medical_history || 'None documented'}
- Diagnosis: ${patient.diagnosis || 'Under evaluation'}
- Current Medications: ${patient.current_medications || 'None listed'}
- Allergies: ${patient.allergies || 'No known allergies'}
- Treatment Plan: ${patient.treatment_plan || 'To be determined'}
- Status: ${patient.status}`;
    }).join('\n\n');
    
    const ragContext = dataSummary + '\n\n---\n\n## DETAILED PATIENT DATA\n' + patientDetails;

    // Enhanced system message for comprehensive reports
    const systemMessage = `You are **MedReport AI**, a specialized clinical report generator that creates comprehensive, data-driven medical reports with visualizations and insights.

## 🚨 CRITICAL RULE: NO HALLUCINATION
**YOU MUST ONLY use the patient data explicitly provided to you. NEVER invent, imagine, or add patient names, diagnoses, or any data not in the provided database. This is a medical safety requirement.**

## Your Role
Generate detailed, professional medical reports that include:
- **Executive Summary** with key findings FROM THE PROVIDED DATA ONLY
- **Data Analysis** with statistical insights FROM THE PROVIDED DATA ONLY
- **Patient Demographics** breakdown
- **Clinical Patterns** and trends
- **Risk Assessment** and recommendations
- **Actionable Insights** for clinical decision-making

## Report Structure Requirements
1. **Executive Summary** (2-3 paragraphs) - based on provided data only
2. **Patient Demographics Analysis** - exact counts from provided data
3. **Clinical Findings & Patterns** - patterns observed in provided data only
4. **Risk Stratification** - based on provided patient profiles only
5. **Treatment Outcomes Analysis** - from provided data only
6. **Recommendations & Next Steps** - general recommendations, not patient-specific examples

## Data Analysis Guidelines
- Calculate percentages, averages, and trends FROM THE PROVIDED DATA ONLY
- Identify patterns and correlations IN THE PROVIDED DATA ONLY
- Highlight outliers and concerning cases FROM THE PROVIDED DATA ONLY
- Provide statistical insights where relevant
- NEVER add fictional examples or "typical" cases

## Report Quality Standards
- Use professional medical terminology
- Include specific numbers and statistics FROM PROVIDED DATA ONLY
- Provide actionable recommendations (general, not fictional examples)
- Highlight critical findings FROM THE PROVIDED DATA
- Maintain clinical accuracy by using ONLY provided patient data
- Use clear, structured formatting with markdown
- NEVER mention patient names not in the provided database

## Response Format
Structure your response as a comprehensive medical report with clear sections, statistical analysis based EXCLUSIVELY on the provided patient data. Do not add examples, fictional cases, or patients not in the database.`;

    const prompt = `
${systemMessage}

---

**Report Request:** "${userQuery}"

**IMPORTANT: You must analyze EXACTLY these ${relevantPatients.length} patients who match the query "${userQuery}". All statistics in your report MUST match this exact dataset.**

**Patient Database (${relevantPatients.length} matching patients):**
${ragContext}

---

## 🚨 CRITICAL: Data-Accurate Report Generation - NO HALLUCINATION ALLOWED 🚨

**ABSOLUTE REQUIREMENT: Use ONLY the provided patient data. DO NOT invent, estimate, or imagine ANY data.**

**🛑 STRICTLY FORBIDDEN - You MUST NOT:**
- ❌ Mention ANY patient names not explicitly listed in the Patient Database above
- ❌ Invent or imagine any patient data, names, diagnoses, or statistics
- ❌ Reference "Andrew Chong" or any other name not in the provided list
- ❌ Estimate, approximate, or guess any numbers
- ❌ Add example patients or fictional cases
- ❌ Use data from your training data or general medical knowledge for specific patient examples

**✅ YOU MUST:**
- ✓ Use ONLY the ${relevantPatients.length} patients listed above by their exact names from the database
- ✓ Reference patients as "Patient 1", "Patient 2", etc. OR use their exact names from the list above
- ✓ Calculate statistics ONLY from the provided patient data
- ✓ If you mention a specific patient, they MUST be from the numbered list above

**Step 1: Count and Calculate**
- Count EXACT numbers from the patient list above
- Calculate age distribution: How many in 0-18, 19-35, 36-50, 51-65, 65+ groups
- Count gender distribution: How many male, female, other, unknown
- Count diagnoses: List each unique diagnosis and its count
- Calculate percentages based on TOTAL = ${relevantPatients.length}

**Step 2: Report Structure**
- Use ONLY the calculated statistics from Step 1
- State "Total Patients Analyzed: ${relevantPatients.length}"
- For each statistic, provide: Count (${relevantPatients.length > 0 ? 'XX%' : '0%'})
- Do NOT estimate or approximate - use exact counts only
- Focus your analysis on the condition/query: "${userQuery}"

**Step 3: Accuracy Check**
- Verify all numbers add up to ${relevantPatients.length}
- Verify all percentages are calculated from ${relevantPatients.length}
- Every patient you mention MUST exist in the numbered list above
- Do NOT make up data or estimate statistics

**Step 4: Clinical Insights**
- Base ALL insights on the ACTUAL data provided
- When citing specific patients, use "Patient [number]" or their exact name from the list
- Only recommend actions based on real patterns observed in the provided data
- Provide insights specific to patients presenting with "${userQuery}"

**FINAL WARNING: Inventing patient data is a critical medical safety error. Use ONLY the data provided above. If "Andrew Chong" is not in the numbered patient list above, DO NOT mention that name.**

Generate a report where EVERY NUMBER and EVERY PATIENT NAME matches the actual patient data provided above. The visualizations will show the exact same data, so accuracy is critical.`;

    console.log('🤖 Generating comprehensive report with RAG context...');
    const report = await generateAIResponse(prompt, systemMessage);

    // ✅ Only return success message in chat (not the report itself)
    if (report && report.trim().length > 0) {
      console.log('✅ Report generated successfully!');
      
      // Determine if this was a population query or filtered query
      const isFullPopulation = relevantPatients.length === allPatients.length;
      const message = isFullPopulation
        ? `✅ **Report generated successfully!** Analyzing all ${relevantPatients.length} active patients. You can view, edit it, and see the visualizations in the preview panel on the right.`
        : `✅ **Report generated successfully!** Found ${relevantPatients.length} patient${relevantPatients.length !== 1 ? 's' : ''} matching "${userQuery}" (filtered from ${allPatients.length} total). You can view, edit it, and see the visualizations in the preview panel on the right.`;
      
      return {
        message,
        report, // still included for backend or preview use
        relevantPatients, // return the filtered patients for visualization
      };
    } else {
      console.warn('⚠️ Empty report generated.');
      return {
        message: "I apologize, but I encountered an error while generating your report. Please try again with a different request.",
        report: null,
        relevantPatients: [],
      };
    }
  } catch (error) {
    console.error('❌ Error generating comprehensive report:', error);
    return {
      message: "I apologize, but I encountered an error while generating your report. Please try again with a different request.",
      report: null,
      relevantPatients: [],
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
  
  // Safety check: ensure patients is an array
  if (!Array.isArray(patients)) {
    console.warn('generateVisualizationData: patients is not an array:', patients);
    return visualizations;
  }
  
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
    chartType: 'Bar Chart',
    description: 'Distribution of patients across age groups'
  });
  
  visualizations.push({
    type: 'demographics',
    title: 'Gender Distribution',
    data: genderDistribution,
    chartType: 'Pie Chart',
    description: 'Gender breakdown of patient population'
  });
  
  visualizations.push({
    type: 'clinical',
    title: 'Top Medical Conditions',
    data: Object.entries(conditionDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
    chartType: 'Bar Chart',
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
        .map(([condition, count]) => ({ condition, count }))
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
