const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const { toDateOrNull } = require("../utils/date");

const visitSchema = new Schema(
  {
    patient_id: { type: Types.ObjectId, ref: "Patient", required: true, index: true },
    visit_date: {
      type: Date,
      required: true,
      set: toDateOrNull,              // coerces strings/numbers to Date or null
      validate: {
        validator: (v) => v instanceof Date && !isNaN(v),
        message: "visit_date must be a valid date",
      },
      default: Date.now,
      index: true,
    },
    clinician: String,

    chief_complaint: String,
    medical_history: String,
    current_medications: String,
    allergies: String,
    symptoms: String,
    diagnosis: String,
    treatment_plan: String,
    notes: String,
  },
  { timestamps: true }
);

visitSchema.index({ patient_id: 1, visit_date: -1 });

module.exports = mongoose.model("Visit", visitSchema);
