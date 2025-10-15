/**
 * RAG (Retrieval-Augmented Generation) Service
 * Integrates vector search with AI to provide context-aware responses
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        systemMessage
      })
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
 * @param {string} query - The search query
 * @param {number} topK - Number of results to return (default: 5)
 * @returns {Promise<Array>} - Array of similar patient embeddings
 */
export async function searchSimilarPatients(query, topK = 5) {
  try {
    const response = await fetch('/api/rag/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, topK }),
    });

    if (!response.ok) {
      throw new Error(`Vector search failed: ${response.statusText}`);
    }

    const results = await response.json();
    return results;
  } catch (error) {
    console.error('RAG Search Error:', error);
    return [];
  }
}

/**
 * Generate AI response with RAG context from vector search
 * @param {string} userQuery - User's question or request
 * @param {Array} allPatients - All patients data (fallback)
 * @returns {Promise<string>} - AI response with RAG context
 */
export async function generateRAGResponse(userQuery, allPatients = []) {
  try {
    // Step 1: Perform vector search to find relevant patient data
    console.log('🔍 Performing vector search for:', userQuery);
    const similarPatients = await searchSimilarPatients(userQuery, 3);
    
    // Step 2: Prepare context from vector search results
    let ragContext = '';
    let searchMethod = '';
    
    if (similarPatients && similarPatients.length > 0) {
      console.log(`📊 Found ${similarPatients.length} similar patients via vector search`);
      searchMethod = 'vector_search';
      
      ragContext = similarPatients.map((result, index) => {
        const patient = result.content || result;
        return `
**Relevant Patient ${index + 1} (Similarity Score: ${result.score?.toFixed(3) || 'N/A'}):**
- Patient ID: ${result.patient_id}
- Content: ${patient}
        `;
      }).join('\n');
    } else {
      console.log('⚠️ No similar patients found via vector search, using general patient data');
      searchMethod = 'general_search';
      
      // Fallback to general patient data if vector search returns no results
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

    // Step 3: Generate enhanced AI response with RAG context
    const systemMessage = `You are an advanced AI medical assistant with access to a vector database of patient records. You can perform semantic similarity searches to find the most relevant patient cases for any medical query.

Your capabilities include:
- **Semantic Patient Search**: Find patients with similar conditions, symptoms, or medical histories
- **Clinical Pattern Recognition**: Identify trends and patterns across patient populations
- **Evidence-Based Insights**: Provide recommendations based on similar cases
- **Risk Assessment**: Analyze patient data for potential health risks
- **Treatment Optimization**: Suggest treatments based on successful outcomes in similar cases

Always maintain patient confidentiality and provide clinically relevant, evidence-based insights.`;

    const prompt = `**User Query:** "${userQuery}"

**Context from ${searchMethod === 'vector_search' ? 'Vector Search' : 'Patient Database'} (Most Relevant Patient Cases):**
${ragContext || 'No patient data available, but I can provide general medical insights.'}

**Instructions:**
Based on the user's query and the available patient data, provide a comprehensive response that:

1. **Directly addresses the user's question** using the available patient context
2. **Highlights key findings** from the patient data (${searchMethod === 'vector_search' ? 'found via semantic similarity search' : 'from general database search'})
3. **Provides clinical insights** based on the retrieved patient information
4. **Suggests actionable recommendations** if applicable
5. **Identifies any patterns or trends** across the patient cases

${searchMethod === 'vector_search' ? 
  'Since vector search found specific similar patients, reference them and explain why they are relevant to the query.' : 
  'Since no specific similar patients were found via vector search, I\'m using general patient data. Provide insights based on the available patient information while noting this limitation.'}

Format your response using markdown for better readability.`;

    console.log('🤖 Generating AI response with RAG context...');
    // Call backend API instead of OpenAI directly to avoid CORS issues
    const aiResponse = await callBackendAI(prompt, systemMessage);
    
    return aiResponse;
  } catch (error) {
    console.error('RAG Response Generation Error:', error);
    throw new Error(`Failed to generate RAG-enhanced response: ${error.message}`);
  }
}

/**
 * Enhanced patient insights with RAG
 * @param {Array} allPatients - All patients data
 * @param {string} userQuery - User's specific question
 * @returns {Promise<string>} - RAG-enhanced insights
 */
export async function generateRAGPatientInsights(allPatients, userQuery) {
  try {
    // Use RAG for more intelligent patient analysis
    const ragResponse = await generateRAGResponse(userQuery, allPatients);
    
    // Add additional context about the overall patient database
    const databaseStats = `
**Patient Database Overview:**
- Total Patients: ${allPatients.length}
- Active Patients: ${allPatients.filter(p => p.status === 'active').length}
- Common Conditions: ${getMostCommonConditions(allPatients).join(', ')}
- Age Range: ${getAgeRange(allPatients)}
    `;

    return `${ragResponse}\n\n---\n\n${databaseStats}`;
  } catch (error) {
    console.error('RAG Patient Insights Error:', error);
    // Fallback to backend AI if RAG fails
    console.log('🔄 Falling back to backend AI service...');
    const fallbackPrompt = `Based on the patient data, provide insights for: "${userQuery}"`;
    return await callBackendAI(fallbackPrompt, 'You are a medical AI assistant.');
  }
}

/**
 * Get most common conditions from patient data
 * @param {Array} patients - Array of patient objects
 * @returns {Array} - Array of common conditions
 */
function getMostCommonConditions(patients) {
  const conditions = {};
  patients.forEach(patient => {
    const diagnosis = patient.diagnosis;
    const history = patient.medical_history;
    
    if (diagnosis) {
      conditions[diagnosis] = (conditions[diagnosis] || 0) + 1;
    }
    if (history) {
      conditions[history] = (conditions[history] || 0) + 1;
    }
  });
  
  return Object.entries(conditions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([condition]) => condition);
}

/**
 * Get age range from patient data
 * @param {Array} patients - Array of patient objects
 * @returns {string} - Age range string
 */
function getAgeRange(patients) {
  const currentYear = new Date().getFullYear();
  const ages = patients
    .filter(p => p.date_of_birth)
    .map(p => currentYear - new Date(p.date_of_birth).getFullYear())
    .filter(age => age > 0 && age < 120);
  
  if (ages.length === 0) return 'Not available';
  
  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);
  return `${minAge}-${maxAge} years`;
}

