import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development - in production, use backend API
});

/**
 * Generate AI response using OpenAI GPT-5-mini
 * @param {string} prompt - The prompt to send to the AI
 * @param {string} systemMessage - Optional system message to set context
 * @returns {Promise<string>} - The AI generated response
 */
export async function generateAIResponse(prompt, systemMessage = null) {
  try {
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
      model: 'gpt-5-mini', // Using GPT-5-mini for enhanced performance and capabilities
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
    throw new Error('Failed to generate AI response. Please check your API key and try again.');
  }
}

/**
 * Generate patient summary using OpenAI
 * @param {Object} patient - Patient data object
 * @returns {Promise<string>} - Generated patient summary
 */
export async function generatePatientSummary(patient) {
  const systemMessage = `You are an AI medical assistant specialized in generating comprehensive patient summaries for healthcare professionals. 
  
  Your role is to analyze patient data and create clear, professional, and clinically relevant summaries that help healthcare providers understand:
  - Patient's current condition and chief complaint
  - Medical history and risk factors
  - Current medications and potential interactions
  - Vital signs and their clinical significance
  - Recommended treatment plans and follow-up care
  
  Always maintain patient confidentiality and provide information that would be useful for clinical decision-making.`;

  const prompt = `Please generate a comprehensive medical summary for the following patient:

Patient Information:
- Name: ${patient.first_name} ${patient.last_name}
- Medical Record Number: ${patient.medical_record_number}
- Date of Birth: ${patient.date_of_birth}
- Gender: ${patient.gender}
- Phone: ${patient.phone}
- Status: ${patient.status}

Medical Details:
- Chief Complaint: ${patient.chief_complaint || 'Not specified'}
- Medical History: ${patient.medical_history || 'None recorded'}
- Current Medications: ${patient.current_medications || 'None'}
- Allergies: ${patient.allergies || 'None known'}

Vital Signs:
- Blood Pressure: ${patient.vital_signs?.blood_pressure || 'Not recorded'}
- Heart Rate: ${patient.vital_signs?.heart_rate || 'Not recorded'}
- Temperature: ${patient.vital_signs?.temperature || 'Not recorded'}
- Weight: ${patient.vital_signs?.weight || 'Not recorded'}
- Height: ${patient.vital_signs?.height || 'Not recorded'}

Clinical Information:
- Diagnosis: ${patient.diagnosis || 'Pending'}
- Treatment Plan: ${patient.treatment_plan || 'To be determined'}
- Symptoms: ${patient.symptoms || 'Not specified'}

Please provide a well-structured summary that includes:
1. Patient Overview
2. Current Condition Assessment
3. Medical History Analysis
4. Medication Review
5. Vital Signs Interpretation
6. Clinical Recommendations
7. Follow-up Considerations

Format the response using markdown for better readability.`;

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
