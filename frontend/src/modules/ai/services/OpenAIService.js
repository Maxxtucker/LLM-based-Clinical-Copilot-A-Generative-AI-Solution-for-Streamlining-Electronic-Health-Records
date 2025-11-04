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
 * @param {Object} patient
 * @returns {Promise<string>}
 * 
 * Notes:
 Prepares a system message (instructions/persona) and a structured prompt using patient data.
 Calculates derived values (e.g., age; BMI if height/weight exist).
 Enforces strict output formatting rules (specific headers, sections, concision).
 Calls generateAIResponse(prompt, systemMessage) to actually get the text from the backend.
 */

export async function generatePatientSummary(patient) {
  const systemMessage = `You are an expert medical AI assistant specializing in generating comprehensive, structured patient summaries for healthcare professionals. 

Your expertise includes:
- Clinical assessment and risk stratification
- Medication management and drug interactions
- Vital signs interpretation and clinical significance
- Evidence-based treatment recommendations
- Patient safety and quality of care optimization

Generate summaries that are:
- Clinically accurate and evidence-based
- Structured for quick clinical decision-making
- Actionable with specific recommendations
- Professional and concise
- Focused on patient safety and outcomes

Always maintain HIPAA compliance and provide information that directly supports clinical workflow and patient care.`;

  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : "Unknown"; 

  const weight = patient.vital_signs?.weight;
  const height = patient.vital_signs?.height;
  const bmi =
    weight && height ? (weight / ((height / 39.37) ** 2)).toFixed(1) : "Cannot calculate";

  const prompt = `Generate a comprehensive, structured medical summary for this patient:

## PATIENT DEMOGRAPHICS
**Name:** ${patient.first_name} ${patient.last_name}
**MRN:** ${patient.medical_record_number}
**Age:** ${age} years | **Gender:** ${patient.gender}
**Status:** ${patient.status}
**Contact:** ${patient.phone}

## CLINICAL PRESENTATION
**Chief Complaint:** ${patient.chief_complaint || 'Not specified'}
**Current Symptoms:** ${patient.symptoms || 'Not documented'}
**Primary Diagnosis:** ${patient.diagnosis || 'Under evaluation'}

## MEDICAL HISTORY & RISK FACTORS
**Medical History:** ${patient.medical_history || 'No significant history documented'}
**Current Medications:** ${patient.current_medications || 'No medications listed'}
**Known Allergies:** ${patient.allergies || 'No known allergies'}

## VITAL SIGNS & ASSESSMENT
**Blood Pressure:** ${patient.vital_signs?.blood_pressure || 'Not recorded'} mmHg
**Heart Rate:** ${patient.vital_signs?.heart_rate || 'Not recorded'} bpm
**Temperature:** ${patient.vital_signs?.temperature || 'Not recorded'}°F
**Weight:** ${patient.vital_signs?.weight || 'Not recorded'} lbs
**Height:** ${patient.vital_signs?.height || 'Not recorded'} inches
**BMI:** ${bmi}

## TREATMENT PLAN
**Current Treatment:** ${patient.treatment_plan || 'To be determined'}

---

**INSTRUCTIONS:** Generate a concise, structured clinical summary. You MUST use this EXACT format with proper markdown headers:

# CLINICAL SUMMARY

## OVERVIEW
[1-2 sentences: Patient status and primary concern]

## ASSESSMENT
- **Condition:** [Chief complaint/symptoms]
- **Risk Level:** [Low/Moderate/High with key factors]
- **Vitals:** [Notable vital signs with interpretation]

## MEDICATIONS & ALLERGIES
- **Current:** [Key medications and dosing]
- **Allergies:** [Known allergies and reactions]
- **Interactions:** [Any notable drug interactions]

## RECOMMENDATIONS
- **Immediate:** [Priority actions for next 24-48h]
- **Treatment:** [Key treatment adjustments]
- **Follow-up:** [Monitoring schedule and next steps]

## ALERTS
[Any red flags, contraindications, or safety concerns]

---

**MANDATORY FORMATTING RULES:**
1. Start with exactly: # CLINICAL SUMMARY
2. Use exactly: ## OVERVIEW
3. Use exactly: ## ASSESSMENT
4. Use exactly: ## MEDICATIONS & ALLERGIES
5. Use exactly: ## RECOMMENDATIONS
6. Use exactly: ## ALERTS
7. Keep each section to 1-3 bullet points maximum
8. Use **bold** for key terms only (not headers)
9. Be concise but clinically complete
10. Total summary should be under 200 words
11. DO NOT use ** around headers - use standard markdown # and ##`;

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
