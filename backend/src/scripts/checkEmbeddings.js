require("dotenv").config();
const { connectToDB } = require("../core/config/db");
const { PatientEmbedding } = require("../modules/rag/services/embeddingService");

(async function checkEmbeddings() {
  try {
    await connectToDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    const count = await PatientEmbedding.countDocuments();
    console.log(`\n📊 Total embeddings in database: ${count}`);

    if (count > 0) {
      const sample = await PatientEmbedding.findOne().select('patient_id content').lean();
      console.log(`\n📄 Sample embedding:`);
      console.log(`   Patient ID: ${sample.patient_id}`);
      console.log(`   Content preview (first 500 chars):`);
      console.log(`   ${sample.content.slice(0, 500)}...`);
      
      // Check for Cathleen specifically
      const cathleen = await PatientEmbedding.findOne({ patient_id: '6908c0fd6d7b85e157fb4bdd' }).select('patient_id content').lean();
      if (cathleen) {
        console.log(`\n✅ Found Cathleen's embedding`);
        console.log(`   Content preview: ${cathleen.content.slice(0, 300)}...`);
      } else {
        console.log(`\n❌ Cathleen's embedding NOT found`);
      }
    } else {
      console.log("\n❌ NO EMBEDDINGS FOUND IN DATABASE!");
      console.log("   The patients_embedding collection is empty.");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
