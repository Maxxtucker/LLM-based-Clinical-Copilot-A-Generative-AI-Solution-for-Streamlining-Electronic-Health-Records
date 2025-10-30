const express = require("express");
const router = express.Router();
const Checkup = require("../models/Checkup");
const Patient = require("../models/Patient");
const { assertValidDateOrThrow } = require("../utils/date");

router.post("/", async (req, res) => {
  try {
    const { patient_id, date, vitals } = req.body;
    const when = assertValidDateOrThrow(date || Date.now(), "date");

    const c = await Checkup.create({ patient_id, date: when, vitals });

    const bp = (vitals?.bp_sys != null && vitals?.bp_dia != null)
      ? `${vitals.bp_sys}/${vitals.bp_dia}` : undefined;

    await Patient.updateOne(
      { _id: patient_id },
      {
        $set: {
          vital_signs: {
            blood_pressure: bp,
            heart_rate: vitals?.heart_rate,
            temperature: vitals?.temperature_c,
            weight: vitals?.weight,
            height: vitals?.height,
          }
        }
      }
    );

    res.status(201).json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// history (newest first)
router.get("/patient/:id", async (req, res) => {
  try {
    const rows = await Checkup.find({ patient_id: req.params.id }).sort({ date: -1 }).lean();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
