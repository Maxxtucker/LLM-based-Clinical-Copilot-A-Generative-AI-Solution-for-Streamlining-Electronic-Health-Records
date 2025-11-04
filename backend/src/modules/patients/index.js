const patientRouter = require('./routes/patient.routes');
const visitRouter = require('./routes/visit.routes');
const checkupRouter = require('./routes/checkup.routes');
const legacyVisitsBlocker = require('./routes/legacyVisitBlocker');

module.exports = {
  patientRouter,
  visitRouter,
  checkupRouter,
  legacyVisitsBlocker,
};
