const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const patientsRouter = require('./routes/patients');
const ragRouter = require('./routes/rag');
const aiRouter = require('./routes/ai');
const authRouter = require('./routes/auth');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  app.use(cors({ origin, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouter);
  app.use('/api/patients', patientsRouter);

  // Mount speech routes only if enabled and dependencies are available
  const enableSpeech = String(process.env.ENABLE_SPEECH || '').toLowerCase() === 'true';
  if (enableSpeech) {
    try {
      const { speechRoutes } = require('./speech-processing');
      app.use('/api/speech', speechRoutes);
    } catch (e) {
      console.warn('[Speech] Speech module not loaded:', e && e.message ? e.message : e);
    }
  } else {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Speech] Speech routes are disabled. Set ENABLE_SPEECH=true to enable.');
    }
  }

  app.use('/api/ai', aiRouter);
  app.use('/api/rag', ragRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };