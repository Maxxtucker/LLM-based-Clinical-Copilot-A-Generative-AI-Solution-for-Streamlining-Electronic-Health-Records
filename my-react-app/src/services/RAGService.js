/**
 * RAG (Retrieval-Augmented Generation) Service
 * Integrates vector search with AI to provide concise, context-aware responses for clinicians.
 */

import { generateAIResponse } from './OpenAIService';

const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Call backend AI service to avoid CORS issues
 */
async function callBackendAI(prompt, systemMessage) {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemMessage }),
    });

    if (!response.ok) {
      throw new Error(`Backend AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.message || 'AI response generated successfully.';
  } catch (error) {
    console.error('Backend AI call failed:', error);
    throw new Error(`Failed to get AI response from backend: ${error.message}`);
  }
}

/**
 * Search for similar patients using vector search
 */
export async function searchSimilarPatients(query, topK = 5) {
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
    console.error('RAG Search Error:', error);
    return [];
  }
}

/**
 * Generate AI response with RAG context from vector search
 */
export async function generateRAGResponse(userQuery, allPatients = []) {
  try {
    console.log('🔍 Performing vector search for:', userQuery);
    const similarPatients = await searchSimilarPatients(userQuery, 3);

    let ragContext = '';
    let searchMethod = '';

    if (similarPatients && similarPatients.length > 0) {
      console.log(`📊 Found ${similarPatients.length} similar patients via vector search`);
      searchMethod = 'vector_search';

      ragContext = similarPatients.map((result, index) => {
        const patient = result.content || result;
        return `
**Relevant Patient ${index + 1} (Similarity Score: ${result.score?.toFixed(3) || 'N/A'}):**
- Patient ID: ${result.patient_id || 'N/A'}
- Summary: ${patient}
        `;
      }).join('\n');
    } else {
      console.log('⚠️ No similar patients found via vector search, using general patient data');
      searchMethod = 'general_search';

      if (allPatients.length > 0) {
        ragContext = allPatients.slice(0, 3).map(patient => `
**Patient: ${patient.first_name} ${patient.last_name} (MRN: ${patient.medical_record_number})**
- Age: ${patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}
- Chief Complaint: ${patient.chief_complaint || 'None'}
- Medical History: ${patient.medical_history || 'None'}
- Diagnosis: ${patient.diagnosis || 'None'}
- Treatment Plan: ${patient.treatment_plan || 'None'}
- Current Medications: ${patient.current_medications || 'None'}
- Allergies: ${patient.allergies || 'None'}
        `).join('\n');
      }
    }

const systemMessage = `
You are **MedGPT**, an advanced AI assistant integrated into an EHR system.

**Your Role:**
- Assist clinicians and nurses by analyzing patient data retrieved from vector search.
- Provide evidence-based insights, identify trends, and summarize findings concisely.
- Maintain professional tone, factual accuracy, and avoid giving direct diagnoses or treatments.

**Response Format (Markdown, ≤150 words):**
1. **Summary of Findings** (bullets or numbering)
2. **Relevant Patient Data or Trends** (prefer bullets)
3. **Key Clinical Insights** (bullets or numbered)
4. **Suggested Next Steps (if applicable)** (bullets or numbered)

**Guidelines:**
- Prefer **bullet points** or **numbered lists** for clarity.
- Keep output concise and information-dense.
- Transparently note data gaps or uncertainties.
`;

const fewShotExamples = `
### Example 1
**User Query:** "What are the recent trends in blood pressure among hypertensive patients?"
**Retrieved Patient Data:**
- Patient A: BP 140/90 → 145/92 over 3 months
- Patient B: BP 135/85 → 138/88 over 2 months
- Patient C: BP 150/95 → 152/96 over 3 months

**Structured Response (Markdown):**
1. **Summary of Findings**
   - Slight upward trend in BP across patients over 2–3 months.
2. **Relevant Patient Data or Trends**
   - Patient A: 140/90 → 145/92
   - Patient B: 135/85 → 138/88
   - Patient C: 150/95 → 152/96
3. **Key Clinical Insights**
   - BP control may be suboptimal; consistent upward trend noted.
4. **Suggested Next Steps**
   - Review medication adherence.
   - Consider lifestyle counseling.

### Example 2
**User Query:** "Identify patterns of HbA1c in diabetic patients over the last 6 months."
**Retrieved Patient Data:**
- Patient X: 7.2% → 6.9%
- Patient Y: 8.1% → 7.8%
- Patient Z: 6.5% → 6.6%

**Structured Response (Markdown):**
1. **Summary of Findings**
   - Overall modest improvement in HbA1c, with some patients showing stable levels.
2. **Relevant Patient Data or Trends**
   - Patient X: 7.2% → 6.9%
   - Patient Y: 8.1% → 7.8%
   - Patient Z: 6.5% → 6.6%
3. **Key Clinical Insights**
   - Glycemic control improving for most patients; continued monitoring recommended.
4. **Suggested Next Steps**
   - Reinforce adherence to diet and medication.
   - Schedule follow-up labs in 3 months.
`;

const prompt = `
${fewShotExamples}

**User Query:** "${userQuery}"
**Retrieved Patient Data:**
${ragContext || 'No similar patients found. Use general clinical reasoning only.'}

**Final Response:** 
Provide only the structured Markdown response (≤150 words) according to the format above.
`;


    console.log('🤖 Generating AI response with RAG context...');
    const aiResponse = await callBackendAI(prompt, systemMessage);

    return aiResponse;
  } catch (error) {
    console.error('RAG Response Generation Error:', error);
    throw new Error(`Failed to generate RAG-enhanced response: ${error.message}`);
  }
}

/**
 * Generate enhanced patient insights with RAG context
 */
export async function generateRAGPatientInsights(allPatients, userQuery) {
  try {
    const ragResponse = await generateRAGResponse(userQuery, allPatients);

//     const databaseStats = `
// **Patient Database Overview:**
// - Total Patients: ${allPatients.length}
// - Active Patients: ${allPatients.filter(p => p.status === 'active').length}
// - Common Conditions: ${getMostCommonConditions(allPatients).join(', ')}
// - Age Range: ${getAgeRange(allPatients)}
//     `;

    return ragResponse;
  } catch (error) {
    console.error('RAG Patient Insights Error:', error);
    console.log('🔄 Falling back to backend AI service...');
    const fallbackPrompt = `Based on the patient data, provide insights for: "${userQuery}"`;
    return await callBackendAI(fallbackPrompt, 'You are a medical AI assistant.');
  }
}

