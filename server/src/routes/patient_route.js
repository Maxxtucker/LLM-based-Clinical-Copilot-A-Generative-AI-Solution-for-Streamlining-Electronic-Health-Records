// routes/patientRoutes.js -> to manage new Patients
const express = require("express");
const Patient = require("../models/Patient.js");
const router = express.Router();

/**
 * GET /api/patients
 * Optional query params:
 *   q: string   (matches first_name, last_name, medical_record_number, email, phone; case-insensitive)
 *   status:     (active|inactive|discharged)
 *   page:       number (default 1)
 *   limit:      number (default 50)
 *   sort:       e.g. "-createdAt" or "last_name"
 */
router.get("/", async (req, res) => {
  try {
    const {
      q,
      status,
      page = 1,
      limit = 50,
      sort = "last_name first_name",
    } = req.query;

    const filter = {};

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { first_name: regex },
        { last_name: regex },
        { medical_record_number: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    if (status) filter.status = status; // only if you pass it

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    const [items, total] = await Promise.all([
      Patient.find(filter).sort(sort).skip((pageNum - 1) * lim).limit(lim),
      Patient.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / lim),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get patient by ID
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create patient
router.post("/", async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update patient
router.put("/:id", async (req, res) => {
  try {
    const updated = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Patient not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete patient
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Patient.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Patient not found" });
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
