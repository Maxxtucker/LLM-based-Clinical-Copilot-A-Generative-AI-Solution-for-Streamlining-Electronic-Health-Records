// frontend/src/modules/ai/services/OpenAIService.js

// Base URL of your backend. In dev, set REACT_APP_API_BASE_URL=http://localhost:5000
// If you use a CRA proxy (setupProxy.js), you can leave this empty and just use relative paths.
const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

/**
 * Small helper for POSTing JSON to the backend.
 */
async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Generate AI response by calling the backend (which talks to OpenAI securely).
 * @param {string} prompt
 * @param {string|null} systemMessage
 * @returns {Promise<string>}
 */
export async function generateAIResponse(prompt, systemMessage = null) {
  // Your backend route should accept { prompt, systemMessage } and return { text } (or similar)
  const data = await postJSON("/api/ai/generate", { prompt, systemMessage });

  // Be tolerant of different shapes (text, content, choices[0].message.content, etc.)
  return (
    data?.text ??
    data?.content ??
    data?.message?.content ??
    data?.choices?.[0]?.message?.content ??
    JSON.stringify(data)
  );
}

/*
Builds a request to your backend endpoint /api/ai/generate.
Sends { prompt, systemMessage }.
Is tolerant of different backend response shapes (some code returns {text}, others return a whole OpenAI payload).
Returns a single string to the UI.
*/

/**
 * Generate patient summary — builds a structured prompt, then calls generateAIResponse()
 * @param {Object} patient - Patient data
 * @param {Array} visits - Recent visit history (optional)
 * @param {Array} checkups - Recent checkup/vitals history (optional)
 * @returns {Promise<string>}
 * 
 * Notes:
 Prepares a system message (instructions/persona) and a structured prompt using patient data.
 Calculates derived values (e.g., age; BMI if height/weight exist).
 Includes visit history for longitudinal context.
 Enforces strict output formatting rules (specific headers, sections, concision).
 Calls generateAIResponse(prompt, systemMessage) to actually get the text from the backend.
 */

export async function generatePatientSummary(patient, visits = [], checkups = []) {
  const systemMessage = `You are an expert medical AI assistant specializing in longitudinal patient care analysis and generating actionable clinical summaries.

Your expertise includes:
- Analyzing patient trajectories across multiple visits
- Identifying clinically significant trends and patterns
- Risk stratification based on historical data
- Medication management and interaction analysis
- Evidence-based treatment evaluation

Generate summaries that:
- Provide both per-visit analysis AND overall synthesis
- Highlight changes, improvements, or deteriorations over time
- Identify concerning patterns across visits
- Are actionable with specific next steps
- Include quantitative vital trends
- Consider medication-allergy interactions
- Are concise yet comprehensive (max 200 words)

Always maintain HIPAA compliance and focus on patient safety.`;

  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : "Unknown"; 

  const weight = patient.vital_signs?.weight;
  const height = patient.vital_signs?.height;
  const bmi =
    weight && height ? (weight / ((height / 39.37) ** 2)).toFixed(1) : "N/A";

  // Format visit history with detailed summaries for each visit
  const visitHistory = visits && visits.length > 0
    ? visits.slice(0, 5).map((v, idx) => {
        const date = new Date(v.visit_date).toLocaleDateString();
        const complaint = v.chief_complaint || v.reason || 'Not specified';
        const diagnosis = v.diagnosis || 'N/A';
        const treatment = v.treatment_plan || 'N/A';
        const symptoms = v.symptoms || 'None documented';
        
        return `
### Visit ${idx + 1}: ${date}
- **Chief Complaint:** ${complaint}
- **Symptoms:** ${symptoms}
- **Diagnosis:** ${diagnosis}
- **Treatment:** ${treatment}`;
      }).join('\n')
    : 'No recent visits documented';

  // Get latest vital trends across multiple checkups
  const latestVitals = checkups && checkups.length > 0 ? checkups[0]?.vitals : patient.vital_signs;
  
  // Calculate vital trends
  let vitalTrend = '';
  if (checkups && checkups.length > 1) {
    const latest = checkups[0]?.vitals;
    const previous = checkups[1]?.vitals;
    
    const trends = [];
    if (latest?.bp_sys && previous?.bp_sys) {
      const bpChange = latest.bp_sys - previous.bp_sys;
      trends.push(`BP ${previous.bp_sys}/${previous.bp_dia} → ${latest.bp_sys}/${latest.bp_dia} (${bpChange > 0 ? '+' : ''}${bpChange})`);
    }
    if (latest?.heart_rate && previous?.heart_rate) {
      const hrChange = latest.heart_rate - previous.heart_rate;
      trends.push(`HR ${previous.heart_rate} → ${latest.heart_rate} bpm (${hrChange > 0 ? '+' : ''}${hrChange})`);
    }
    if (latest?.weight && previous?.weight) {
      const wtChange = (latest.weight - previous.weight).toFixed(1);
      trends.push(`Weight ${previous.weight} → ${latest.weight} kg (${wtChange > 0 ? '+' : ''}${wtChange})`);
    }
    
    if (trends.length > 0) {
      vitalTrend = '\n**Trends:** ' + trends.join('; ');
    }
  }

  const prompt = `Analyze this patient's longitudinal clinical data and generate a comprehensive summary:

## PATIENT DEMOGRAPHICS
**Name:** ${patient.first_name} ${patient.last_name} (${age}y ${patient.gender})
**MRN:** ${patient.medical_record_number}
**Status:** ${patient.status}

## CURRENT CLINICAL STATE
**Primary Diagnosis:** ${patient.diagnosis || 'Under evaluation'}
**Chief Complaint:** ${patient.chief_complaint || 'Not specified'}
**Current Symptoms:** ${patient.symptoms || 'None documented'}
**Active Treatment:** ${patient.treatment_plan || 'To be determined'}

## MEDICAL BACKGROUND
**Medical History:** ${patient.medical_history || 'None documented'}
**Current Medications:** ${patient.current_medications || 'None listed'}
**Known Allergies:** ${patient.allergies || 'NKDA'}

## VISIT HISTORY (Last 5 Visits - Most Recent First)
${visitHistory}

## VITAL SIGNS PROGRESSION
**Latest Vitals:**
- BP: ${latestVitals?.bp_sys && latestVitals?.bp_dia ? `${latestVitals.bp_sys}/${latestVitals.bp_dia}` : patient.vital_signs?.blood_pressure || 'N/A'} mmHg
- HR: ${latestVitals?.heart_rate || 'N/A'} bpm
- Temp: ${latestVitals?.temperature_c || patient.vital_signs?.temperature || 'N/A'}°C
- Weight: ${latestVitals?.weight || patient.vital_signs?.weight || 'N/A'} kg | BMI: ${bmi}
${vitalTrend}

---

**INSTRUCTIONS:** Generate a comprehensive summary that includes both individual visit summaries AND an overall patient summary. Use this EXACT format:

# CLINICAL SUMMARY

## OVERALL PATIENT STATUS
[2-3 sentences synthesizing the patient's condition across all visits, highlighting progression, improvements, or deteriorations]

## VISIT-BY-VISIT ANALYSIS
[For each visit provided, create a 1-2 sentence summary highlighting the key clinical event, any changes from previous visits, and outcome. Format as:
- **Visit 1 (Date):** [Summary]
- **Visit 2 (Date):** [Summary]
etc.]

## LONGITUDINAL TRENDS
- **Clinical Progress:** [How has the patient's condition evolved? Better/Worse/Stable?]
- **Vital Trends:** [Key changes in BP, HR, weight with numbers]
- **Treatment Response:** [How effective has treatment been based on visit progression?]

## CURRENT MEDICAL PROFILE
- **Active Diagnoses:** [List current conditions]
- **Medications:** [Current meds]
- **Allergies:** [List or NKDA]
- **Risk Level:** [Low/Moderate/High with key risk factors]

## ACTION PLAN
- **Immediate (24-48h):** [Top 1-2 priority actions]
- **Follow-up:** [When and what to monitor based on visit patterns]
- **Concerns:** [Any patterns from visits requiring attention]

## ⚠️ ALERTS
[Critical safety concerns, contraindications, or red flags from visit history. Consider: medication interactions with allergies, worsening trends, missed follow-ups, etc.]

---

**RULES:**
1. MAX 200 words total
2. Each visit summary: 1-2 sentences max
3. Focus on CHANGES and TRENDS across visits
4. Highlight any concerning patterns
5. Include specific numbers for vital trends
6. Bold critical terms only
7. Be actionable and clinically focused`;

  return generateAIResponse(prompt, systemMessage);
}


/**
 * Generate AI insights for patient data analysis — builds a multi-patient prompt and calls the backend.
 * @param {Array} patients
 * @param {string} userQuery
 * @returns {Promise<string>}
 * 
 * Notes:
 * Builds an analytical prompt over many patients (maps key fields into a text block).
   Adds guidance to return findings, risks, recommendations, next steps.
   Calls generateAIResponse(...) so the backend handles the OpenAI call.

   Takes in an array of patients
 */
export async function generatePatientInsights(patients, userQuery) {
  const systemMessage = `You are an AI medical assistant helping healthcare professionals analyze patient data and provide clinical insights.

Your role is to:
- Analyze patient data patterns and trends
- Provide clinical insights and recommendations
- Identify potential health risks or concerns
- Suggest treatment optimizations
- Help with clinical decision-making

Always maintain patient confidentiality and provide evidence-based insights that are clinically relevant and actionable.`;

  const patientDataSummary = patients
    .map((patient) => `
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
`).join('\n');

  const prompt = `Based on the following patient database containing ${patients.length} patients:

${patientDataSummary}

User Query: "${userQuery}"

Please provide a comprehensive analysis and insights. If the query requires specific medical analysis, provide detailed clinical insights. If asking for patient lists or summaries, format them clearly with actionable recommendations.

Format your response using markdown for better readability and include:
- Key findings and patterns
- Clinical insights and recommendations
- Risk assessments if applicable
- Actionable next steps
- Any concerns or areas requiring attention`;

  return generateAIResponse(prompt, systemMessage);
}

const OpenAIService = {
  generateAIResponse,
  generatePatientSummary,
  generatePatientInsights,
};

export default OpenAIService;
