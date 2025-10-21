// services/vectorSearchService.js
const { PatientEmbedding } = require("./embeddingService");
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function searchSimilarPatients(query, topK = 5) {
  const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // MongoDB 7.0+ supports vector search with $vectorSearch or $cosineSimilarity
  const results = await PatientEmbedding.aggregate([
    {
      $vectorSearch: {
        index: "patients_embedding_index", // must be created in Atlas
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 50,
        limit: topK,
      },
    },
  ]);

  return results;
}

module.exports = { searchSimilarPatients };
