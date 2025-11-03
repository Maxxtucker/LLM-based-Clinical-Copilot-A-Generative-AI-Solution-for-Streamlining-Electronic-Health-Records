const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name:  { type: String, required: true, trim: true },
    medical_record_number: { type: String, required: true, unique: true, trim: true },
    
    date_of_birth: Date,
    gender: { type: String, enum: ["male", "female", "other", "unknown"], default: "unknown" },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: String,

    status: {
      type: String,
      enum: ["active", "inactive", "discharged"],
      default: "active",
      index: true,
    },

    chief_complaint: String,
    medical_history: String,
    current_medications: String,
    allergies: String,
    symptoms: String,
    diagnosis: String,
    treatment_plan: String,

    ai_summary: { type: Boolean, default: false },
    ai_summary_content: String,

    // Latest snapshot of vitals (time-series in Checkup)
    vital_signs: {
      blood_pressure: String, // e.g. "120/75"
      heart_rate: Number,     // bpm
      temperature: Number,    // °C
      weight: Number,         // kg
      height: Number,         // cm
    },

    // Migration flags & metadata
    _migrated_vitals_to_checkups: { type: Boolean, default: false, select: false },
    _migrated_visits: { type: Boolean, default: false, select: false },
    _last_migration_at: { type: Date, select: false },

    // Optional: link to last related records for quick lookups
    last_visit_id: { type: mongoose.Schema.Types.ObjectId, ref: "Visit", index: true },
    last_checkup_id: { type: mongoose.Schema.Types.ObjectId, ref: "Checkup", index: true },
    last_visit_at: Date,
    last_checkup_at: Date,
  },
  { timestamps: true }
);

// Helpful compound indexes for search
patientSchema.index({
  first_name: 1,
  last_name: 1,
  medical_record_number: 1,
  email: 1,
  phone: 1,
});

module.exports = mongoose.model("Patient", patientSchema);
