// server/src/routes/checkup_route.js
console.log("[CHECKUPS] mounted:", __filename);

const express = require("express");
const mongoose = require("mongoose");
const Checkup = require("../models/Checkup");
const Patient = require("../models/Patient");
const { assertValidDateOrThrow } = require("../utils/date");

const router = express.Router({ mergeParams: true });

/* ------------ request logger ------------ */
router.use((req, _res, next) => {
  console.log("[CHECKUPS] hit:", req.method, req.originalUrl);
  next();
});

/* ------------ helpers ------------ */

// compact: remove undefined/null/NaN/"" from objects
function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) =>
        v !== undefined &&
        v !== null &&
        !(typeof v === "number" && Number.isNaN(v)) &&
        v !== ""
    )
  );
}
// toNum: safely coerce to number or undefined
const toNum = (v) =>
  v === undefined || v === null || v === "" ? undefined : Number(v);

// Resolve patient id using (in order):
// 1) req.params.patientId (ObjectId)
// 2) req.body.patient_id   (ObjectId)
// 3) MRN: body.medical_record_number / body.mrn / query.mrn
// 4) Keyword: body.keyword / body.q / query.q  (first_name/last_name/MRN/email/phone, case-insensitive)
async function resolvePatientId(req) {
  // 1) :patientId
  const fromParams = req.params?.patientId;
  if (fromParams && mongoose.isValidObjectId(fromParams)) {
    const ok = await Patient.exists({ _id: fromParams });
    if (ok) {
      console.log("[CHECKUPS] resolve → params.patientId:", fromParams);
      return String(fromParams);
    }
  }

  // 2) body.patient_id
  const fromBodyId = req.body?.patient_id;
  if (fromBodyId && mongoose.isValidObjectId(fromBodyId)) {
    const ok = await Patient.exists({ _id: fromBodyId });
    if (ok) {
      console.log("[CHECKUPS] resolve → body.patient_id:", fromBodyId);
      return String(fromBodyId);
    }
  }

  // 3) MRN
  const mrn =
    req.body?.medical_record_number || req.body?.mrn || req.query?.mrn;
  if (mrn) {
    const p = await Patient.findOne({ medical_record_number: mrn })
      .select("_id medical_record_number first_name last_name")
      .lean();
    if (p?._id) {
      console.log("[CHECKUPS] resolve → MRN:", mrn, "→", p._id);
      return String(p._id);
    } else {
      console.log("[CHECKUPS] resolve(MRN) no match for:", mrn);
    }
  }

  // 4) Keyword (like your search bar)
  const keyword = req.body?.keyword || req.body?.q || req.query?.q;
  if (keyword) {
    const re = new RegExp(keyword, "i");
    const p = await Patient.findOne({
      $or: [
        { first_name: re },
        { last_name: re },
        { medical_record_number: re },
        { email: re },
        { phone: re },
      ],
    })
      .select("_id medical_record_number first_name last_name")
      .lean();
    if (p?._id) {
      console.log("[CHECKUPS] resolve → keyword:", keyword, "→", p._id);
      return String(p._id);
    } else {
      console.log("[CHECKUPS] resolve(keyword) no match for:", keyword);
    }
  }

  console.log("[CHECKUPS] resolve → failed");
  return null;
}

/* ------------ routes ------------ */

/**
 * POST
 * Supports:
 *  - /api/patients/:patientId/checkups                 (nested)
 *  - /api/checkups  (if you also mount top-level)      (MRN/keyword/body.patient_id)
 * Body accepts either:
 *  { vitals: { bp_sys, bp_dia, heart_rate, temperature_c, weight, height }, date?, nurse_id? }
 *  or legacy flat shape: { bp_sys, bp_dia, ... }
 */
router.post("/", async (req, res) => {
  console.log("[CHECKUPS] POST", req.originalUrl, req.body);

  try {
    const patientId = await resolvePatientId(req);
    if (!patientId) {
      return res.status(400).json({
        error:
          "Invalid or missing patientId (pass :patientId, body.patient_id, medical_record_number, or keyword)",
      });
    }

    const { date, nurse_id } = req.body;
    const vitalsInput = req.body.vitals || req.body; // accept legacy flat shape

    // date validation
    let checkupDate = date ?? Date.now();
    if (assertValidDateOrThrow) {
      checkupDate = assertValidDateOrThrow(checkupDate, "date");
      if (checkupDate.getTime() > Date.now() + 5 * 60 * 1000) {
        return res
          .status(400)
          .json({ error: "Checkup date cannot be in the future" });
      }
    }

    // clean vitals
    const cleanVitals = compact({
      bp_sys: toNum(vitalsInput.bp_sys),
      bp_dia: toNum(vitalsInput.bp_dia),
      heart_rate: toNum(vitalsInput.heart_rate),
      temperature_c: toNum(vitalsInput.temperature_c),
      weight: toNum(vitalsInput.weight),
      height: toNum(vitalsInput.height),
    });

    // simple rule: systolic >= diastolic
    if (
      cleanVitals.bp_sys !== undefined &&
      cleanVitals.bp_dia !== undefined &&
      cleanVitals.bp_sys < cleanVitals.bp_dia
    ) {
      return res.status(400).json({ error: "bp_sys must be >= bp_dia" });
    }

    if (Object.keys(cleanVitals).length === 0) {
      return res.status(400).json({ error: "No valid vitals provided" });
    }

    const checkup = await Checkup.create({
      patient_id: patientId,
      date: checkupDate,
      nurse_id: nurse_id || req.user?._id || req.user?.id || "unknown",
      vitals: cleanVitals,
      _source: "live",
    });

    // denormalize to Patient.vital_signs snapshot (so UI reflects immediately)
    const bp =
      cleanVitals.bp_sys !== undefined && cleanVitals.bp_dia !== undefined
        ? `${cleanVitals.bp_sys}/${cleanVitals.bp_dia}`
        : undefined;

    const snapshot = compact({
      blood_pressure: bp,
      heart_rate: cleanVitals.heart_rate,
      temperature: cleanVitals.temperature_c,
      weight: cleanVitals.weight,
      height: cleanVitals.height,
    });

    try {
      await Patient.updateOne(
        { _id: patientId },
        {
          $set: {
            vital_signs: snapshot,
            last_checkup_id: checkup._id,
            last_checkup_at: checkup.date,
          },
        }
      );
    } catch (snapErr) {
      console.warn(
        "[CHECKUPS] snapshot update warning:",
        snapErr?.message || snapErr
      );
    }

    console.log("[CHECKUPS] ✅ created", checkup._id, "for", patientId);
    return res.status(201).json(checkup);
  } catch (e) {
    if (e?.code === 11000) {
      return res
        .status(409)
        .json({ error: "Duplicate checkup (same patient/date/vitals)" });
    }
    console.error("checkups POST error:", e);
    return res.status(500).json({ error: e.message || "Failed to create checkup" });
  }
});

/** GET /api/patients/:patientId/checkups?limit=50 */
router.get("/", async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId || !mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ error: "Invalid patientId" });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const items = await Checkup.find({ patient_id: patientId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ items });
  } catch (e) {
    console.error("checkups GET error:", e);
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/patients/:patientId/checkups/latest */
router.get("/latest", async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId || !mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ error: "Invalid patientId" });
    }
    const latest = await Checkup.findOne({ patient_id: patientId })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    res.json({ latest: latest || null });
  } catch (e) {
    console.error("checkups GET latest error:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
