import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development - in production, use backend API
});

/**
 * Generate AI response using OpenAI GPT-4o-mini
 * @param {string} prompt - The prompt to send to the AI
 * @param {string} systemMessage - Optional system message to set context
 * @returns {Promise<string>} - The AI generated response
 */
export async function generateAIResponse(prompt, systemMessage = null) {
  try {
    console.log('Using GPT-4o-mini for AI response generation');
    const messages = [];
    
    // Add system message if provided
    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage
      });
    }
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for reliable performance
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    console.error('Error details:', error.message);
    throw new Error(`Failed to generate AI response: ${error.message}. Please check your API key and try again.`);
  }
}

/**
 * Generate patient summary using OpenAI
 * @param {Object} patient - Patient data object
 * @returns {Promise<string>} - Generated patient summary
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

  // Calculate age from date of birth
  const age = patient.date_of_birth ? 
    new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'Unknown';
  
  // Calculate BMI if weight and height are available
  const weight = patient.vital_signs?.weight;
  const height = patient.vital_signs?.height;
  const bmi = (weight && height) ? 
    (weight / ((height / 39.37) ** 2)).toFixed(1) : 'Cannot calculate';

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
1. Start with exactly: # CLINICAL SUMMARY (with # and space)
2. Use exactly: ## OVERVIEW (with ## and space)
3. Use exactly: ## ASSESSMENT (with ## and space)
4. Use exactly: ## MEDICATIONS & ALLERGIES (with ## and space)
5. Use exactly: ## RECOMMENDATIONS (with ## and space)
6. Use exactly: ## ALERTS (with ## and space)
7. Keep each section to 1-3 bullet points maximum
8. Use **bold** for key terms only (not headers)
9. Be concise but clinically complete
10. Total summary should be under 200 words
11. DO NOT use ** around headers - use standard markdown # and ##`;

  return await generateAIResponse(prompt, systemMessage);
}

/**
 * Generate AI insights for patient data analysis
 * @param {Array} patients - Array of patient objects
 * @param {string} userQuery - User's specific question or request
 * @returns {Promise<string>} - AI generated insights
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

  const patientDataSummary = patients.map(patient => `
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

  return await generateAIResponse(prompt, systemMessage);
}

const OpenAIService = {
  generateAIResponse,
  generatePatientSummary,
  generatePatientInsights
};

export default OpenAIService;
