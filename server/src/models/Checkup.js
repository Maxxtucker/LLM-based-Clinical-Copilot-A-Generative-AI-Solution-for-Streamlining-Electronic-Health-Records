// models/Checkup.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const checkupSchema = new Schema({
  patient_id: { type: Types.ObjectId, ref: "Patient", required: true },
  date:      { type: Date, default: Date.now, index: true },
  nurse_id:  String,
  vitals: {
    bp_sys: { type: Number, min: 40, max: 300 },
    bp_dia: { type: Number, min: 20, max: 200 },
    heart_rate: { type: Number, min: 20, max: 250 },
    temperature_c: { type: Number, min: 25, max: 45 },
    weight: { type: Number, min: 1, max: 400 },   
    height: { type: Number, min: 30, max: 250 }  
  }
}, { timestamps: true });

checkupSchema.index({ patient_id: 1, date: 1 });


module.exports = mongoose.model("Checkup", checkupSchema);
