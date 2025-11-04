/**
 * Create Vector Search Index in MongoDB Atlas
 * This script helps you create the required vector search index
 */

const { connectToDB } = require('../core/config/db');
const mongoose = require('mongoose');

async function createVectorIndex() {
  try {
    console.log('🚀 Creating vector search index...');
    
    // Check for required environment variables
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
      throw new Error('MONGODB_URI or MONGO_URI environment variable is required');
    }
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    // Connect to database
    await connectToDB(mongoUri);
    console.log('✅ Connected to database');

    // Get the database instance
    const db = mongoose.connection.db;
    
    // Create vector search index
    const indexDefinition = {
      name: "patients_embedding_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: 1536, // OpenAI text-embedding-3-small dimensions
            similarity: "cosine"
          }
        ]
      }
    };

    try {
      // Try to create the index
      await db.collection('patients_embedding').createSearchIndex(indexDefinition);
      console.log('✅ Vector search index created successfully!');
      console.log('📋 Index Details:');
      console.log('   - Name: patients_embedding_index');
      console.log('   - Collection: patients_embedding');
      console.log('   - Dimensions: 1536');
      console.log('   - Similarity: cosine');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Vector search index already exists');
      } else {
        console.log('⚠️ Note: Vector search indexes must be created through MongoDB Atlas UI');
        console.log('📝 Please create the index manually in MongoDB Atlas:');
        console.log('');
        console.log('1. Go to MongoDB Atlas Dashboard');
        console.log('2. Navigate to your cluster');
        console.log('3. Click "Search" in the left sidebar');
        console.log('4. Click "Create Index"');
        console.log('5. Use these settings:');
        console.log('   - Database: clinicaldb');
        console.log('   - Collection: patients_embedding');
        console.log('   - Index Name: patients_embedding_index');
        console.log('   - Vector Configuration:');
        console.log('     - Field: embedding');
        console.log('     - Dimensions: 1536');
        console.log('     - Similarity: cosine');
        console.log('');
        console.log('6. Click "Create Index"');
        console.log('');
        console.log('⏳ The index will take a few minutes to build');
        console.log('🔄 Once created, your vector search will work!');
      }
    }

    // Check if we have embeddings
    const embeddingCount = await db.collection('patients_embedding').countDocuments();
    console.log(`📊 Found ${embeddingCount} patient embeddings in database`);

    if (embeddingCount > 0) {
      console.log('✅ Patient embeddings are ready for vector search');
    } else {
      console.log('⚠️ No embeddings found. Run the mock data generator first.');
    }

  } catch (error) {
    console.error('❌ Error creating vector index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createVectorIndex();
}

module.exports = { createVectorIndex };
