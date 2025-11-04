require("dotenv").config();
const { connectToDB } = require("../config/db");
const Patient = require("../models/Patient");
const { PatientEmbedding, embedAndStorePatient } = require("../services/embeddingService");
const { aggregatePatientData } = require("../services/patientDataAggregator");

(async function embedAllPatients() {
  try {
    await connectToDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    // Fetch only active patients
    const patients = await Patient.find({ status: "active" });
    console.log(`📋 Found ${patients.length} active patients.`);

    for (const patient of patients) {
      console.log(`\n📍 Processing patient: ${patient._id} - ${patient.first_name} ${patient.last_name}`);

      // Aggregate patient data (visits + vitals)
      const aggregatedText = await aggregatePatientData(patient._id);
      if (!aggregatedText) {
        console.log(`⚠️ No data found for patient ${patient._id}, skipping.`);
        continue;
      }

      // Delete previous embeddings for freshness (optional)
      await PatientEmbedding.deleteMany({ patient_id: patient._id });

      // Generate & store new embedding (pass patient _id only)
      await embedAndStorePatient(patient._id);

      console.log(`✅ Updated embedding for ${patient.first_name} ${patient.last_name}`);
    }

    console.log("\n🎯 All patient embeddings updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error embedding patients:", err);
    process.exit(1);
  }
})();
