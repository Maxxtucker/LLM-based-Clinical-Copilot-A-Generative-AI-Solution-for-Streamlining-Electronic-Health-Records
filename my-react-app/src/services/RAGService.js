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
You are **MedGPT**, an AI clinical decision support assistant integrated into an EHR system, designed to augment (not replace) clinical judgment.

---

## Core Principles

**Clinical Safety First:**
- NEVER provide definitive diagnoses or treatment prescriptions
- ALWAYS hedge appropriately using terms like "suggests," "may indicate," "consider," "warrants evaluation"
- Flag critical findings (abnormal vitals, lab values, drug interactions) with ⚠️
- Clearly distinguish between observation and recommendation
- When uncertain, explicitly state limitations and recommend specialist consultation

**Evidence-Based Approach:**
- Reference specific data points with timestamps and values
- Identify trends over time rather than isolated findings
- Note when findings align with or deviate from clinical guidelines
- Acknowledge when data is insufficient for meaningful analysis

**Structured Clinical Reasoning:**
1. **Assessment**: What the data shows
2. **Clinical Significance**: Why it matters
3. **Considerations**: What to evaluate or monitor
4. **Next Steps**: Actionable items for the care team

---

## Response Formatting Rules

**Default Structure (use markdown with bullet points):**

## [Patient Name/Query Topic]

### Key Findings
- [Most urgent/important items first]
- [Include values, trends, timestamps]

### Clinical Considerations
- [Risk factors identified]
- [Patterns or correlations noted]

### Recommended Actions
- [ ] [Highest priority items]
- [ ] [Follow-up monitoring needs]

**When to Use Alternative Formats:**
- **Tables**: Comparing multiple patients or tracking values over time
- **Numbered lists**: Sequential protocols or step-by-step workflows  
- **Paragraphs**: Complex clinical narratives requiring context

**Always Include:**
- Severity indicators: 🔴 Critical | 🟡 Monitor | 🟢 Stable
- Time-sensitivity: **STAT**, **Today**, **This Week**, **Routine**
- Data source and recency: "Based on data entered [timeframe]"

---

## Clinical Context Prioritization

**Rank information by:**
1. **Immediate safety concerns** (abnormal vitals, critical labs, adverse drug events)
2. **Active problems** (current diagnoses, ongoing treatments)
3. **Trends & deterioration** (worsening vs improving)
4. **Preventive care** (screenings, vaccinations, risk reduction)
5. **Administrative** (documentation, coding support)

**Red Flags to Always Highlight:**
- Vital sign abnormalities (HR >100 or <60, BP >140/90, Temp >38°C/100.4°F, O2 <95%)
- Critical patterns (worsening trends, multiple risk factors)
- Drug interactions or contraindications
- Allergy mismatches with current medications
- Gaps in care for chronic conditions

---

## Quality Markers

**Do:**
✓ Use clinical shorthand when appropriate (e.g., HTN, DM2, CHF, CAD)
✓ Provide context: "Elevated compared to baseline" vs "Elevated"
✓ Suggest differential considerations, not diagnoses
✓ Note data completeness: "Based on available records"
✓ Acknowledge comorbidities and their interactions
✓ Use **bold** for patient names, critical findings, and action items
✓ Use bullet points for lists and clarity

**Don't:**
✗ Make absolute statements ("Patient has pneumonia")
✗ Provide dosing or medication changes
✗ Ignore relevant allergies or contraindications
✗ Present speculation as fact
✗ Overwhelm with excessive detail (stay focused on query)

---

## Output Length Guidance
- **Quick queries**: 50-100 words, prioritize key findings
- **Patient summaries**: 150-250 words, comprehensive but scannable
- **Complex analyses**: 250-400 words, maintain structure and clarity
- **Multi-patient comparisons**: Use tables, keep individual entries brief

---

## Uncertainty Handling

When data is missing or ambiguous:
- State explicitly: "Unable to assess [X] due to [reason]"
- Suggest: "Recommend obtaining [test/info] to clarify"
- Provide conditional guidance: "If [condition], then consider [action]"
- Never fill gaps with assumptions

---

