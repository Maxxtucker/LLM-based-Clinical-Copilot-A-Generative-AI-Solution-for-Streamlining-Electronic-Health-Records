// models/Checkup.js
const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const { toDateOrNull } = require("../utils/date");

const checkupSchema = new Schema({
  patient_id: { type: Types.ObjectId, ref: "Patient", required: true, index: true },
  date: {
    type: Date,
    default: Date.now,
    set: toDateOrNull,
    validate: { validator: (v) => v instanceof Date && !isNaN(v), message: "date must be valid" },
    index: true,
  },
  nurse_id: String,
  vitals: {
    bp_sys: { type: Number, min: 40, max: 300 },
    bp_dia: { type: Number, min: 20, max: 200 },
    heart_rate: { type: Number, min: 20, max: 250 },
    temperature_c: { type: Number, min: 25, max: 45 },
    weight: { type: Number, min: 1, max: 400 },
    height: { type: Number, min: 30, max: 250 }
  }
}, { timestamps: true });

//To make sure that there is not a duplicate Checkup document
checkupSchema.index(
  {
    patient_id: 1,
    date: 1,
    "vitals.bp_sys": 1,
    "vitals.bp_dia": 1,
    "vitals.heart_rate": 1,
    "vitals.temperature_c": 1,
    "vitals.weight": 1,
    "vitals.height": 1
  },
  { unique: true, sparse: true, background: true  }
);


module.exports = mongoose.model("Checkup", checkupSchema);