/** Utility: Get top conditions */
function getMostCommonConditions(patients) {
  const conditions = {};
  patients.forEach(p => {
    const fields = [p.diagnosis, p.medical_history].filter(Boolean);
    fields.forEach(f => (conditions[f] = (conditions[f] || 0) + 1));
  });

  return Object.entries(conditions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([condition]) => condition);
}

/** Utility: Get age range */
function getAgeRange(patients) {
  const currentYear = new Date().getFullYear();
  const ages = patients
    .filter(p => p.date_of_birth)
    .map(p => currentYear - new Date(p.date_of_birth).getFullYear())
    .filter(age => age > 0 && age < 120);

  if (ages.length === 0) return 'Not available';
  return `${Math.min(...ages)}-${Math.max(...ages)} years`;
}

/** Query classifier for search optimization */
export function classifyQuery(query) {
  const q = query.toLowerCase();

  if (q.match(/diabetes|hypertension|pain|fever|headache/)) {
    return { type: 'medical_condition', searchStrategy: 'symptoms', priority: 'high' };
  }
  if (q.match(/age|gender|elderly|young/)) {
    return { type: 'demographic', searchStrategy: 'demographics', priority: 'medium' };
  }
  if (q.match(/treatment|therapy|medication|drug/)) {
    return { type: 'treatment', searchStrategy: 'treatment_plans', priority: 'high' };
  }

  return { type: 'general', searchStrategy: 'comprehensive', priority: 'medium' };
}

const RAGService = {
  searchSimilarPatients,
  generateRAGResponse,
  generateRAGPatientInsights,
  classifyQuery,
};

export default RAGService;
