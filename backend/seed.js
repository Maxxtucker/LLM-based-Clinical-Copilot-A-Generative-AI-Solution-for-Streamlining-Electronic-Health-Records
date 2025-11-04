// server/seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI; // no local fallback so you notice misconfig
if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI in .env');
  process.exit(1);
}

// --- Minimal schemas (inline so no imports are needed) ---
const { Schema, model, Types } = mongoose;

const PatientSchema = new Schema({
  first_name: String,
  last_name: String,
  gender: String,
  date_of_birth: Date,
  phone: String,
  email: String,
  address: String,
  status: String,
  medical_record_number: { type: String, index: true, unique: true },
  chief_complaint: String,
  medical_history: String,
  current_medications: String,
  allergies: String,
  diagnosis: String,
  treatment_plan: String,
  vital_signs: {
    blood_pressure: String,
    heart_rate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
  },
}, { timestamps: true });

const VisitSchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  visit_date: { type: Date, required: true, index: true },
  clinician: String,
  chief_complaint: String,
  symptoms: String,
  diagnosis: String,
  treatment_plan: String,
  medical_history: String,
  current_medications: String,
  allergies: String,
  notes: String,
}, { timestamps: true });

const CheckupSchema = new Schema({
  patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  date: { type: Date, required: true, index: true },
  nurse_id: String,
  vitals: {
    bp_sys: Number,
    bp_dia: Number,
    heart_rate: Number,
    temperature_c: Number,
    weight: Number,
    height: Number,
  },
}, { timestamps: true });

const Patient = model('Patient', PatientSchema);
const Visit = model('Visit', VisitSchema);
const Checkup = model('Checkup', CheckupSchema);

const now = Date.now();
const days = (n) => new Date(now - n * 24 * 60 * 60 * 1000);
const hours = (n) => new Date(now - n * 60 * 60 * 1000);

