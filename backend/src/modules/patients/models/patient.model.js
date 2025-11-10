const mongoose = require("mongoose");


const patientSchema = new mongoose.Schema(
 {
   first_name: { type: String, required: true, trim: true },
   last_name: { type: String, required: true, trim: true },


   // --- Validation for NRIC ---
   medical_record_number: {
     type: String,
     required: true,
     unique: true,
     trim: true,
     validate: {
       validator: (v) => /^[STFG]\d{7}[A-Z]$/.test(v), // e.g. S1234567D
       message: (props) => `${props.value} is not a valid NRIC format`,
     },
   },


   // --- Date of Birth (valid range) ---
   date_of_birth: {
     type: Date,
     validate: {
       validator: (d) => !d || (d <= new Date() && d >= new Date(1905, 0, 1)),
       message: "Date of birth is out of range",
     },
   },


   // --- Demographics ---
   gender: {
     type: String,
     enum: ["male", "female", "other", "unknown"],
     default: "unknown",
   },


   // --- Singapore phone number validation ---
   phone: {
     type: String,
     trim: true,
     validate: {
       validator: (v) => /^(\+65)?[689]\d{7}$/.test(v), // e.g. +6591234567 or 91234567
       message: (props) => `${props.value} is not a valid Singapore phone number`,
     },
   },


   email: { type: String, lowercase: true, trim: true },


   // --- Simple address validation (must include SG postal code) ---
   address: {
     type: String,
     trim: true,
     validate: {
       validator: (v) => !v || /Singapore\s*\d{6}/i.test(v),
       message: (props) => `${props.value} is not a valid SG address format`,
     },
   },


   // --- Patient status ---
   status: {
     type: String,
     enum: ["active", "inactive", "discharged"],
     default: "active",
     index: true,
   },


   // --- Clinical details ---
   chief_complaint: String,
   medical_history: String,
   current_medications: String,
   allergies: String,
   symptoms: String,
   diagnosis: String,
   treatment_plan: String,


   // --- AI summary or generated content ---
   ai_summary: { type: Boolean, default: false },
   ai_summary_content: String,


   // --- Latest vitals snapshot (full time-series stored in Checkup) ---
   vital_signs: {
     blood_pressure: String, // e.g. "120/75"
     heart_rate: Number,     // bpm
     temperature: Number,    // °C
     weight: Number,         // kg
     height: Number,         // cm
   },


   // --- Migration flags & metadata ---
   _migrated_vitals_to_checkups: { type: Boolean, default: false, select: false },
   _migrated_visits: { type: Boolean, default: false, select: false },
   _last_migration_at: { type: Date, select: false },


   // --- Links to latest related records ---
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


