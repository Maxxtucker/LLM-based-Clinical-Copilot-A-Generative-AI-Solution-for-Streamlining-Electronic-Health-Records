// controllers/ragController.js
const { searchSimilarPatients, getPatientEmbeddingByPatientId } = require("../services/vectorSearch");

async function searchPatientsRAG(req, res) {
  const { query, patientId } = req.body;
  
  // If patientId is provided, do direct lookup (non-semantic, exact match)
  if (patientId) {
    const result = await getPatientEmbeddingByPatientId(patientId);
    if (result) {
      return res.json([result]);
    }
    // If not found by ID and no valid query provided, return empty
    if (!query || query.trim() === '') {
      return res.json([]);
    }
    // If not found by ID but query exists, fall through to semantic search
  }
  
  // If no valid query provided (null, undefined, or empty string), return empty
  if (!query || query.trim() === '') {
    return res.json([]);
  }
  
  // Otherwise, do semantic vector search
  const results = await searchSimilarPatients(query);
  res.json(results);
}

module.exports = { searchPatientsRAG };
