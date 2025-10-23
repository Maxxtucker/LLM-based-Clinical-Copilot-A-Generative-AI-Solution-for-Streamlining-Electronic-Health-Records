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
const Patient  = require("../models/Patient.js");
const Checkup  = require("../models/Checkup.js");

// Flags
const DRY          = process.argv.includes("--test");
const DO_NORMALIZE = process.argv.includes("--normalize");

// ---------- Helpers ----------
function parseBP(bpStr) {
  if (!bpStr || typeof bpStr !== "string") return { bp_sys: undefined, bp_dia: undefined };
  const m = bpStr.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!m) return { bp_sys: undefined, bp_dia: undefined };
  return { bp_sys: Number(m[1]), bp_dia: Number(m[2]) };
}

// Detect outliers / suspicious entries without changing them
function detectAnomalies(vs = {}) {
  const flags = [];

  // Temperature (assuming system intends °C)
  if (typeof vs.temperature === "number") {
    if (vs.temperature > 45 && vs.temperature < 120) flags.push("temp_suspect_fahrenheit_like");
    if (vs.temperature < 30) flags.push("temp_low_c");
    if (vs.temperature > 42) flags.push("temp_high_c");
  }

  // Weight (kg)
  if (typeof vs.weight === "number") {
    if (vs.weight > 200) flags.push("weight_outlier_high_kg");
    if (vs.weight < 2)   flags.push("weight_outlier_low_kg");
  }

  // Height (cm)
  if (typeof vs.height === "number") {
    if (vs.height < 40)  flags.push("height_outlier_low_cm");
    if (vs.height > 250) flags.push("height_outlier_high_cm");
  }

  // Blood pressure plausibility (numbers from parseBP)
  if (typeof vs.blood_pressure === "string") {
    const { bp_sys, bp_dia } = parseBP(vs.blood_pressure);
    if (bp_sys && (bp_sys < 60 || bp_sys > 250)) flags.push("bp_sys_outlier");
    if (bp_dia && (bp_dia < 30 || bp_dia > 150)) flags.push("bp_dia_outlier");
  }

  return flags;
}

// Optional conversion; only if asked via --normalize
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
  if (typeof t === "number" && t > 45) t = Math.round(((t - 32) * 5/9) * 10) / 10; // F -> C

  let w = vs.weight;
  if (typeof w === "number" && w > 140) w = Math.round((w / 2.20462) * 10) / 10;   // lb -> kg

  let h = vs.height;
  if (typeof h === "number" && h >= 50 && h <= 90) h = Math.round((h * 2.54) * 10) / 10; // in -> cm

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
  console.log(
    "✅ Connected host:",
    mongoose.connection.host,
    "DB:",
    mongoose.connection.db?.databaseName
  );

  // Candidates: have any vitals + not yet migrated
  const filter = {
    $and: [
      { _migrated_vitals_to_checkups: { $ne: true } },
      {
        $or: [
          { "vital_signs.blood_pressure": { $exists: true, $ne: null } },
          { "vital_signs.heart_rate":     { $exists: true, $ne: null } },
          { "vital_signs.temperature":    { $exists: true, $ne: null } },
          { "vital_signs.weight":         { $exists: true, $ne: null } },
          { "vital_signs.height":         { $exists: true, $ne: null } },
        ],
      },
    ],
  };

  const total = await Patient.countDocuments(filter);
  console.log("Candidates:", total);

  const cursor = Patient.find(filter).lean().cursor();
  let migrated = 0, skipped = 0, i = 0;

  for await (const p of cursor) {
    i++;

    const { bp_sys, bp_dia } = parseBP(p?.vital_signs?.blood_pressure);
    const flags = detectAnomalies(p?.vital_signs || {});
    const norm  = maybeNormalize(p?.vital_signs || {});

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

    // Skip if everything is empty/undefined
    const allEmpty = [
      doc.vitals.bp_sys,
      doc.vitals.bp_dia,
      doc.vitals.heart_rate,
      doc.vitals.temperature_c,
      doc.vitals.weight,
      doc.vitals.height,
    ].every(v => v === undefined || v === null);

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
      // De-dupe: same vitals near same timestamp
      const exists = await Checkup.findOne({
        patient_id: p._id,
        "vitals.bp_sys":        doc.vitals.bp_sys ?? null,
        "vitals.bp_dia":        doc.vitals.bp_dia ?? null,
        "vitals.heart_rate":    doc.vitals.heart_rate ?? null,
        "vitals.temperature_c": doc.vitals.temperature_c ?? null,
        "vitals.weight":        doc.vitals.weight ?? null,
        "vitals.height":        doc.vitals.height ?? null,
        date: {
          $gte: new Date(dateVal.getTime() - 60_000),
          $lte: new Date(dateVal.getTime() + 60_000),
        },
      }).lean();

      if (!exists) {
        await Checkup.create(doc);
      }

      await Patient.updateOne(
        { _id: p._id },
        { $set: { _migrated_vitals_to_checkups: true } }
      );

      migrated++;
      console.log(`(${i}) migrated ${p.medical_record_number || p._id}`);
    } catch (err) {
      skipped++;
      console.warn(`(${i}) ⚠️ Skipped patient ${p._id}: ${err.message}`);
    }
  }

  console.log(
    DRY
      ? `DRY-RUN done. Candidates ${total}; skipped ${skipped}.`
      : `Done. Migrated ${migrated}; skipped ${skipped}.`
  );

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
