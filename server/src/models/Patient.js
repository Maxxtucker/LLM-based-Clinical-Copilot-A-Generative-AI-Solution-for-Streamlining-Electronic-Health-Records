const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name:  { type: String, required: true },
    medical_record_number: { type: String, required: true, unique: true },
    date_of_birth: Date,
    gender: String,
    phone: String,
    email: String,
    address: String,

    status: { type: String, enum: ['active', 'inactive', 'discharged'], default: 'active' },

    chief_complaint: String,
    medical_history: String,
    current_medications: String,
    allergies: String,
    symptoms: String,
    diagnosis: String,
    treatment_plan: String,

    ai_summary: { type: Boolean, default: false },
    ai_summary_content: String,

    // Latest-snapshot only (time-series lives in Checkup)
    vital_signs: {
      blood_pressure: String,   // e.g. "120/75" (UI convenience)
      heart_rate: Number,       // bpm
      temperature: Number,      // °C
      weight: Number,           // kg
      height: Number,           // cm
    },

    // optional: mark once migration is done
    _migrated_vitals_to_checkups: { type: Boolean, default: false, select: false },
  },
  { timestamps: true } // adds createdAt, updatedAt automatically
);

// helpful indexes
patientSchema.index({ last_name: 1, first_name: 1 });
patientSchema.index({ gender: 1, date_of_birth: 1 });

module.exports = mongoose.model('Patient', patientSchema);

