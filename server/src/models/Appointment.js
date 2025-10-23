// models/Appointment.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const appointmentSchema = new Schema({
  patient_id: { type: Types.ObjectId, ref: "Patient", required: true, index: true },
  doc_id: String,
  date:   { type: Date, required: true, index: true },
  details: {
    chief_complaint: String,
    medical_history: String,
    current_medications: [String],
    allergies: [String],
    current_symptoms: [String],
    diagnosis: String,
    treatment_plan: String
  }
}, { timestamps: true });

appointmentSchema.index({ date: 1, patient_id: 1 });
appointmentSchema.index({ "details.diagnosis": 1 });

module.exports =  mongoose.model("Appointment", appointmentSchema);
