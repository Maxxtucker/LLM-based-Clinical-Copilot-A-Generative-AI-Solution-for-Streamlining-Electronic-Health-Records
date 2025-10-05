const OpenAI = require('openai');
const natural = require('natural');
const nlp = require('compromise');
const { config } = require('./config');
const { logProcessing, createErrorResponse, createSuccessResponse } = require('./utils');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class MedicalInfoExtractor {
  constructor() {
    // Medical terminology patterns for regex extraction
    this.patterns = {
      bloodPressure: /(?:blood pressure|bp|pressure)[\s:]*(\d{2,3}\/\d{2,3})/gi,
      heartRate: /(?:heart rate|hr|pulse|bpm)[\s:]*(\d{2,3})/gi,
      temperature: /(?:temperature|temp|fever)[\s:]*(\d{2,3}(?:\.\d{1,2})?)/gi,
      weight: /(?:weight|wt)[\s:]*(\d{2,3}(?:\.\d{1,2})?)\s*(?:kg|pounds?|lbs?)?/gi,
      height: /(?:height|ht)[\s:]*(\d{1,2}['"]?\s*\d{0,2}(?:\.\d{1,2})?)\s*(?:ft|feet|inches?|in|cm|meters?)?/gi,
      medications: /(?:medication|med|drug|prescription)[\s:]*([^.]+?)(?:\s|$|\.|,)/gi,
      allergies: /(?:allerg(y|ies)|allergic to)[\s:]*([^.]+?)(?:\s|$|\.|,)/gi,
      symptoms: /(?:symptom|complaint|feeling)[\s:]*([^.]+?)(?:\s|$|\.|,)/gi,
      diagnosis: /(?:diagnosis|dx|condition|disease)[\s:]*([^.]+?)(?:\s|$|\.|,)/gi
    };

    // Medical ontology mappings (simplified - in production, use SNOMED/RxNorm)
    this.medicalTerms = {
      bloodPressure: {
        normal: { systolic: '< 120', diastolic: '< 80' },
        elevated: { systolic: '120-129', diastolic: '< 80' },
        hypertension: { systolic: '>= 130', diastolic: '>= 80' }
      },
      heartRate: {
        bradycardia: '< 60',
        normal: '60-100',
        tachycardia: '> 100'
      },
      temperature: {
        hypothermia: '< 95',
        normal: '97-99',
        fever: '> 100.4'
      }
    };
  }

  /**
   * First pass: Extract structured patterns using regex
   */
  extractWithRegex(text) {
    const extracted = {};

    Object.entries(this.patterns).forEach(([field, pattern]) => {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        extracted[field] = matches.map(match => match[1].trim()).filter(Boolean);
      }
    });

    return extracted;
  }

  /**
   * Second pass: LLM extraction with constrained JSON schema
   */
  async extractWithLLM(text) {
    const schema = {
      type: "object",
      properties: {
        vitalSigns: {
          type: "object",
          properties: {
            bloodPressure: { type: "string", description: "Blood pressure in format 'systolic/diastolic'" },
            heartRate: { type: "number", description: "Heart rate in BPM" },
            temperature: { type: "number", description: "Temperature in Fahrenheit" },
            weight: { type: "number", description: "Weight in pounds" },
            height: { type: "string", description: "Height in feet and inches" }
          }
        },
        medicalInfo: {
          type: "object",
          properties: {
            chiefComplaint: { type: "string", description: "Primary complaint or reason for visit" },
            symptoms: { type: "array", items: { type: "string" }, description: "List of symptoms mentioned" },
            currentMedications: { type: "array", items: { type: "string" }, description: "Current medications" },
            allergies: { type: "array", items: { type: "string" }, description: "Known allergies" },
            medicalHistory: { type: "string", description: "Relevant medical history" },
            diagnosis: { type: "string", description: "Diagnosis or suspected condition" },
            treatmentPlan: { type: "string", description: "Treatment plan or recommendations" }
          }
        },
        confidence: { type: "number", description: "Confidence score 0-1 for the extraction" },
        negationFlags: {
          type: "object",
          description: "Terms that indicate negation (e.g., 'no fever', 'denies chest pain')",
          properties: {
            negatedSymptoms: { type: "array", items: { type: "string" } },
            negatedMedications: { type: "array", items: { type: "string" } },
            negatedAllergies: { type: "array", items: { type: "string" } }
          }
        }
      }
    };

    const fewShotExamples = `
Examples of medical conversation extraction:

Input: "Patient presents with chest pain for 2 days, blood pressure 140/90, heart rate 85. No known allergies. Taking metformin 500mg twice daily."
Output: {
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": 85
  },
  "medicalInfo": {
    "chiefComplaint": "chest pain for 2 days",
    "symptoms": ["chest pain"],
    "currentMedications": ["metformin 500mg twice daily"],
    "allergies": [],
    "medicalHistory": "",
    "diagnosis": "",
    "treatmentPlan": ""
  },
  "confidence": 0.9,
  "negationFlags": {
    "negatedAllergies": ["known allergies"]
  }
}

Input: "Denies fever, blood pressure normal, patient reports headache and nausea."
Output: {
  "vitalSigns": {
    "bloodPressure": "normal"
  },
  "medicalInfo": {
    "chiefComplaint": "headache and nausea",
    "symptoms": ["headache", "nausea"],
    "currentMedications": [],
    "allergies": [],
    "medicalHistory": "",
    "diagnosis": "",
    "treatmentPlan": ""
  },
  "confidence": 0.8,
  "negationFlags": {
    "negatedSymptoms": ["fever"]
  }
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a medical information extraction specialist. Extract structured medical information from doctor-patient conversations. Focus on accuracy and handle negation patterns carefully. Use the provided JSON schema and examples as guidance. Always respond with valid JSON format.`
          },
          {
            role: "user",
            content: `${fewShotExamples}\n\nExtract medical information from this conversation:\n\n${text}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('LLM extraction error:', error);
      return null;
    }
  }

  /**
   * Third pass: Ontology normalization and validation
   */
  normalizeAndValidate(extractedData) {
    const normalized = { ...extractedData };

    // Normalize vital signs
    if (normalized.vitalSigns) {
      // Blood pressure validation
      if (normalized.vitalSigns.bloodPressure) {
        const bp = normalized.vitalSigns.bloodPressure;
        if (typeof bp === 'string' && bp.includes('/')) {
          const [systolic, diastolic] = bp.split('/').map(Number);
          if (systolic > 300 || diastolic > 200 || systolic < diastolic) {
            normalized.vitalSigns.bloodPressure = null; // Invalid reading
          }
        }
      }

      // Heart rate validation
      if (normalized.vitalSigns.heartRate) {
        const hr = Number(normalized.vitalSigns.heartRate);
        if (hr < 30 || hr > 250) {
          normalized.vitalSigns.heartRate = null; // Invalid reading
        }
      }

      // Temperature validation
      if (normalized.vitalSigns.temperature) {
        const temp = Number(normalized.vitalSigns.temperature);
        if (temp < 90 || temp > 110) {
          normalized.vitalSigns.temperature = null; // Invalid reading
        }
      }
    }

    // Normalize medications using NLP
    if (normalized.medicalInfo?.currentMedications) {
      normalized.medicalInfo.currentMedications = normalized.medicalInfo.currentMedications.map(med => {
        // Extract dosage and frequency using compromise
        const doc = nlp(med);
        return {
          name: med, // Keep original medication name
          dosage: doc.match('#Value+ #Unit+').out('text'),
          frequency: doc.match('#Frequency').out('text')
        };
      });
    }

    return normalized;
  }

  /**
   * Apply negation detection
   */
  applyNegationDetection(extractedData, originalText) {
    const negationWords = ['no', 'denies', 'negative', 'none', 'not', 'without', 'free of'];
    const doc = nlp(originalText);

    // Find negated terms
    const negatedTerms = doc.match(`(${negationWords.join('|')}) #Noun+`).out('text');

    // Remove negated items from extracted data
    if (extractedData.negationFlags?.negatedSymptoms) {
      extractedData.medicalInfo.symptoms = extractedData.medicalInfo.symptoms?.filter(
        symptom => !extractedData.negationFlags.negatedSymptoms.some(neg => 
          symptom.toLowerCase().includes(neg.toLowerCase())
        )
      );
    }

    return extractedData;
  }

  /**
   * Main extraction method using hybrid approach
   */
  async extractMedicalInfo(conversationText) {
    try {
      // First pass: Regex extraction
      const regexResults = this.extractWithRegex(conversationText);
      console.log('Regex extraction results:', regexResults);

      // Second pass: LLM extraction
      const llmResults = await this.extractWithLLM(conversationText);
      console.log('LLM extraction results:', llmResults);

      // Combine results (LLM takes precedence for complex extractions, regex for structured data)
      const combinedResults = {
        ...llmResults,
        regexMatches: regexResults
      };

      // Third pass: Normalization and validation
      const normalizedResults = this.normalizeAndValidate(combinedResults);

      // Apply negation detection
      const finalResults = this.applyNegationDetection(normalizedResults, conversationText);

      return {
        success: true,
        data: finalResults,
        confidence: finalResults.confidence || 0.7,
        extractionMethod: 'hybrid',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Medical info extraction error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Update patient record with extracted information
   */
  async updatePatientRecord(patientId, extractedData) {
    const updateFields = {};

    // Map extracted data to patient schema fields
    if (extractedData.vitalSigns) {
      updateFields.vital_signs = {
        blood_pressure: extractedData.vitalSigns.bloodPressure,
        heart_rate: extractedData.vitalSigns.heartRate,
        temperature: extractedData.vitalSigns.temperature,
        weight: extractedData.vitalSigns.weight,
        height: extractedData.vitalSigns.height
      };
    }

    if (extractedData.medicalInfo) {
      const medical = extractedData.medicalInfo;
      updateFields.chief_complaint = medical.chiefComplaint;
      updateFields.symptoms = medical.symptoms?.join(', ');
      updateFields.current_medications = medical.currentMedications?.map(med => 
        typeof med === 'string' ? med : `${med.name} ${med.dosage || ''} ${med.frequency || ''}`.trim()
      ).join(', ');
      updateFields.allergies = medical.allergies?.join(', ');
      updateFields.medical_history = Array.isArray(medical.medicalHistory) 
        ? medical.medicalHistory.join(', ') 
        : medical.medicalHistory;
      updateFields.diagnosis = medical.diagnosis;
      updateFields.treatment_plan = medical.treatmentPlan;
    }

    // Add AI processing flag
    updateFields.ai_summary = true;
    updateFields.ai_summary_content = `Extracted from conversation on ${new Date().toISOString()}`;

    return updateFields;
  }
}

module.exports = MedicalInfoExtractor;
