// routes/visit_routes.js
const express = require("express");
const Visit = require("../models/Visit");
const { assertValidDateOrThrow } = require("../utils/date");

const router = express.Router();

/**
 * POST /api/visits
 * Create a visit record
 */
router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };

    if (!body.patient_id) throw new Error("patient_id is required");

    // accept Date | ISO string | epoch ms, throw if invalid
    body.visit_date = assertValidDateOrThrow(body.visit_date || Date.now(), "visit_date");

    // prevents vitals being recorded in the future
    const now = Date.now();
    if (body.visit_date.getTime() > now + 5 * 60 * 1000) {
      throw new Error("Visit date cannot be in the future");
    }
    

    const visit = await Visit.create(body);
    res.status(201).json(visit);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * PUT /api/visits/:id
 * Update a visit record
 */
router.put("/:id", async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.visit_date !== undefined) {
      body.visit_date = assertValidDateOrThrow(body.visit_date, "visit_date");
      const now = Date.now();
      if (body.visit_date.getTime() > now + 5 * 60 * 1000) {
        throw new Error("Visit date cannot be in the future");
      }      
    }

    const updated = await Visit.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Visit not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * GET /api/visits/patient/:patientId
 * List visits for a patient (newest first)
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const items = await Visit.find({ patient_id: req.params.patientId })
      .sort({ visit_date: -1 })
      .lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