// --- sample data for multiple patients ---
const seedPatients = [
  {
    mrn: 'MRN-0001',
    patient: {
      first_name: 'Rachael',
      last_name: 'Widjaja',
      gender: 'female',
      date_of_birth: '2000-01-15',
      phone: '+65 9123 4567',
      email: 'rachael@example.com',
      address: 'NUS, SG',
      status: 'active',
      medical_record_number: 'MRN-0001',
      chief_complaint: 'Headache',
      medical_history: 'Diabetes, High Cholesterol',
      current_medications: 'Statins',
      allergies: 'None',
      diagnosis: 'Migraine',
      treatment_plan: 'Pain relief medication',
      vital_signs: { blood_pressure: '118/76', heart_rate: 70, temperature: 37.2, weight: 61, height: 170 },
    },
    visits: [
      {
        visit_date: days(7),
        clinician: 'Dr. Aiden Lim',
        chief_complaint: 'Headache',
        symptoms: 'Nausea, photophobia',
        diagnosis: 'Migraine',
        treatment_plan: 'Pain relief medication',
        medical_history: 'Diabetes, High Cholesterol',
        current_medications: 'Statins',
        allergies: 'None',
        notes: 'Improved after rest',
      },
      {
        visit_date: days(30),
        clinician: 'Dr. Sarah Goh',
        chief_complaint: 'Routine checkup',
        symptoms: 'None',
        diagnosis: 'Healthy',
        treatment_plan: 'Maintain diet and exercise',
        medical_history: 'Diabetes, High Cholesterol',
        current_medications: 'Statins',
        allergies: 'None',
        notes: 'Encouraged regular monitoring.',
      },
    ],
    checkups: [
      { date: hours(2),  nurse_id: 'NURSE-001', vitals: { bp_sys: 130, bp_dia: 85, heart_rate: 82, temperature_c: 37.4, weight: 61, height: 170 } },
      { date: days(7),   nurse_id: 'NURSE-002', vitals: { bp_sys: 118, bp_dia: 76, heart_rate: 70, temperature_c: 37.2, weight: 61, height: 170 } },
    ],
  },
  {
    mrn: 'MRN-0002',
    patient: {
      first_name: 'Alice',
      last_name: 'Tan',
      gender: 'female',
      date_of_birth: '1988-05-12',
      phone: '+65 9000 0001',
      email: 'alice@example.com',
      address: 'Jurong, SG',
      status: 'active',
      medical_record_number: 'MRN-0002',
      chief_complaint: 'Chest pain with exertion',
      medical_history: 'Hypertension',
      current_medications: 'Amlodipine',
      allergies: 'NKDA',
      diagnosis: 'Stable angina (suspected)',
      treatment_plan: 'Stress test, nitro as needed',
      vital_signs: { blood_pressure: '132/84', heart_rate: 78, temperature: 36.9, weight: 55, height: 162 },
    },
    visits: [
      {
        visit_date: days(10),
        clinician: 'Dr. Lee Wei',
        chief_complaint: 'Chest pain when climbing stairs',
        symptoms: 'Shortness of breath, chest tightness',
        diagnosis: 'Angina (suspected)',
        treatment_plan: 'ECG + stress test',
        medical_history: 'Hypertension',
        current_medications: 'Amlodipine',
        allergies: 'NKDA',
        notes: 'Referred to cardiology.',
      },
    ],
    checkups: [
      { date: days(1), nurse_id: 'NURSE-003', vitals: { bp_sys: 132, bp_dia: 84, heart_rate: 78, temperature_c: 36.9, weight: 55, height: 162 } },
    ],
  },
  {
    mrn: 'MRN-0003',
    patient: {
      first_name: 'John',
      last_name: 'Lim',
      gender: 'male',
      date_of_birth: '1975-09-23',
      phone: '+65 9000 0002',
      email: 'john@example.com',
      address: 'Tampines, SG',
      status: 'inactive',
      medical_record_number: 'MRN-0003',
      chief_complaint: 'Back pain',
      medical_history: 'None significant',
      current_medications: 'Ibuprofen PRN',
      allergies: 'None',
      diagnosis: 'Muscle strain',
      treatment_plan: 'Rest + physio',
      vital_signs: { blood_pressure: '120/78', heart_rate: 72, temperature: 36.8, weight: 70, height: 175 },
    },
    visits: [
      {
        visit_date: days(20),
        clinician: 'Dr. Kumar',
        chief_complaint: 'Lower back pain',
        symptoms: 'Pain after lifting',
        diagnosis: 'Muscle strain',
        treatment_plan: 'Physio, NSAIDs PRN',
        medical_history: 'None',
        current_medications: 'Ibuprofen PRN',
        allergies: 'None',
        notes: 'Follow-up in 2 weeks.',
      },
    ],
    checkups: [
      { date: days(19), nurse_id: 'NURSE-004', vitals: { bp_sys: 120, bp_dia: 78, heart_rate: 72, temperature_c: 36.8, weight: 70, height: 175 } },
    ],
  },
];

async function upsertPatientByMRN(p) {
  const doc = await Patient.findOneAndUpdate(
    { medical_record_number: p.medical_record_number },
    { $set: p },
    { new: true, upsert: true }
  );
  return doc;
}

async function main() {
  const reset = process.argv.includes('--reset');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to', MONGO_URI);

  if (reset) {
    console.log('⚠️  --reset specified: clearing collections…');
    await Promise.all([Patient.deleteMany({}), Visit.deleteMany({}), Checkup.deleteMany({})]);
  }

  for (const entry of seedPatients) {
    const patient = await upsertPatientByMRN(entry.patient);

    // ensure patient_id for visits/checkups
    const pid = patient._id;

    // upsert visits by (patient_id + visit_date + clinician)
    for (const v of entry.visits) {
      await Visit.findOneAndUpdate(
        { patient_id: pid, visit_date: v.visit_date, clinician: v.clinician || null },
        { $set: { ...v, patient_id: pid } },
        { new: true, upsert: true }
      );
    }

    // upsert checkups by (patient_id + date)
    for (const c of entry.checkups) {
      await Checkup.findOneAndUpdate(
        { patient_id: pid, date: c.date },
        { $set: { ...c, patient_id: pid } },
        { new: true, upsert: true }
      );
    }

    console.log(`🌱 Seeded/updated ${patient.first_name} ${patient.last_name} (${patient.medical_record_number})`);
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

main().catch((e) => { console.error(e); process.exit(1); });
