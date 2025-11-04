/**
 * Cleanup Duplicate Embeddings Script
 * Removes duplicate embeddings and keeps only the first one for each patient
 */

const { connectToDB } = require('../core/config/db');
const { PatientEmbedding } = require('../modules/rag/services/embeddingService');

async function cleanupDuplicateEmbeddings() {
  try {
    console.log('🧹 Starting cleanup of duplicate embeddings...');
    
    // Connect to database
    await connectToDB(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Get all embeddings grouped by patient_id
    const embeddings = await PatientEmbedding.find({});
    console.log(`📊 Found ${embeddings.length} total embeddings`);

    // Group by patient_id
    const groupedEmbeddings = {};
    embeddings.forEach(embedding => {
      const patientId = embedding.patient_id;
      if (!groupedEmbeddings[patientId]) {
        groupedEmbeddings[patientId] = [];
      }
      groupedEmbeddings[patientId].push(embedding);
    });

    console.log(`📊 Found ${Object.keys(groupedEmbeddings).length} unique patients`);

    // Remove duplicates, keeping only the first one for each patient
    let duplicatesRemoved = 0;
    for (const [patientId, patientEmbeddings] of Object.entries(groupedEmbeddings)) {
      if (patientEmbeddings.length > 1) {
        console.log(`🔄 Patient ${patientId} has ${patientEmbeddings.length} embeddings, removing duplicates...`);
        
        // Keep the first one, delete the rest
        const toKeep = patientEmbeddings[0];
        const toDelete = patientEmbeddings.slice(1);
        
        for (const duplicate of toDelete) {
          await PatientEmbedding.findByIdAndDelete(duplicate._id);
          duplicatesRemoved++;
        }
        
        console.log(`✅ Kept 1 embedding for patient ${patientId}, removed ${toDelete.length} duplicates`);
      }
    }

    console.log(`🎉 Cleanup completed! Removed ${duplicatesRemoved} duplicate embeddings`);
    
    // Verify the cleanup
    const finalCount = await PatientEmbedding.countDocuments();
    console.log(`📊 Final embedding count: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanupDuplicateEmbeddings();
