const mongoose = require("mongoose");

const CheckupSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    nurse_id: { type: String },

    date: {
      type: Date,
      default: Date.now,
      required: true,
      index: true, // helps with sorting/recent lookups
    },

    vitals: {
      bp_sys: Number,
      bp_dia: Number,
      heart_rate: Number,
      temperature_c: Number,
      weight: Number,
      height: Number,
    },

    // Flags from migration script
    vitals_flags: [String],
    normalized: { type: Boolean, default: false },

    // --- Metadata for provenance ---
    _source: {
      type: String,
      enum: ["live", "migrated"],
      default: "live",
      index: true,
    },
    _migrated_from_patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      index: true,
    },
    _migrated_at: { type: Date },
  },
  { timestamps: true }
);

// Optional dedup index (same patient + same date ± tolerance handled in code)
CheckupSchema.index({ patient_id: 1, date: 1 });

// Optional for quick “latest vitals” lookups
CheckupSchema.index({ patient_id: 1, createdAt: -1 });

module.exports = mongoose.model("Checkup", CheckupSchema);
