/**
 * Cleanup script to remove patients without createdAt field
 * and regenerate clean data with proper timestamps
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectToDB } = require('../config/db');
const Patient = require('../models/Patient');
// Import generateMockData function dynamically to avoid model conflicts

async function cleanupData() {
  try {
    console.log('🧹 Starting data cleanup...');
    
    // Check for required environment variables
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
      throw new Error('MONGODB_URI or MONGO_URI environment variable is required');
    }
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    // Connect to database
    await connectToDB(mongoUri);
    console.log('✅ Connected to database');

    // Count total patients
    const totalPatients = await Patient.countDocuments();
    console.log(`📊 Total patients in database: ${totalPatients}`);

    // Find patients without createdAt field
    const patientsWithoutCreatedAt = await Patient.find({ createdAt: { $exists: false } });
    console.log(`🔍 Found ${patientsWithoutCreatedAt.length} patients without createdAt field`);

    if (patientsWithoutCreatedAt.length > 0) {
      // Remove patients without createdAt
      const result = await Patient.deleteMany({ createdAt: { $exists: false } });
      console.log(`🗑️ Removed ${result.deletedCount} patients without createdAt field`);
    }

    // Count remaining patients
    const remainingCount = await Patient.countDocuments();
    console.log(`📊 Remaining patients: ${remainingCount}`);

    // If no patients remain, regenerate mock data
    if (remainingCount === 0) {
      console.log('🔄 No patients remaining, regenerating mock data...');
      // Dynamically import to avoid model conflicts
      const { generateMockData } = require('./generateMockData');
      await generateMockData();
    } else {
      console.log('✅ Cleanup completed. Patients with createdAt field remain.');
    }

    console.log('🎉 Data cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupData();
}

module.exports = { cleanupData };
