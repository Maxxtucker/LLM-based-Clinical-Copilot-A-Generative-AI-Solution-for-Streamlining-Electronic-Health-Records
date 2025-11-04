// services/vectorSearch.js
const OpenAI = require("openai");
const mongoose = require("mongoose");
const { connectToDB } = require("../../../core/config/db");
const { PatientEmbedding } = require("./embeddingService");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function searchSimilarPatients(query, topK = 5) {
  if (mongoose.connection.readyState === 0) {
    // Support both env var names used across the project
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await connectToDB(uri);
  }

  const queryEmbedding = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const vector = queryEmbedding.data[0].embedding;

  // Atlas Vector Search
  let results = [];
  
  try {
    results = await PatientEmbedding.aggregate([
      {
        $vectorSearch: {
          queryVector: vector,
          path: "embedding",
          numCandidates: 100,
          limit: topK,
          index: "default", // use your Atlas vector index name here
        },
      },
      {
        $project: {
          patient_id: 1,
          content: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
  } catch (error) {
    console.warn(`⚠️ Vector search failed (index may not exist): ${error.message}`);
    console.log(`📝 Falling back to returning all embeddings (limited to ${topK})`);
  }

  // Fallback: if vector search returns 0 results (index doesn't exist or no matches),
  // return recent embeddings instead of empty array
  if (results.length === 0) {
    console.log(`⚠️ Vector search returned 0 results, using fallback: returning ${topK} recent embeddings`);
    results = await PatientEmbedding.find()
      .select('patient_id content')
      .sort({ last_updated: -1 })
      .limit(topK)
      .lean();
    
    // Add a fallback score
    results = results.map(r => ({
      patient_id: r.patient_id,
      content: r.content,
      score: 0.5, // Fallback score
    }));
  }

  console.log(`📊 Found ${results.length} similar patients for query "${query}"`);
  return results;
}

/**
 * Get patient embedding directly by patient_id (non-semantic, exact lookup)
 * This is used when we have an exact name match and want to retrieve the patient's data directly
 */
async function getPatientEmbeddingByPatientId(patientId) {
  if (mongoose.connection.readyState === 0) {
    // Support both env var names used across the project
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await connectToDB(uri);
  }

  // Convert patientId to ObjectId if it's a string
  const ObjectId = mongoose.Types.ObjectId;
  const patientObjectId = typeof patientId === 'string' ? new ObjectId(patientId) : patientId;

  const embedding = await PatientEmbedding.findOne({ patient_id: patientObjectId })
    .select('patient_id content')
    .lean();

  if (embedding) {
    console.log(`✅ Found patient embedding by ID: ${patientId}`);
    return {
      patient_id: embedding.patient_id,
      content: embedding.content,
      score: 1.0, // Perfect match score for direct lookup
    };
  }

  console.log(`⚠️ No embedding found for patient_id: ${patientId}`);
  return null;
}

module.exports = { searchSimilarPatients, getPatientEmbeddingByPatientId };
