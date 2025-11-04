// services/embeddingService.js
require("dotenv").config();

const mongoose = require("mongoose");
const OpenAI = require("openai");
const { connectToDB } = require("../config/db");
const { aggregatePatientData } = require("./patientDataAggregator");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Updated schema: patient_id as ObjectId, referencing the Patient collection
const patientEmbeddingSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  embedding: { type: [Number], dimensions: 1536 }, // MongoDB Atlas Vector Search
  content: String,
  last_updated: { type: Date, default: Date.now },
  model: String,
});

const PatientEmbedding = mongoose.model(
  "PatientEmbedding",
  patientEmbeddingSchema,
  "patients_embedding"
);

/**
 * Create or update embedding for a single patient
 * @param {mongoose.Types.ObjectId | string} patientId - The ObjectId of the patient
 */
async function embedAndStorePatient(patientId) {
  // Connect if not already connected
  if (mongoose.connection.readyState === 0) {
    await connectToDB(process.env.MONGO_URI || process.env.MONGODB_URI);
  }

  // Aggregate patient content
  const content = await aggregatePatientData(patientId);
  if (!content) {
    console.log(`⚠️ No content found for patient ${patientId}, skipping.`);
    return null;
  }

  // Check if embedding already exists and content is unchanged
  const existing = await PatientEmbedding.findOne({ patient_id: patientId });
  if (existing && existing.content === content) {
    console.log(`✅ No new data for patient ${patientId}, skipping re-embedding.`);
    return existing;
  }

  console.log(`🧠 Creating embedding for patient ${patientId}...`);

  // Generate embedding using OpenAI
  const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });

  const embedding = embeddingResponse.data[0].embedding;

  // Upsert embedding
  const record = await PatientEmbedding.findOneAndUpdate(
    { patient_id: patientId },
    {
      content,
      embedding,
      model: "text-embedding-3-small",
      last_updated: new Date(),
    },
    { upsert: true, new: true }
  );

  console.log(`💾 Stored embedding for patient ${patientId}`);
  return record;
}

module.exports = { embedAndStorePatient, PatientEmbedding };