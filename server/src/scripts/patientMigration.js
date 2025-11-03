// Usage:
//   node src/scripts/patientMigration.js --test        # dry-run (no writes)
//   node src/scripts/patientMigration.js               # apply (no unit conversion; just flags)
//   node src/scripts/patientMigration.js --normalize   # apply + convert obvious imperial -> metric

// ---------- Load environment ----------
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log(
  "Using MONGO_URI:",
  (process.env.MONGO_URI || "").replace(/\/\/.*@/, "//<redacted>@"),
  "\nDB_NAME:",
  process.env.DB_NAME || "(unset)"
);

// ---------- Dependencies ----------
const mongoose = require("mongoose");
const Patient = require("../models/Patient.js");
const Checkup = require("../models/Checkup.js");

// Flags
const DRY = process.argv.includes("--test");
const DO_NORMALIZE = process.argv.includes("--normalize");

// ---------- Helpers ----------
function parseBP(bpStr) {
  if (!bpStr || typeof bpStr !== "string") return { bp_sys: undefined, bp_dia: undefined };
  const m = bpStr.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!m) return { bp_sys: undefined, bp_dia: undefined };
  return { bp_sys: Number(m[1]), bp_dia: Number(m[2]) };
}

function detectAnomalies(vs = {}) {
  const flags = [];

  if (typeof vs.temperature === "number") {
    if (vs.temperature > 45 && vs.temperature < 120) flags.push("temp_suspect_fahrenheit_like");
    if (vs.temperature < 30) flags.push("temp_low_c");
    if (vs.temperature > 42) flags.push("temp_high_c");
  }

  if (typeof vs.weight === "number") {
    if (vs.weight > 200) flags.push("weight_outlier_high_kg");
    if (vs.weight < 2) flags.push("weight_outlier_low_kg");
  }

  if (typeof vs.height === "number") {
    if (vs.height < 40) flags.push("height_outlier_low_cm");
    if (vs.height > 250) flags.push("height_outlier_high_cm");
  }

  if (typeof vs.blood_pressure === "string") {
    const { bp_sys, bp_dia } = parseBP(vs.blood_pressure);
    if (bp_sys && (bp_sys < 60 || bp_sys > 250)) flags.push("bp_sys_outlier");
    if (bp_dia && (bp_dia < 30 || bp_dia > 150)) flags.push("bp_dia_outlier");
  }

  return flags;
}

function maybeNormalize(vs = {}) {
  if (!DO_NORMALIZE) {
    return {
      temperature_c: vs.temperature,
      weight: vs.weight,
      height: vs.height,
      normalized: false,
    };
  }

  let t = vs.temperature;
  if (typeof t === "string") t = parseFloat(t);
  if (typeof t === "number" && t > 45) t = Math.round(((t - 32) * 5) / 9 * 10) / 10;

  let w = vs.weight;
  if (typeof w === "number" && w > 140) w = Math.round((w / 2.20462) * 10) / 10;

  let h = vs.height;
  if (typeof h === "number" && h >= 50 && h <= 90) h = Math.round((h * 2.54) * 10) / 10;

  return { temperature_c: t, weight: w, height: h, normalized: true };
}

// ---------- Main ----------
async function run() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI missing in server/.env");
    process.exit(1);
  }

  const connectOpts = {};
  if (process.env.DB_NAME) connectOpts.dbName = process.env.DB_NAME;

  await mongoose.connect(process.env.MONGO_URI, connectOpts);
  console.log("✅ Connected to:", mongoose.connection.host, "DB:", mongoose.connection.db?.databaseName);

  const filter = {
    $and: [
      { _migrated_vitals_to_checkups: { $ne: true } },
      {
        $or: [
          { "vital_signs.blood_pressure": { $exists: true, $ne: null } },
          { "vital_signs.heart_rate": { $exists: true, $ne: null } },
          { "vital_signs.temperature": { $exists: true, $ne: null } },
          { "vital_signs.weight": { $exists: true, $ne: null } },
          { "vital_signs.height": { $exists: true, $ne: null } },
        ],
      },
    ],
  };

  const total = await Patient.countDocuments(filter);
  console.log("Candidates:", total);

  const cursor = Patient.find(filter).lean().cursor();
  let migrated = 0,
    skipped = 0,
    i = 0;

  for await (const p of cursor) {
    i++;

    const { bp_sys, bp_dia } = parseBP(p?.vital_signs?.blood_pressure);
    const flags = detectAnomalies(p?.vital_signs || {});
    const norm = maybeNormalize(p?.vital_signs || {});
    const dateVal = p?.updatedAt ? new Date(p.updatedAt) : new Date();

    const doc = {
      patient_id: p._id,
      date: dateVal,
      vitals: {
        bp_sys,
        bp_dia,
        heart_rate: p?.vital_signs?.heart_rate,
        temperature_c: norm.temperature_c,
        weight: norm.weight,
        height: norm.height,
      },
      vitals_flags: flags,
      normalized: !!norm.normalized,
    };

    const allEmpty = Object.values(doc.vitals).every((v) => v === undefined || v === null);
    if (allEmpty) {
      skipped++;
      console.log(`(${i}) skip ${p.medical_record_number || p._id}: no usable vitals`);
      continue;
    }

    if (DRY) {
      console.log(`(${i}) DRY → would create Checkup for ${p.medical_record_number || p._id}`, doc);
      continue;
    }

    try {
      // Normalize vitals by removing undefined/null keys for cleaner matching
      const filteredVitals = Object.fromEntries(
        Object.entries(doc.vitals).filter(([_, v]) => v !== undefined && v !== null)
      );

      // Deduplication: find any Checkup for this patient created within 30 minutes
      // where at least 4 of 6 vital values match (tolerates missing fields)
      const recentCheckups = await Checkup.find({
        patient_id: p._id,
        date: { $gte: new Date(dateVal.getTime() - 1000 * 60 * 30) }, // last 30 minutes
      }).lean();

      const isDuplicate = recentCheckups.some((c) => {
        let matchCount = 0;
        for (const [k, v] of Object.entries(filteredVitals)) {
          if (c.vitals?.[k] !== undefined && c.vitals[k] === v) matchCount++;
        }
        // Treat as duplicate if ≥4 out of 6 fields match
        return matchCount >= 4;
      });

      if (isDuplicate) {
        console.log(`(${i}) ⏭️ skipped likely duplicate for ${p.medical_record_number || p._id}`);
      } else {
        await Checkup.create({
          ...doc,
          _source: "migrated",
          _migrated_from_patient: p._id,
          _migrated_at: new Date(),
        });
        console.log(`(${i}) ✅ migrated ${p.medical_record_number || p._id}`);
      }

      // Mark patient as migrated
      await Patient.updateOne(
        { _id: p._id },
        { $set: { _migrated_vitals_to_checkups: true, _last_migration_at: new Date() } }
      );
      migrated++;
    } catch (err) {
      skipped++;
      console.warn(`(${i}) ⚠️ Skipped patient ${p._id}: ${err.message}`);
    }
  }

  // ✅ Moved OUTSIDE the loop
  console.log(
    DRY
      ? `DRY-RUN done. Candidates ${total}; skipped ${skipped}.`
      : `✅ Done. Migrated ${migrated}; skipped ${skipped}.`
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
