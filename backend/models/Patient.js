// models/Patient.js
import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    medical_record_number: { type: String, unique: true, required: true },
    date_of_birth: { type: Date },
    gender: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },

    status: {
      type: String,
      enum: ["active", "inactive", "discharged"],
      default: "active",
    },

    chief_complaint: { type: String },
    medical_history: { type: String },
    current_medications: { type: String },
    allergies: { type: String },
    symptoms: { type: String },
    diagnosis: { type: String },
    treatment_plan: { type: String },

    ai_summary: { type: Boolean, default: false },

    vital_signs: {
      blood_pressure: { type: String },
      heart_rate: { type: Number },
      temperature: { type: Number },
      weight: { type: Number },
      height: { type: Number },
    },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
