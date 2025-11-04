const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const { toDateOrNull } = require("../../../core/utils/date");

const visitSchema = new Schema(
  {
    patient_id: {
      type: Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    // Optional link to the vitals captured around this visit
    checkup_id: {
      type: Types.ObjectId,
      ref: "Checkup",
      required: false,
      index: true,
    },

    visit_date: {
      type: Date,
      required: true,
      set: toDateOrNull,
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

    // --- Migration provenance ---
    _source: {
      type: String,
      enum: ["live", "migrated"],
      default: "live",
      index: true,
    },
    _migrated_from_patient: {
      type: Types.ObjectId,
      ref: "Patient",
      index: true,
    },
    _migrated_at: { type: Date },

  },
  { timestamps: true }
);

// Useful indexes
visitSchema.index({ patient_id: 1, visit_date: -1 }); // for patient visit history
visitSchema.index({ diagnosis: 1 });                  // optional: helps for analytics/search
visitSchema.index({ _source: 1 });                    // quick filtering by provenance

module.exports = mongoose.model("Visit", visitSchema);
