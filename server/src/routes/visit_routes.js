// server/src/routes/visit_routes.js
const express = require("express");
const mongoose = require("mongoose");
const Visit = require("../models/Visit");
const Patient = require("../models/Patient");
const Checkup = require("../models/Checkup"); // optional: to link latest vitals
const { assertValidDateOrThrow } = require("../utils/date");

const router = express.Router({ mergeParams: true });

/**
 * POST /api/patients/:patientId/visits
 * Create a visit for an existing patient.
 * Body (partial allowed):
 * {
 *   visit_date?: string|number|Date,
 *   clinician?: string,
 *   chief_complaint?: string,
 *   medical_history?: string,
 *   current_medications?: string,
 *   allergies?: string,
 *   symptoms?: string,
 *   diagnosis?: string,
 *   treatment_plan?: string,
 *   notes?: string,
 *   checkup_id?: ObjectId   // optional, else we try to use latest checkup
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId || !mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ error: "Invalid patientId" });
    }

    const patientExists = await Patient.exists({ _id: patientId });
    if (!patientExists) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const body = { ...req.body, patient_id: patientId };

    // Validate/normalize date (disallow future)
    const visitDate = assertValidDateOrThrow(body.visit_date || Date.now(), "visit_date");
    if (visitDate.getTime() > Date.now() + 5 * 60 * 1000) {
      return res.status(400).json({ error: "Visit date cannot be in the future" });
    }
    body.visit_date = visitDate;

    // If no checkup_id provided, auto-link latest checkup (optional)
    if (!body.checkup_id) {
      const latestCheckup = await Checkup.findOne({ patient_id: patientId })
        .sort({ date: -1, createdAt: -1 })
        .select("_id")
        .lean();
      if (latestCheckup) body.checkup_id = latestCheckup._id;
    }

    const created = await Visit.create(body);

    // Optionally denormalize last visit for quick reads
    try {
      await Patient.updateOne(
        { _id: patientId },
        { $set: { last_visit_id: created._id, last_visit_at: created.visit_date } }
      );
    } catch (_) {}

    return res.status(201).json({ visit: created });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

/**
 * GET /api/patients/:patientId/visits
 * List visits newest-first.
 */
router.get("/", async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId || !mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ error: "Invalid patientId" });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const items = await Visit.find({ patient_id: patientId })
      .sort({ visit_date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/patients/:patientId/visits/latest
 * Fetch the most recent visit (for quick display).
 */
router.get("/latest", async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId || !mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ error: "Invalid patientId" });
    }
    const latest = await Visit.findOne({ patient_id: patientId })
      .sort({ visit_date: -1, createdAt: -1 })
      .lean();

    return res.json({ latest: latest || null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
