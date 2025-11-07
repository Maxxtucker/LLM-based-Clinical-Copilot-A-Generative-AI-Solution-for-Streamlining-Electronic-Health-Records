require("dotenv").config();
// services/embeddingService.js
const OpenAI = require("openai");
const { connectToDB } = require('../config/db.js');
const mongoose = require("mongoose");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const patientEmbeddingSchema = new mongoose.Schema({
  patient_id: String,
  chunk_index: Number,
  content: String,
  embedding: { type: [Number], index: "2dsphere" }, // or vector index later
});

const PatientEmbedding = mongoose.model("PatientEmbedding", patientEmbeddingSchema, "patients_embedding");

async function embedAndStorePatient(patient) {
  await connectToDB(process.env.MONGODB_URI);

  const text = `
    First Name: ${patient.first_name}
    Last Name: ${patient.last_name}
    Date of Birth: ${patient.date_of_birth}
    Gender: ${patient.gender}
    Chief Complaint: ${patient.chief_complaint}
    Medical History: ${patient.medical_history}
    Diagnosis: ${patient.diagnosis}
    Symptoms: ${patient.symptoms}
    Current Medications: ${patient.curent_medications}
    Allergies: ${patient.allergies}
    Treatment Plan: ${patient.treatment_plan}
    AI Summary Content: ${patient.ai_summary_content}
    Vital Signs:${patient.vital_signs}
  `;

  const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = embeddingResponse.data[0].embedding;

  const record = new PatientEmbedding({
    patient_id: patient._id,
    chunk_index: 0,
    content: text,
    embedding,
  });

  await record.save();
  return record;
}

module.exports = { embedAndStorePatient, PatientEmbedding };
