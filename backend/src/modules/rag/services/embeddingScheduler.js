// services/embeddingScheduler.js
const cron = require("node-cron");
const mongoose = require("mongoose");
const { connectToDB } = require("../../../core/config/db");
const { embedAndStorePatient } = require("./embeddingService");

const Patient = mongoose.model("Patient", new mongoose.Schema({}, { strict: false }), "patients");

async function refreshAllEmbeddings() {
  await connectToDB(process.env.MONGODB_URI);
  const patients = await Patient.find({ status: "active" }).select("_id").lean();

  console.log(`🕛 Starting nightly embedding refresh for ${patients.length} patients...`);

  for (const p of patients) {
    try {
      await embedAndStorePatient(p._id);
    } catch (err) {
      console.error(`❌ Failed to embed patient ${p._id}:`, err.message);
    }
  }

  console.log("✅ Nightly embedding refresh complete.");
}

// Schedule: every day at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("🌙 Running scheduled embedding refresh...");
  await refreshAllEmbeddings();
});

module.exports = { refreshAllEmbeddings };
