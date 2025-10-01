require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('../models/Patient');

(async function run() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not set');
    await mongoose.connect(uri);

    const samples = [
      {
        first_name: 'Alice',
        last_name: 'Ng',
        medical_record_number: 'MRN-1001',
        date_of_birth: new Date('1990-03-01'),
        gender: 'female',
        phone: '+1 555 123 4567',
        status: 'active',
        vital_signs: { blood_pressure: '118/76', heart_rate: 68, temperature: 36.7 },
      },
      {
        first_name: 'Bob',
        last_name: 'Chen',
        medical_record_number: 'MRN-1002',
        date_of_birth: new Date('1984-07-21'),
        gender: 'male',
        status: 'active',
      },
    ];

    for (const s of samples) {
      const exists = await Patient.findOne({ medical_record_number: s.medical_record_number });
      if (!exists) await Patient.create(s);
    }

    console.log('Seeded patients (idempotent)');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
