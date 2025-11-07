const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    medical_record_number: { type: String, required: true },
    date_of_birth: { type: Date },
    gender: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },

    status: {
      type: String,
      enum: ['active', 'inactive', 'discharged'],
      default: 'active',
    },

    chief_complaint: { type: String },
    medical_history: { type: String },
    current_medications: { type: String },
    allergies: { type: String },
    symptoms: { type: String },
    diagnosis: { type: String },
    treatment_plan: { type: String },

    ai_summary: { type: Boolean, default: false },
    ai_summary_content: { type: String },

    vital_signs: {
      blood_pressure: { type: String },
      heart_rate: { type: Number },
      temperature: { type: Number },
      weight: { type: Number },
      height: { type: Number },
    },

    // Explicitly add timestamp fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

patientSchema.index({ medical_record_number: 1 }, { unique: true });
patientSchema.index({ last_name: 1, first_name: 1 });

// Ensure timestamps are included in JSON output
patientSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.createdAt = doc.createdAt;
    ret.updatedAt = doc.updatedAt;
    return ret;
  }
});

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
