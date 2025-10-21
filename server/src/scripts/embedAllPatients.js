require("dotenv").config();
const mongoose = require("mongoose");
const { connectToDB } = require("../config/db");
const { embedAndStorePatient } = require("../services/embeddingService");

// Import your Patient model
const Patient = require("../models/Patient"); // relative path from scripts folder

async function embedAllPatients() {
  try {
    await connectToDB(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const patients = await Patient.find({}); // fetch all patients
    console.log(`Found ${patients.length} patients.`);

    for (const patient of patients) {
      console.log(`Embedding patient: ${patient._id} - ${patient.first_name}, ${patient.last_name}`);
      await embedAndStorePatient(patient);
    }

    console.log("All patients have been embedded and stored!");
    process.exit(0);
  } catch (err) {
    console.error("Error embedding patients:", err);
    process.exit(1);
  }
}

embedAllPatients();
