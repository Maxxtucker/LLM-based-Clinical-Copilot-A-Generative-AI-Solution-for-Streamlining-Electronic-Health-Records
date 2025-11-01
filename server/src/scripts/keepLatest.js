// server/src/scripts/cleanupKeepLatest.js
// Usage:
//   node src/scripts/keepLatest.js --type=checkups --dry
//   node src/scripts/keepLatest.js --type=visits
//   node src/scripts/keepLatest.js --type=both --dry
//   node src/scripts/keepLatest.js --type=both --patient=<patientId> --dry
//   node src/scripts/keepLatest.js --type=both --dry --verbose
// # Delete older docs for BOTH collections (visits + checkups)
// node src/scripts/keepLatest.js --type=both


const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Checkup = require("../models/Checkup");
const Visit   = require("../models/Visit");

const DRY = process.argv.includes("--dry");
const TYPE = (process.argv.find(a => a.startsWith("--type=")) || "--type=both").split("=")[1];
const ONLY_PATIENT = (process.argv.find(a => a.startsWith("--patient=")) || "").split("=")[1] || null;
// add near the top with other flags
const VERBOSE = process.argv.includes("--verbose");


function byDateDesc(a, b, field) {
  const da = new Date(a[field] || a.createdAt || 0).getTime();
  const db = new Date(b[field] || b.createdAt || 0).getTime();
  if (db !== da) return db - da;
  // tie-breaker to keep the newest _id if timestamps equal
  return b._id.toString().localeCompare(a._id.toString());
}

async function keepLatestPerPatient(Model, dateField, label) {
    const match = ONLY_PATIENT ? { patient_id: ONLY_PATIENT } : {};
    const docs = await Model.find(match).lean();
    if (!docs.length) {
      console.log(`[${label}] No docs found${ONLY_PATIENT ? " for " + ONLY_PATIENT : ""}.`);
      return;
    }
  
    const byPatient = new Map();
    for (const d of docs) {
      const k = d.patient_id.toString();
      if (!byPatient.has(k)) byPatient.set(k, []);
      byPatient.get(k).push(d);
    }
  
    let totalToDelete = 0;
    for (const [pid, arr] of byPatient) {
      // newest first
      arr.sort((a, b) => {
        const da = new Date(a[dateField] || a.createdAt || 0).getTime();
        const db = new Date(b[dateField] || b.createdAt || 0).getTime();
        if (db !== da) return db - da;
        return b._id.toString().localeCompare(a._id.toString());
      });
  
      const [keep, ...old] = arr;
      const idsToDelete = old.map(x => x._id);
      totalToDelete += idsToDelete.length;
  
      const keepWhen = keep[dateField] || keep.createdAt;
      console.log(
        `[${label}] patient ${pid}: keep ${keep._id} (${dateField}=${keepWhen}), delete ${idsToDelete.length}`
      );
  
      if (VERBOSE && old.length) {
        for (const d of old) {
          const when = d[dateField] || d.createdAt;
          if (label === "Checkups") {
            const v = d.vitals || {};
            console.log(
              `  - DELETE ${d._id} @ ${when} | BP ${v.bp_sys ?? "-"}${v.bp_sys != null || v.bp_dia != null ? "/" : ""}${v.bp_dia ?? ""} | HR ${v.heart_rate ?? "-"} | Temp ${v.temperature_c ?? "-"} | W ${v.weight ?? "-"} | H ${v.height ?? "-"}`
            );
          } else {
            console.log(
              `  - DELETE ${d._id} @ ${when} | reason="${d.visit_reason ?? ""}" | dx="${d.diagnosis ?? ""}" | tx="${d.treatment_plan ?? ""}"`
            );
          }
        }
      }
  
      if (!DRY && idsToDelete.length) {
        await Model.deleteMany({ _id: { $in: idsToDelete } });
      }
    }
    console.log(`[${label}] ${DRY ? "Would delete" : "Deleted"} ${totalToDelete} old docs.`);
  }
  

(async function run() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI missing");
    const opts = {};
    if (process.env.DB_NAME) opts.dbName = process.env.DB_NAME;
    await mongoose.connect(uri, opts);
    console.log("✅ Connected", mongoose.connection.host, mongoose.connection.db?.databaseName);

    if (TYPE === "checkups" || TYPE === "both") {
      await keepLatestPerPatient(Checkup, "date", "Checkups");
    }
    if (TYPE === "visits" || TYPE === "both") {
      await keepLatestPerPatient(Visit, "visit_date", "Visits");
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
