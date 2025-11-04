const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const {
  patientRouter,
  checkupRouter,
  visitRouter,
  legacyVisitsBlocker,
} = require('./modules/patients');
const { aiRouter } = require('./modules/ai');
const { ragRouter } = require('./modules/rag');
const { reportRouter, reportRenderRouter, pdfRouter } = require('./modules/reports');
const { speechRoutes } = require('./modules/speech');
const notFound = require('./core/middleware/notFound');
const errorHandler = require('./core/middleware/errorHandler');

function createApp() {
  const app = express();

  /* -------------------------- MIDDLEWARES -------------------------- */
  app.use(helmet()); // adds basic security headers

  // CORS — allow frontend access
  const corsOptions = {
    origin: process.env.WEB_ORIGIN || "http://localhost:5173", // your React/Vite frontend
    credentials: true, // if using cookies/session
  };
  app.use(cors(corsOptions));

  // Parse JSON body, limit to 1MB for safety
  app.use(express.json({ limit: "1mb" }));

  // Logging (skip during tests)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Useful if deploying behind a reverse proxy (e.g. Vercel, Render, Nginx)
  app.set('trust proxy', 1);

  /* -------------------------- HEALTH CHECK -------------------------- */
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  /* -------------------------- ROUTES -------------------------- */
  // Core patient CRUD and search
  app.use('/api/patients', patientRouter);

  // Speech-to-text and AI summaries
  app.use('/api/speech', speechRoutes);
  app.use('/api/ai', aiRouter);
  app.use('/api/rag', ragRouter);
  app.use('/api/reports', reportRouter);
  app.use('/reports', reportRenderRouter);
  app.use('/', pdfRouter);

  // Nested resources: vitals (checkups) and visits per patient
  // e.g. POST /api/patients/123/checkups or /api/patients/123/visits
  app.use('/api/patients/:patientId/checkups', checkupRouter);
  app.use('/api/patients/:patientId/visits', visitRouter);

  // Block old routes so frontend doesn’t accidentally use them
  app.use('/api/visits', legacyVisitsBlocker);

  /* -------------------------- ERROR HANDLERS -------------------------- */
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