/**
 * Smart query classification for better RAG results
 * @param {string} query - User query
 * @returns {Object} - Query classification with search strategy
 */
export function classifyQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Medical condition queries
  if (lowerQuery.includes('diabetes') || lowerQuery.includes('hypertension') || 
      lowerQuery.includes('chest pain') || lowerQuery.includes('headache') ||
      lowerQuery.includes('fever') || lowerQuery.includes('pain')) {
    return {
      type: 'medical_condition',
      searchStrategy: 'symptoms_and_conditions',
      priority: 'high'
    };
  }
  
  // Patient demographic queries
  if (lowerQuery.includes('age') || lowerQuery.includes('gender') || 
      lowerQuery.includes('elderly') || lowerQuery.includes('young')) {
    return {
      type: 'demographic',
      searchStrategy: 'demographics',
      priority: 'medium'
    };
  }
  
  // Treatment queries
  if (lowerQuery.includes('treatment') || lowerQuery.includes('medication') || 
      lowerQuery.includes('therapy') || lowerQuery.includes('drug')) {
    return {
      type: 'treatment',
      searchStrategy: 'treatment_plans',
      priority: 'high'
    };
  }
  
  // General analysis queries
  return {
    type: 'general',
    searchStrategy: 'comprehensive',
    priority: 'medium'
  };
}

const RAGService = {
  searchSimilarPatients,
  generateRAGResponse,
  generateRAGPatientInsights,
  classifyQuery
};

export default RAGService;
