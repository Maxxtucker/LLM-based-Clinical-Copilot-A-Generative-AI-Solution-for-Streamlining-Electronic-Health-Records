// services/vectorSearch.js
const OpenAI = require("openai");
const mongoose = require("mongoose");
const { connectToDB } = require("../config/db");
const { PatientEmbedding } = require("./embeddingService");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function searchSimilarPatients(query, topK = 5) {
  if (mongoose.connection.readyState === 0) {
    await connectToDB(process.env.MONGODB_URI);
  }

  const queryEmbedding = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const vector = queryEmbedding.data[0].embedding;

  // Atlas Vector Search
  const results = await PatientEmbedding.aggregate([
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

  console.log(`📊 Found ${results.length} similar patients for query "${query}"`);
  return results;
}

module.exports = { searchSimilarPatients };
