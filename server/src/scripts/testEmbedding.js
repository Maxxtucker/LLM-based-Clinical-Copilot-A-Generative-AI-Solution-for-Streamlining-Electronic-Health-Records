require("dotenv").config(); 
const mongoose = require("mongoose");
const { connectToDB } = require("../config/db.js")
const { embedAndStorePatient } = require("../services/embeddingService.js")

async function run() {
  await connectToDB(process.env.MONGO_URI);

  // Example patient
  const patient = {
    _id: "test123",
    first_name: "Alice",
    last_name: "Tan",
    date_of_birth: "1985-07-15",
    gender: "female",
    medical_history: "Hypertension, asthma",
    current_medications: "Lisinopril",
    allergies: "Penicillin",
    symptoms: "Headache, dizziness"
  };

  const record = await embedAndStorePatient(patient);
  console.log("Saved embedding:", record);

  mongoose.connection.close();
}

run().catch(console.error);

