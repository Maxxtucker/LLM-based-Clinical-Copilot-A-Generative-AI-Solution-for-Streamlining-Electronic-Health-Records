require("dotenv").config();
const { connectToDB } = require("../core/config/db");
const Patient = require("../modules/patients/models/patient.model");
const { PatientEmbedding, embedAndStorePatient } = require("../modules/rag/services/embeddingService");
const { aggregatePatientData } = require("../modules/rag/services/patientDataAggregator");

(async function embedAllPatients() {
  try {
    await connectToDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    // Optional: Delete all existing embeddings first (only when explicitly requested)
    if (String(process.env.RESET_EMBEDDINGS).toLowerCase() === "true") {
      const deleted = await PatientEmbedding.deleteMany({});
      console.log(`🗑️ Deleted ${deleted.deletedCount} existing patient embeddings.`);
    } else {
      console.log("ℹ️ RESET_EMBEDDINGS not set; existing embeddings will be updated in place.");
    }

    // Fetch only active patients
    const patients = await Patient.find({ status: "active" });
    console.log(`📋 Found ${patients.length} active patients.`);

    for (const patient of patients) {
      try {
        console.log(`\n📍 Processing patient: ${patient._id} - ${patient.first_name} ${patient.last_name}`);

        // Aggregate patient data (visits + vitals)
        const aggregatedText = await aggregatePatientData(patient._id);
        if (!aggregatedText) {
          console.log(`⚠️ No data found for patient ${patient._id}, skipping.`);
          continue;
        }

        // Generate & store new embedding
        await embedAndStorePatient(patient._id);
        console.log(`✅ Updated embedding for ${patient.first_name} ${patient.last_name}`);
      } catch (err) {
        console.error(`⚠️ Failed to update embedding for patient ${patient._id}:`, err);
      }
    }

    console.log("\n🎯 All patient embeddings updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error embedding patients:", err);
    process.exit(1);
  }
})();
