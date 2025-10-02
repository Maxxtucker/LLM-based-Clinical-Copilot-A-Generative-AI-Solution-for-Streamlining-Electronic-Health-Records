const mongoose = require('mongoose');

let isConnected = false;

async function connectToDB(uri) {
  if (isConnected) return mongoose.connection;
  mongoose.set('strictQuery', true);
  const timeout = Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS || 5000);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: timeout });
    isConnected = true;
    return mongoose.connection;
  } catch (err) {
    // Provide clearer guidance for common Atlas issues
    console.error('\n[DB] Failed to connect to MongoDB.');
    if (err && err.name === 'MongooseServerSelectionError') {
      console.error('[DB] Tip: If you are using MongoDB Atlas, ensure your IP is whitelisted and your user/DB name are correct.');
      console.error('[DB] Docs: https://www.mongodb.com/docs/atlas/security-whitelist/');
    }
    throw err;
  }
}

module.exports = { connectToDB };