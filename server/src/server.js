require('dotenv').config();
const { connectToDB } = require('./config/db');
const { createApp } = require('./app');
const {connection} = require("mongoose");

(async function start() {
  try {
    const useInMemory = String(process.env.USE_IN_MEMORY || '').toLowerCase() === 'true';
    let uri = process.env.MONGO_URI;

    if (useInMemory) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('[DB] Using in-memory MongoDB for development. Data will reset on restart.');
      } catch (e) {
        console.error('[DB] USE_IN_MEMORY enabled but mongodb-memory-server is not installed.');
        console.error('      Install it with: npm i -D mongodb-memory-server');
        throw e;
      }
    }

    if (!uri) throw new Error('MONGO_URI not set (or USE_IN_MEMORY=true not configured correctly)');

    await connectToDB(uri);
    const app = createApp();
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
    console.log('✅ DB connected to:', connection.name)

  } catch (err) {
    console.error('\n[Startup] API failed to start due to database connection error.');
    console.error('Reason:', err && err.message ? err.message : err);
    console.error('Tips:');
    console.error('- If using MongoDB Atlas, whitelist your current IP or allow 0.0.0.0/0 temporarily for testing.');
    console.error('- Verify MONGO_URI credentials and target database name.');
    console.error('- Alternatively set USE_IN_MEMORY=true in server/.env to run with an in-memory MongoDB for local dev.');
    process.exit(1);
  }
})();
