//TESTING -> PRELOAD FAKE PATIENTS
// seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Patient from "./models/Patient.js";

dotenv.config();

const patients = [
  {
    first_name: "Alice",
    last_name: "Tan",
    date_of_birth: new Date("1988-05-12"),
    gender: "female",
    phone: "+65 9123 4567",
    medical_record_number: "MRN001",
    status: "active",
    chief_complaint: "Frequent headaches for the past 2 weeks",
    ai_summary: true,
    vital_signs: { blood_pressure: "120/80", heart_rate: 72 },
  },
  {
    first_name: "John",
    last_name: "Lim",
    date_of_birth: new Date("1975-09-23"),
    gender: "male",
    phone: "+65 9876 5432",
    medical_record_number: "MRN002",
    status: "inactive",
    chief_complaint: "Chest pain when exercising",
    ai_summary: false,
    vital_signs: { blood_pressure: "140/90", heart_rate: 85 },
  },
  // add more patients if you like
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const count = await Patient.countDocuments();
    if (count === 0) {
      await Patient.insertMany(patients);
      console.log("🌱 Patients seeded successfully");
    } else {
      console.log("⚡ Patients already exist, skipping seeding");
    }
  } catch (err) {
    console.error("❌ Seeding error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