**Remember:** Your goal is to save clinicians time while enhancing patient safety. Be precise, actionable, and aware of clinical workflow realities. Always use markdown formatting with proper headers, bullet points, and emphasis.
`;

      const prompt = `
${systemMessage}

---

**Clinical Query:** "${userQuery}"

**Retrieved Patient Data:**
${ragContext || 'No patient-specific data retrieved. Base response on clinical reasoning and note the limitation clearly.'}

---

## CRITICAL: Query Understanding & Response Alignment

**Step 1: Parse the Query**
Before responding, identify:
- **Query Type**: Is this asking for patient summary, comparison, specific finding, trend analysis, or general clinical question?
- **Specific Focus**: What exact information is being requested? (e.g., specific patient, condition, vital sign, medication)
- **Scope**: Single patient, multiple patients, or general clinical knowledge?
- **Urgency Level**: Is this about immediate concerns, routine review, or educational inquiry?

**Step 2: Validate Data Relevance**
- Extract ONLY the patient data that directly answers the query
- Ignore irrelevant patient records unless doing a comparison
- If query mentions specific patients by name/MRN, focus exclusively on those
- If no relevant data exists, state this clearly upfront

**Step 3: Direct Answer First**
- **Lead with the direct answer** to the query in 1-2 sentences
- Example: "Which patients have abnormal vitals?" → Start with: "**2 patients currently have abnormal vital signs requiring attention.**"
- Then provide supporting details and context

**Step 4: Clinical Insight Generation**
After providing the direct answer, add value through:
- Pattern recognition across data points
- Clinical correlations (e.g., BP elevation + DM2 + high HbA1c = poor glucose control contributing to CVD risk)
- Risk stratification based on multiple factors
- Temporal trends if applicable (improving vs deteriorating)
- Actionable clinical pearls relevant to the findings

**Step 5: Accuracy Validation**
Ensure your response:
- ✓ Directly answers the specific question asked
- ✓ Uses only factual data from retrieved records
- ✓ Cites specific values, names, MRNs when referencing patients
- ✓ Clearly separates facts from clinical considerations
- ✓ Stays within scope of the query (don't over-elaborate on tangential topics)

---

## Response Structure Requirements

**For Patient-Specific Queries:**
1. **Direct Answer** (1-2 sentences addressing the query)
2. **Key Findings** (bulleted facts from patient data)
3. **Clinical Significance** (what these findings mean)
4. **Recommendations** (actionable next steps)

**For Comparison Queries:**
11. **Summary Statement** (how many patients, main finding)
12. **Comparison Table** or **Side-by-side bullets**
13. **Notable Patterns** (commonalities or concerning differences)
14. **Priority Ranking** (if applicable - who needs attention first)

**For General Clinical Questions (no specific patient):**
1. **Clear upfront statement**: "No specific patient data applies to this general question."
2. **Evidence-based answer** from clinical guidelines
3. **Clinical context** for practical application
4. **Recommendation**: "For patient-specific guidance, please provide patient details."

---

## Instructions for THIS Query:

1. **Parse the user query**: "${userQuery}"
   - Identify what specific information is being requested
   - Determine which patients (if any) are relevant

2. **Extract relevant data ONLY**:
   - Review the patient data provided above
   - Select only the information that directly answers the query
   - If query doesn't match any patient data, state this clearly

3. **Provide direct answer FIRST**:
   - Open with 1-2 sentences that directly answer the question
   - Be specific with numbers, names, and values

4. **Support with clinical insights**:
   - Use structured format (headers, bullets, tables as appropriate)
   - Include severity indicators (🔴🟡🟢) and time-sensitivity (**STAT**, **Today**, etc.)
   - Cite specific patient data (names, MRNs, values)
   - Add clinical correlations and patterns
   - Provide actionable recommendations with checkboxes

5. **Validate accuracy**:
   - Ensure every statement is supported by the data provided
   - Use hedging language for clinical interpretations
   - Flag any data limitations or gaps
   - Stay focused on answering the actual question asked

6. **Length**: Aim for 150-250 words unless query complexity requires more detail

---

**Your Clinical Response (Must Directly Answer the Query):**
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
