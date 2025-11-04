/**
 * Mock Data Generator for Clinical Copilot
 * Creates realistic patient data with diverse medical conditions and demographics
 */

const { connectToDB } = require('../core/config/db');
const { embedAndStorePatient } = require('../modules/rag/services/embeddingService');
const mongoose = require('mongoose');

// Patient Schema
const patientSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  medical_record_number: String,
  date_of_birth: Date,
  gender: String,
  phone: String,
  email: String,
  chief_complaint: String,
  medical_history: String,
  diagnosis: String,
  symptoms: String,
  current_medications: String,
  allergies: String,
  treatment_plan: String,
  ai_summary_content: String,
  vital_signs: {
    blood_pressure: String,
    heart_rate: Number,
    temperature: Number,
    weight: Number,
    height: Number
  }
});

const Patient = mongoose.model('Patient', patientSchema);

// Mock data templates
const mockPatients = [
  // Cardiovascular Cases
  {
    first_name: "John",
    last_name: "Smith",
    medical_record_number: "CARD001",
    date_of_birth: new Date("1955-03-15"),
    gender: "male",
    phone: "555-0101",
    email: "john.smith@email.com",
    chief_complaint: "Chest pain and shortness of breath",
    medical_history: "Hypertension for 10 years, family history of heart disease, former smoker (quit 5 years ago)",
    diagnosis: "Acute myocardial infarction, hypertension",
    symptoms: "Chest pain radiating to left arm, shortness of breath, diaphoresis, nausea",
    current_medications: "Metoprolol 50mg daily, Lisinopril 10mg daily, Atorvastatin 40mg daily",
    allergies: "Penicillin",
    treatment_plan: "Cardiac catheterization, dual antiplatelet therapy, beta-blocker, ACE inhibitor, statin therapy",
    ai_summary_content: "65-year-old male with acute MI. Risk factors include hypertension and family history. Successfully treated with PCI. Good prognosis with medication compliance.",
    vital_signs: {
      blood_pressure: "140/90",
      heart_rate: 85,
      temperature: 98.6,
      weight: 180,
      height: 70
    }
  },
  {
    first_name: "Maria",
    last_name: "Garcia",
    medical_record_number: "CARD002",
    date_of_birth: new Date("1962-07-22"),
    gender: "female",
    phone: "555-0102",
    email: "maria.garcia@email.com",
    chief_complaint: "Palpitations and fatigue",
    medical_history: "Atrial fibrillation, diabetes type 2, obesity",
    diagnosis: "Atrial fibrillation, type 2 diabetes mellitus",
    symptoms: "Irregular heartbeat, fatigue, occasional dizziness",
    current_medications: "Warfarin 5mg daily, Metformin 1000mg twice daily, Digoxin 0.25mg daily",
    allergies: "None known",
    treatment_plan: "Anticoagulation therapy, rate control, diabetes management, weight loss counseling",
    ai_summary_content: "60-year-old female with AFib and diabetes. Well-controlled on current medications. Regular monitoring of INR and HbA1c required.",
    vital_signs: {
      blood_pressure: "135/85",
      heart_rate: 95,
      temperature: 98.4,
      weight: 165,
      height: 64
    }
  },

  // Diabetes Cases
  {
    first_name: "Robert",
    last_name: "Johnson",
    medical_record_number: "DIAB001",
    date_of_birth: new Date("1970-11-08"),
    gender: "male",
    phone: "555-0103",
    email: "robert.johnson@email.com",
    chief_complaint: "Increased thirst and frequent urination",
    medical_history: "Type 2 diabetes diagnosed 3 years ago, obesity, sleep apnea",
    diagnosis: "Type 2 diabetes mellitus with poor glycemic control",
    symptoms: "Polyuria, polydipsia, polyphagia, blurred vision, fatigue",
    current_medications: "Metformin 2000mg daily, Glipizide 10mg daily, Lisinopril 5mg daily",
    allergies: "Sulfa drugs",
    treatment_plan: "Insulin therapy initiation, dietary counseling, exercise program, regular HbA1c monitoring",
    ai_summary_content: "52-year-old male with poorly controlled diabetes. HbA1c 9.2%. Requires insulin therapy and lifestyle modifications. High risk for complications.",
    vital_signs: {
      blood_pressure: "150/95",
      heart_rate: 88,
      temperature: 98.7,
      weight: 220,
      height: 72
    }
  },
  {
    first_name: "Sarah",
    last_name: "Williams",
    medical_record_number: "DIAB002",
    date_of_birth: new Date("1985-04-12"),
    gender: "female",
    phone: "555-0104",
    email: "sarah.williams@email.com",
    chief_complaint: "Diabetic foot ulcer",
    medical_history: "Type 1 diabetes since age 12, diabetic nephropathy, retinopathy",
    diagnosis: "Type 1 diabetes mellitus with diabetic foot ulcer, diabetic nephropathy",
    symptoms: "Non-healing ulcer on left foot, decreased sensation in feet",
    current_medications: "Insulin glargine 40 units daily, Insulin lispro with meals, Losartan 50mg daily",
    allergies: "None known",
    treatment_plan: "Wound care, off-loading, glycemic control optimization, nephrology referral",
    ai_summary_content: "37-year-old female with long-standing type 1 diabetes and complications. Excellent glycemic control with HbA1c 7.1%. Requires multidisciplinary care.",
    vital_signs: {
      blood_pressure: "130/80",
      heart_rate: 78,
      temperature: 98.5,
      weight: 140,
      height: 66
    }
  },

  // Respiratory Cases
  {
    first_name: "Michael",
    last_name: "Brown",
    medical_record_number: "RESP001",
    date_of_birth: new Date("1958-09-30"),
    gender: "male",
    phone: "555-0105",
    email: "michael.brown@email.com",
    chief_complaint: "Chronic cough and shortness of breath",
    medical_history: "COPD, 40 pack-year smoking history, occupational dust exposure",
    diagnosis: "Chronic obstructive pulmonary disease, emphysema",
    symptoms: "Chronic productive cough, dyspnea on exertion, wheezing, frequent respiratory infections",
    current_medications: "Albuterol inhaler PRN, Tiotropium daily, Prednisone 10mg daily",
    allergies: "None known",
    treatment_plan: "Smoking cessation, pulmonary rehabilitation, bronchodilator therapy, oxygen therapy if needed",
    ai_summary_content: "64-year-old male with severe COPD. Former heavy smoker. Requires aggressive smoking cessation support and pulmonary rehabilitation. High risk for exacerbations.",
    vital_signs: {
      blood_pressure: "125/80",
      heart_rate: 92,
      temperature: 98.8,
      weight: 155,
      height: 68
    }
  },
  {
    first_name: "Jennifer",
    last_name: "Davis",
    medical_record_number: "RESP002",
    date_of_birth: new Date("1990-12-05"),
    gender: "female",
    phone: "555-0106",
    email: "jennifer.davis@email.com",
    chief_complaint: "Asthma exacerbation",
    medical_history: "Childhood asthma, allergic rhinitis, eczema",
    diagnosis: "Asthma, allergic rhinitis",
    symptoms: "Wheezing, chest tightness, nocturnal cough, exercise-induced symptoms",
    current_medications: "Fluticasone/salmeterol inhaler twice daily, Albuterol inhaler PRN, Loratadine 10mg daily",
    allergies: "Dust mites, pollen, pet dander",
    treatment_plan: "Controller medication optimization, trigger avoidance, action plan education",
    ai_summary_content: "32-year-old female with well-controlled asthma. Good medication adherence. Seasonal exacerbations during allergy season. Excellent prognosis.",
    vital_signs: {
      blood_pressure: "110/70",
      heart_rate: 75,
      temperature: 98.2,
      weight: 125,
      height: 65
    }
  },

  // Neurological Cases
  {
    first_name: "David",
    last_name: "Wilson",
    medical_record_number: "NEURO001",
    date_of_birth: new Date("1965-06-18"),
    gender: "male",
    phone: "555-0107",
    email: "david.wilson@email.com",
    chief_complaint: "Recurrent headaches and visual disturbances",
    medical_history: "Migraine headaches since age 25, family history of migraines",
    diagnosis: "Migraine with aura",
    symptoms: "Throbbing headache, photophobia, phonophobia, visual aura, nausea, vomiting",
    current_medications: "Sumatriptan 50mg PRN, Propranolol 40mg daily, Magnesium 400mg daily",
    allergies: "Codeine",
    treatment_plan: "Trigger identification, prophylactic therapy, acute treatment optimization",
    ai_summary_content: "57-year-old male with classic migraine with aura. Well-controlled with current regimen. Identified triggers include stress and certain foods. Good quality of life.",
    vital_signs: {
      blood_pressure: "120/75",
      heart_rate: 72,
      temperature: 98.3,
      weight: 170,
      height: 71
    }
  },
  {
    first_name: "Lisa",
    last_name: "Anderson",
    medical_record_number: "NEURO002",
    date_of_birth: new Date("1975-01-25"),
    gender: "female",
    phone: "555-0108",
    email: "lisa.anderson@email.com",
    chief_complaint: "Memory problems and confusion",
    medical_history: "Family history of Alzheimer's disease, depression, anxiety",
    diagnosis: "Mild cognitive impairment, depression",
    symptoms: "Short-term memory loss, difficulty concentrating, mood changes, sleep disturbances",
    current_medications: "Donepezil 5mg daily, Sertraline 50mg daily, Melatonin 3mg at bedtime",
    allergies: "None known",
    treatment_plan: "Cognitive assessment, memory training, depression treatment, family counseling",
    ai_summary_content: "47-year-old female with early cognitive changes. Strong family history of dementia. Requires close monitoring and early intervention strategies.",
    vital_signs: {
      blood_pressure: "115/70",
      heart_rate: 68,
      temperature: 98.4,
      weight: 145,
      height: 67
    }
  },

  // Gastrointestinal Cases
  {
    first_name: "James",
    last_name: "Taylor",
    medical_record_number: "GI001",
    date_of_birth: new Date("1980-08-14"),
    gender: "male",
    phone: "555-0109",
    email: "james.taylor@email.com",
    chief_complaint: "Abdominal pain and heartburn",
    medical_history: "GERD, hiatal hernia, obesity",
    diagnosis: "Gastroesophageal reflux disease, hiatal hernia",
    symptoms: "Burning chest pain, acid regurgitation, dysphagia, nocturnal symptoms",
    current_medications: "Omeprazole 40mg daily, Famotidine 20mg twice daily",
    allergies: "None known",
    treatment_plan: "Lifestyle modifications, PPI therapy, weight loss, dietary counseling",
    ai_summary_content: "42-year-old male with severe GERD. Good response to PPI therapy. Requires lifestyle modifications and weight management. Consider surgical options if refractory.",
    vital_signs: {
      blood_pressure: "140/90",
      heart_rate: 85,
      temperature: 98.6,
      weight: 210,
      height: 73
    }
  },
  {
    first_name: "Patricia",
    last_name: "Thomas",
    medical_record_number: "GI002",
    date_of_birth: new Date("1972-03-20"),
    gender: "female",
    phone: "555-0110",
    email: "patricia.thomas@email.com",
    chief_complaint: "Chronic diarrhea and abdominal cramps",
    medical_history: "Irritable bowel syndrome, anxiety, lactose intolerance",
    diagnosis: "Irritable bowel syndrome with diarrhea",
    symptoms: "Abdominal pain, diarrhea, bloating, urgency, incomplete evacuation",
    current_medications: "Loperamide 2mg PRN, Dicyclomine 20mg PRN, Probiotics daily",
    allergies: "Lactose",
    treatment_plan: "Dietary modifications, stress management, symptom-based treatment",
    ai_summary_content: "50-year-old female with IBS-D. Symptoms correlate with stress and dietary triggers. Good response to current treatment. Quality of life significantly improved.",
    vital_signs: {
      blood_pressure: "125/80",
      heart_rate: 78,
      temperature: 98.5,
      weight: 135,
      height: 64
    }
  },

  // Orthopedic Cases
  {
    first_name: "William",
    last_name: "Jackson",
    medical_record_number: "ORTHO001",
    date_of_birth: new Date("1960-11-03"),
    gender: "male",
    phone: "555-0111",
    email: "william.jackson@email.com",
    chief_complaint: "Knee pain and stiffness",
    medical_history: "Osteoarthritis, previous knee injury, obesity",
    diagnosis: "Osteoarthritis of the knee",
    symptoms: "Knee pain, stiffness, decreased range of motion, crepitus, difficulty walking",
    current_medications: "Ibuprofen 600mg three times daily, Acetaminophen 1000mg four times daily, Glucosamine 1500mg daily",
    allergies: "Aspirin",
    treatment_plan: "Physical therapy, weight loss, joint injection, possible knee replacement",
    ai_summary_content: "62-year-old male with severe knee osteoarthritis. Conservative management failing. Candidate for total knee arthroplasty. Excellent surgical candidate.",
    vital_signs: {
      blood_pressure: "135/85",
      heart_rate: 82,
      temperature: 98.7,
      weight: 195,
      height: 70
    }
  },
  {
    first_name: "Barbara",
    last_name: "White",
    medical_record_number: "ORTHO002",
    date_of_birth: new Date("1955-05-28"),
    gender: "female",
    phone: "555-0112",
    email: "barbara.white@email.com",
    chief_complaint: "Hip pain and difficulty walking",
    medical_history: "Osteoporosis, hip fracture 2 years ago, postmenopausal",
    diagnosis: "Osteoarthritis of the hip, osteoporosis",
    symptoms: "Hip pain, limping, difficulty with stairs, decreased mobility",
    current_medications: "Alendronate 70mg weekly, Calcium 1200mg daily, Vitamin D 1000 IU daily, Acetaminophen 1000mg PRN",
    allergies: "None known",
    treatment_plan: "Bone density monitoring, fall prevention, hip replacement evaluation",
    ai_summary_content: "67-year-old female with hip osteoarthritis and osteoporosis. Good bone density improvement with bisphosphonate therapy. Excellent candidate for hip replacement.",
    vital_signs: {
      blood_pressure: "120/75",
      heart_rate: 76,
      temperature: 98.4,
      weight: 150,
      height: 65
    }
  },

  // Pediatric Cases
  {
    first_name: "Emma",
    last_name: "Johnson",
    medical_record_number: "PED001",
    date_of_birth: new Date("2015-09-10"),
    gender: "female",
    phone: "555-0113",
    email: "emma.parents@email.com",
    chief_complaint: "Fever and rash",
    medical_history: "Previous ear infections, allergies to peanuts",
    diagnosis: "Viral exanthem, otitis media",
    symptoms: "Fever, rash, ear pain, irritability, decreased appetite",
    current_medications: "Acetaminophen 15mg/kg every 6 hours, Amoxicillin 40mg/kg twice daily",
    allergies: "Peanuts, penicillin (mild)",
    treatment_plan: "Antibiotic therapy, fever management, follow-up in 48 hours",
    ai_summary_content: "8-year-old female with viral illness and secondary otitis media. Good response to antibiotic therapy. No complications. Excellent prognosis.",
    vital_signs: {
      blood_pressure: "95/60",
      heart_rate: 110,
      temperature: 101.2,
      weight: 55,
      height: 48
    }
  },
  {
    first_name: "Lucas",
    last_name: "Smith",
    medical_record_number: "PED002",
    date_of_birth: new Date("2012-12-15"),
    gender: "male",
    phone: "555-0114",
    email: "lucas.parents@email.com",
    chief_complaint: "Wheezing and difficulty breathing",
    medical_history: "Asthma, allergic rhinitis, family history of asthma",
    diagnosis: "Asthma exacerbation",
    symptoms: "Wheezing, chest tightness, shortness of breath, nocturnal symptoms",
    current_medications: "Albuterol inhaler PRN, Fluticasone 110mcg twice daily, Montelukast 5mg daily",
    allergies: "Dust mites, pollen",
    treatment_plan: "Controller medication optimization, trigger avoidance, action plan education",
    ai_summary_content: "11-year-old male with well-controlled asthma. Good medication adherence. Seasonal exacerbations. Excellent prognosis with proper management.",
    vital_signs: {
      blood_pressure: "100/65",
      heart_rate: 95,
      temperature: 98.8,
      weight: 75,
      height: 55
    }
  },

  // Geriatric Cases
  {
    first_name: "Eleanor",
    last_name: "Brown",
    medical_record_number: "GERI001",
    date_of_birth: new Date("1930-04-12"),
    gender: "female",
    phone: "555-0115",
    email: "eleanor.brown@email.com",
    chief_complaint: "Confusion and falls",
    medical_history: "Dementia, osteoporosis, hypertension, diabetes",
    diagnosis: "Alzheimer's disease, osteoporosis, hypertension, type 2 diabetes",
    symptoms: "Memory loss, confusion, frequent falls, urinary incontinence, wandering",
    current_medications: "Donepezil 10mg daily, Memantine 10mg twice daily, Metformin 500mg twice daily, Lisinopril 5mg daily, Alendronate 70mg weekly",
    allergies: "None known",
    treatment_plan: "Memory care, fall prevention, medication management, family support",
    ai_summary_content: "94-year-old female with advanced dementia. Requires 24-hour supervision. Family support excellent. Focus on comfort and safety.",
    vital_signs: {
      blood_pressure: "140/85",
      heart_rate: 88,
      temperature: 98.6,
      weight: 120,
      height: 62
    }
  },
  {
    first_name: "Harold",
    last_name: "Davis",
    medical_record_number: "GERI002",
    date_of_birth: new Date("1928-08-25"),
    gender: "male",
    phone: "555-0116",
    email: "harold.davis@email.com",
    chief_complaint: "Chest pain and shortness of breath",
    medical_history: "Coronary artery disease, heart failure, atrial fibrillation, diabetes",
    diagnosis: "Acute coronary syndrome, heart failure, atrial fibrillation, diabetes",
    symptoms: "Chest pain, dyspnea, fatigue, edema, palpitations",
    current_medications: "Metoprolol 50mg twice daily, Lisinopril 10mg daily, Furosemide 40mg daily, Warfarin 5mg daily, Metformin 1000mg twice daily",
    allergies: "None known",
    treatment_plan: "Cardiac catheterization, heart failure management, anticoagulation, diabetes control",
    ai_summary_content: "96-year-old male with multiple comorbidities. High surgical risk. Conservative management preferred. Focus on symptom control and quality of life.",
    vital_signs: {
      blood_pressure: "160/95",
      heart_rate: 105,
      temperature: 98.9,
      weight: 165,
      height: 68
    }
  },

  // Mental Health Cases
  {
    first_name: "Amanda",
    last_name: "Miller",
    medical_record_number: "MH001",
    date_of_birth: new Date("1988-06-30"),
    gender: "female",
    phone: "555-0117",
    email: "amanda.miller@email.com",
    chief_complaint: "Anxiety and panic attacks",
    medical_history: "Generalized anxiety disorder, panic disorder, depression",
    diagnosis: "Generalized anxiety disorder, panic disorder with agoraphobia",
    symptoms: "Excessive worry, panic attacks, avoidance behaviors, sleep disturbances, muscle tension",
    current_medications: "Sertraline 100mg daily, Lorazepam 0.5mg PRN, Buspirone 15mg twice daily",
    allergies: "None known",
    treatment_plan: "Cognitive behavioral therapy, medication optimization, relaxation techniques",
    ai_summary_content: "35-year-old female with severe anxiety disorders. Good response to current treatment. Significant improvement in quality of life. Continuing therapy recommended.",
    vital_signs: {
      blood_pressure: "115/75",
      heart_rate: 95,
      temperature: 98.3,
      weight: 130,
      height: 66
    }
  },
  {
    first_name: "Christopher",
    last_name: "Wilson",
    medical_record_number: "MH002",
    date_of_birth: new Date("1992-02-14"),
    gender: "male",
    phone: "555-0118",
    email: "christopher.wilson@email.com",
    chief_complaint: "Depression and suicidal thoughts",
    medical_history: "Major depressive disorder, substance abuse (alcohol), family history of depression",
    diagnosis: "Major depressive disorder, alcohol use disorder",
    symptoms: "Persistent sadness, hopelessness, suicidal ideation, sleep disturbances, appetite changes, fatigue",
    current_medications: "Fluoxetine 40mg daily, Trazodone 50mg at bedtime, Naltrexone 50mg daily",
    allergies: "None known",
    treatment_plan: "Intensive psychotherapy, substance abuse treatment, safety planning, family involvement",
    ai_summary_content: "32-year-old male with severe depression and alcohol dependence. High risk for suicide. Requires intensive treatment and close monitoring. Good family support.",
    vital_signs: {
      blood_pressure: "125/80",
      heart_rate: 88,
      temperature: 98.5,
      weight: 160,
      height: 70
    }
  }
];

