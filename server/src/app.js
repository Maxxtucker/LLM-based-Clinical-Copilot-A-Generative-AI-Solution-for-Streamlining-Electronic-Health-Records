const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const patientsRouter = require('./routes/patients');
const { speechRoutes } = require('./speech-processing');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/patients', patientsRouter);
  app.use('/api/speech', speechRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };