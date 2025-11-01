// Usage:
//   node src/scripts/visitMigration.js --test        # dry-run (no writes)
//   node src/scripts/visitMigration.js               # apply real inserts

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

const mongoose = require("mongoose");
const Patient = require("../models/Patient.js");
const Visit = require("../models/Visit.js");

const DRY = process.argv.includes("--test");


function safeDate(source) {
  const d = source?.updatedAt || source?.createdAt;
  return d ? new Date(d) : new Date();
}

// ---------- Main ----------
async function run() {
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

  // Filter: only patients who have clinical info but not yet migrated
  const filter = {
    _migrated_visits: { $ne: true },
    $or: [
      { chief_complaint: { $exists: true, $ne: "" } },
      { diagnosis: { $exists: true, $ne: "" } },
      { treatment_plan: { $exists: true, $ne: "" } },
    ],
  };

  const total = await Patient.countDocuments(filter);
  console.log("Candidates:", total);

  const cursor = Patient.find(filter).lean().cursor();
  let migrated = 0, skipped = 0, i = 0;

  for await (const p of cursor) {
    i++;
    const doc = {
      patient_id: p._id,
      visit_date: safeDate(p),
      visit_reason: p.chief_complaint || "N/A",
      diagnosis: p.diagnosis || "N/A",
      treatment_plan: p.treatment_plan || "N/A",
      doctor_notes: p.doctor_notes || "",
      follow_up_date: null,
    };

    const allEmpty = !(
      p.chief_complaint ||
      p.diagnosis ||
      p.treatment_plan
    );
    if (allEmpty) {
      skipped++;
      console.log(`(${i}) skip ${p.medical_record_number || p._id}: no visit info`);
      continue;
    }

    if (DRY) {
      console.log(`(${i}) DRY → would create Visit for ${p.medical_record_number || p._id}`, doc);
      continue;
    }

    try {
      // Check if there is existing Visit record with same details (±1 day window)
      const exists = await Visit.findOne({
        patient_id: p._id,
        visit_reason: doc.visit_reason,
        diagnosis: doc.diagnosis,
        treatment_plan: doc.treatment_plan,
        visit_date: {
          $gte: new Date(doc.visit_date.getTime() - 1000 * 60 * 60 * 24),  // 1 day before
          $lte: new Date(doc.visit_date.getTime() + 1000 * 60 * 60 * 24),  // 1 day after
        },
      }).lean();


      if (!exists) {
        await Visit.create(doc);
        await Patient.updateOne(
          { _id: p._id },
          { $set: { _migrated_visits: true } }
        );
        migrated++;
        console.log(`(${i}) migrated ${p.medical_record_number || p._id}`);
      } else {
        console.log(`(${i}) skip ${p.medical_record_number || p._id}: already exists`);
        skipped++;
      }
    } catch (err) {
      skipped++;
      console.warn(`(${i}) ⚠️ Skipped ${p._id}: ${err.message}`);
    }
  }

  console.log(
    DRY
      ? `DRY-RUN done. Candidates ${total}; skipped ${skipped}.`
      : `✅ Done. Migrated ${migrated}; skipped ${skipped}.`
  );

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