async function generateMockData() {
  try {
    console.log('🚀 Starting mock data generation...');
    
    // Check for required environment variables
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
      throw new Error('MONGODB_URI or MONGO_URI environment variable is required');
    }
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    // Connect to database
    await connectToDB(mongoUri);
    console.log('✅ Connected to database');

    // Clear existing patients
    await Patient.deleteMany({});
    console.log('🗑️ Cleared existing patient data');

    // Add createdAt field to mock patients with random dates in the last 30 days
    const patientsWithDates = mockPatients.map(patient => ({
      ...patient,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    }));

    // Insert mock patients
    const insertedPatients = await Patient.insertMany(patientsWithDates);
    console.log(`✅ Inserted ${insertedPatients.length} mock patients with creation dates`);

    // Generate embeddings for each patient
    console.log('🧠 Generating embeddings for vector search...');
    for (let i = 0; i < insertedPatients.length; i++) {
      const patient = insertedPatients[i];
      try {
        await embedAndStorePatient(patient);
        console.log(`✅ Generated embedding for patient ${i + 1}/${insertedPatients.length}: ${patient.first_name} ${patient.last_name}`);
      } catch (error) {
        console.error(`❌ Error generating embedding for ${patient.first_name} ${patient.last_name}:`, error.message);
      }
    }

    console.log('🎉 Mock data generation completed successfully!');
    console.log(`📊 Generated ${insertedPatients.length} patients with diverse medical conditions:`);
    console.log('   - Cardiovascular cases (2)');
    console.log('   - Diabetes cases (2)');
    console.log('   - Respiratory cases (2)');
    console.log('   - Neurological cases (2)');
    console.log('   - Gastrointestinal cases (2)');
    console.log('   - Orthopedic cases (2)');
    console.log('   - Pediatric cases (2)');
    console.log('   - Geriatric cases (2)');
    console.log('   - Mental health cases (2)');
    
    console.log('\n🔍 Your RAG system now has rich, diverse patient data to work with!');
    
  } catch (error) {
    console.error('❌ Error generating mock data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  generateMockData();
}

module.exports = { generateMockData, mockPatients };
