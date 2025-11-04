require("dotenv").config();
const { connectToDB } = require("../core/config/db");
const { getPatientEmbeddingByPatientId } = require("../modules/rag/services/vectorSearch");

(async function testLookup() {
  try {
    await connectToDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    const cathleenId = "6908c0fd6d7b85e157fb4bdd";
    console.log(`\n🔍 Looking up patient: ${cathleenId}`);
    
    const result = await getPatientEmbeddingByPatientId(cathleenId);
    
    if (result) {
      console.log(`\n✅ SUCCESS! Found embedding`);
      console.log(`   Patient ID: ${result.patient_id}`);
      console.log(`   Score: ${result.score}`);
      console.log(`   Content preview: ${result.content.slice(0, 400)}...`);
      
      // Check if temperature is in the content
      if (result.content.includes("Temperature")) {
        console.log(`\n✅ Temperature data IS present in embedding`);
        const tempMatch = result.content.match(/Temperature[:\s]+([^\n]+)/g);
        if (tempMatch) {
          console.log(`   Found ${tempMatch.length} temperature reference(s):`);
          tempMatch.slice(0, 3).forEach(t => console.log(`   - ${t}`));
        }
      } else {
        console.log(`\n❌ Temperature data NOT found in embedding`);
      }
    } else {
      console.log(`\n❌ FAILED! No embedding found`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
