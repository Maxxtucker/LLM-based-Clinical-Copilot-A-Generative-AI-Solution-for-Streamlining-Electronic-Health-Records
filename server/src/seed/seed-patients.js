require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../models/Patient'); // adjust to './src/models/Patient' if file in project root

(async function run() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not set');
    await mongoose.connect(uri);
    console.log('✅ Connected to', uri.split('@').pop());

    const samples = [
      {
        first_name: 'Alice',
        last_name: 'Ng',
        medical_record_number: 'MRN-1001',
        date_of_birth: new Date('1990-03-01'),
        gender: 'female',
        phone: '+1 555 123 4567',
        status: 'active',
        chief_complaint: 'Routine checkup',
        medical_history: 'No significant medical history',
        current_medications: 'None',
        allergies: 'None known',
        symptoms: 'None',
        diagnosis: 'Healthy adult',
        treatment_plan: 'Annual physical recommended',
        ai_summary: false,
      },
      {
        first_name: 'Bob',
        last_name: 'Chen',
        medical_record_number: 'MRN-1002',
        date_of_birth: new Date('1984-07-21'),
        gender: 'male',
        phone: '+1 555 234 5678',
        status: 'active',
        chief_complaint: 'Diabetes management',
        medical_history: 'Type 2 Diabetes (dx 2020); Obesity',
        current_medications: 'Metformin 500mg BID; Glipizide 5mg daily',
        allergies: 'Sulfa drugs (rash)',
        symptoms: 'Polyuria, polydipsia, fatigue',
        diagnosis: 'Type 2 Diabetes Mellitus, poorly controlled',
        treatment_plan: 'Continue current medications; dietary counseling; HbA1c in 3 months',
        ai_summary: true,
      },
      {
        first_name: 'Evelyn',
        last_name: 'Tan',
        medical_record_number: 'MRN-DEMO-001',
        date_of_birth: new Date('1978-11-05'),
        gender: 'female',
        phone: '+1 555 987 6543',
        status: 'active',
        chief_complaint: 'Shortness of breath and chest tightness for 3 days',
        medical_history: 'Hypertension (dx 2015); Hyperlipidemia (dx 2018)',
        current_medications: 'Lisinopril 10 mg daily; Atorvastatin 20 mg nightly',
        allergies: 'Penicillin (rash)',
        symptoms: 'Dyspnea, mild cough, fatigue',
        diagnosis: 'Suspected acute bronchitis',
        treatment_plan: 'Trial of bronchodilator; chest X-ray; follow-up in 48h',
        ai_summary: true,
      },
      {
        first_name: 'David',
        last_name: 'Kim',
        medical_record_number: 'MRN-1003',
        date_of_birth: new Date('1965-12-15'),
        gender: 'male',
        phone: '+1 555 345 6789',
        status: 'active',
        chief_complaint: 'Chest pain during exercise',
        medical_history: 'Family history of CAD; Hyperlipidemia',
        current_medications: 'Atorvastatin 40mg daily; Aspirin 81mg daily',
        allergies: 'None known',
        symptoms: 'Chest tightness with exertion',
        diagnosis: 'Stable angina',
        treatment_plan: 'Stress test; Cardiology referral',
        ai_summary: true,
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        medical_record_number: 'MRN-1004',
        date_of_birth: new Date('1992-05-22'),
        gender: 'female',
        phone: '+1 555 456 7890',
        status: 'active',
        chief_complaint: 'Pregnancy follow-up',
        medical_history: 'Gravida 2, Para 1; Previous C-section (2020)',
        current_medications: 'Prenatal vitamins; Folic acid',
        allergies: 'Latex (contact dermatitis)',
        symptoms: 'Mild nausea, fatigue',
        diagnosis: 'Pregnancy, 24 weeks gestation',
        treatment_plan: 'Regular prenatal care; Ultrasound at 28 weeks',
        ai_summary: false,
      },
      {
        first_name: 'Michael',
        last_name: 'Rodriguez',
        medical_record_number: 'MRN-1005',
        date_of_birth: new Date('1973-08-10'),
        gender: 'male',
        phone: '+1 555 567 8901',
        status: 'inactive',
        chief_complaint: 'Follow-up for depression',
        medical_history: 'Major Depressive Disorder (dx 2019)',
        current_medications: 'Sertraline 100mg daily',
        allergies: 'None known',
        symptoms: 'Improved mood, better sleep',
        diagnosis: 'MDD, in remission',
        treatment_plan: 'Continue current meds; Monthly follow-up',
        ai_summary: true,
      },
      {
        first_name: 'Lisa',
        last_name: 'Wang',
        medical_record_number: 'MRN-1006',
        date_of_birth: new Date('1988-01-30'),
        gender: 'female',
        phone: '+1 555 678 9012',
        status: 'active',
        chief_complaint: 'Migraine headaches',
        medical_history: 'Migraine with aura (dx 2015)',
        current_medications: 'Sumatriptan 50mg PRN; Propranolol 40mg BID',
        allergies: 'Codeine (nausea)',
        symptoms: 'Throbbing headache, nausea',
        diagnosis: 'Migraine with aura',
        treatment_plan: 'Increase Propranolol; consider Botox',
        ai_summary: false,
      },
      {
        first_name: 'James',
        last_name: 'Thompson',
        medical_record_number: 'MRN-1007',
        date_of_birth: new Date('1955-03-18'),
        gender: 'male',
        phone: '+1 555 789 0123',
        status: 'active',
        chief_complaint: 'Memory concerns',
        medical_history: 'Hypertension; Hyperlipidemia',
        current_medications: 'Lisinopril 20mg daily; Donepezil 5mg daily',
        allergies: 'ACE inhibitors (cough)',
        symptoms: 'Forgetfulness, difficulty with names',
        diagnosis: 'Mild Cognitive Impairment',
        treatment_plan: 'MRI brain; follow-up in 6 months',
        ai_summary: true,
      },
      {
        first_name: 'Maria',
        last_name: 'Garcia',
        medical_record_number: 'MRN-1008',
        date_of_birth: new Date('1995-11-08'),
        gender: 'female',
        phone: '+1 555 890 1234',
        status: 'active',
        chief_complaint: 'Thyroid follow-up',
        medical_history: 'Hashimoto\'s thyroiditis (dx 2020)',
        current_medications: 'Levothyroxine 75mcg daily',
        allergies: 'None known',
        symptoms: 'Fatigue, weight gain',
        diagnosis: 'Hypothyroidism, well-controlled',
        treatment_plan: 'Continue Levothyroxine; TSH in 3 months',
        ai_summary: false,
      },
      {
        first_name: 'Robert',
        last_name: 'Brown',
        medical_record_number: 'MRN-1009',
        date_of_birth: new Date('1960-09-25'),
        gender: 'male',
        phone: '+1 555 901 2345',
        status: 'inactive',
        chief_complaint: 'Post-surgical follow-up',
        medical_history: 'Prostate cancer (dx 2022); Radical prostatectomy (2022)',
        current_medications: 'Tamsulosin 0.4mg daily',
        allergies: 'None known',
        symptoms: 'Mild urinary incontinence',
        diagnosis: 'Post-surgical, in remission',
        treatment_plan: 'PSA every 3 months; urology follow-up',
        ai_summary: true,
      },
    ];

    for (const s of samples) {
      const exists = await Patient.findOne({ medical_record_number: s.medical_record_number });
      if (!exists) {
        await Patient.create(s);
        console.log(`✅ Inserted: ${s.first_name} ${s.last_name}`);
      } else {
        console.log(`↺ Skipped (exists): ${s.first_name} ${s.last_name}`);
      }
    }

    console.log('🌱 Seeded all sample patients successfully.');
  } catch (e) {
    console.error('❌ Error during seed:', e.message);
  } finally {
    await mongoose.disconnect();
  }
})();
