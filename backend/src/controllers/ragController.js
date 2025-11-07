// controllers/ragController.js
const { searchSimilarPatients } = require("../services/vectorSearch");

async function searchPatientsRAG(req, res) {
  const { query } = req.body;
  const results = await searchSimilarPatients(query);
  res.json(results);
}

module.exports = { searchPatientsRAG };
