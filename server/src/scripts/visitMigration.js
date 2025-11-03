// Usage:
//   node src/scripts/visitMigration.js --test      # dry-run (no writes)
//   node src/scripts/visitMigration.js             # apply real inserts
//   node src/scripts/visitMigration.js --force     # ignore _migrated_visits flag

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

console.log(
  "Using MONGO_URI:",
  (process.env.MONGO_URI || "").replace(/\/\/.*@/, "//<redacted>@"),
  "\nDB_NAME:",
  process.env.DB_NAME || "(unset)"
);

const mongoose = require("mongoose");
const Patient = require("../models/Patient.js");
const Visit   = require("../models/Visit.js");

const DRY   = process.argv.includes("--test");
const FORCE = process.argv.includes("--force");

function safeDate(source) {
  const d = source?.updatedAt || source?.createdAt;
  return d ? new Date(d) : new Date();
}
const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : s);

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI missing in .env");
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

    // Candidates: patients with any visit-ish fields populated
    let filter = {
      $or: [
        { chief_complaint: { $exists: true, $ne: "" } },
        { diagnosis:       { $exists: true, $ne: "" } },
        { treatment_plan:  { $exists: true, $ne: "" } },
        { symptoms:        { $exists: true, $ne: "" } },
        { medical_history: { $exists: true, $ne: "" } },
        { current_medications: { $exists: true, $ne: "" } },
      ],
    };
    if (!FORCE) {
      filter = { $and: [ { _migrated_visits: { $ne: true } }, filter ] };
    }

    const total = await Patient.countDocuments(filter);
    console.log("Candidates:", total);

    const cursor = Patient.find(filter).lean().cursor();
    let migrated = 0, skipped = 0, dupes = 0, i = 0;

    for await (const p of cursor) {
      i++;

      // Map to your Visit schema fields
      const visitDoc = {
        patient_id:      p._id,
        visit_date:      safeDate(p),
        clinician:       p.clinician || undefined,   // if you had saved it on Patient
        chief_complaint: p.chief_complaint || "N/A",
        medical_history: p.medical_history || "",
        current_medications: p.current_medications || "",
        allergies:       p.allergies || "",
        symptoms:        p.symptoms || "",
        diagnosis:       p.diagnosis || "N/A",
        treatment_plan:  p.treatment_plan || "N/A",
        notes:           p.doctor_notes || "",       // map doctor_notes -> notes if present

        // provenance (these two fields exist in your Visit model)
        _migrated_from_patient: p._id,
        _migrated_at: new Date(),
      };

      const allEmpty =
        !p.chief_complaint &&
        !p.diagnosis &&
        !p.treatment_plan &&
        !p.symptoms &&
        !p.medical_history &&
        !p.current_medications;

      if (allEmpty) {
        skipped++;
        console.log(`(${i}) ⏭️ skip ${p.medical_record_number || p._id}: no visit info`);
        continue;
      }

      if (DRY) {
        console.log(`(${i}) DRY → would create Visit for ${p.medical_record_number || p._id}`, {
          patient_id: visitDoc.patient_id,
          visit_date: visitDoc.visit_date,
          chief_complaint: visitDoc.chief_complaint,
          diagnosis: visitDoc.diagnosis,
          treatment_plan: visitDoc.treatment_plan,
        });
        continue;
      }

      try {
        // Dedup: find Visits within ±3h and match at least 2/3 key texts
        const recent = await Visit.find({
          patient_id: p._id,
          visit_date: {
            $gte: new Date(visitDoc.visit_date.getTime() - 1000 * 60 * 60 * 3),
            $lte: new Date(visitDoc.visit_date.getTime() + 1000 * 60 * 60 * 3),
          },
        }).lean();

        const target = {
          cc:   norm(visitDoc.chief_complaint),
          diag: norm(visitDoc.diagnosis),
          plan: norm(visitDoc.treatment_plan),
        };

        const isDuplicate = recent.some((v) => {
          let matchCount = 0;
          if (target.cc   && norm(v.chief_complaint) === target.cc) matchCount++;
          if (target.diag && norm(v.diagnosis)       === target.diag) matchCount++;
          if (target.plan && norm(v.treatment_plan)  === target.plan) matchCount++;
          return matchCount >= 2;
        });

        if (isDuplicate) {
          dupes++;
          console.log(`(${i}) ⏭️ likely duplicate for ${p.medical_record_number || p._id}`);
        } else {
          await Visit.create(visitDoc);
          await Patient.updateOne(
            { _id: p._id },
            { $set: { _migrated_visits: true, _last_migration_at: new Date() } }
          );
          migrated++;
          console.log(`(${i}) ✅ migrated ${p.medical_record_number || p._id}`);
        }
      } catch (err) {
        skipped++;
        console.warn(`(${i}) ⚠️ Skipped ${p._id}: ${err.message}`);
      }
    }

    console.log(
      DRY
        ? `DRY-RUN done. Candidates ${total}; duplicates ${dupes}; skipped ${skipped}.`
        : `✅ Done. Migrated ${migrated}; duplicates ${dupes}; skipped ${skipped}.`
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Fatal error:", err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
}

run();
