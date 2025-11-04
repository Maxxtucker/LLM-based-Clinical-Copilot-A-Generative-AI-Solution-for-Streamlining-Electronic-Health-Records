const patientService = require('../services/patient.service');

exports.list = async (req, res) => {
  const { q, status, page, limit, sort } = req.query;
  const result = await patientService.searchPatients({ q, status, page, limit, sort });
  res.json(result);
};

exports.get = async (req, res) => {
  const p = await patientService.getPatientById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not Found' });
  res.json(p);
};

exports.create = async (req, res, next) => {
  try {
    const p = await patientService.createPatient(req.body);
    res.status(201).json(p);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'medical_record_number already exists' });
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const p = await patientService.updatePatient(req.params.id, req.body);
    if (!p) return res.status(404).json({ message: 'Not Found' });
    res.json(p);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'medical_record_number already exists' });
    }
    next(err);
  }
};

exports.remove = async (req, res) => {
  const result = await patientService.deletePatient(req.params.id);
  if (!result) return res.status(404).json({ message: 'Not Found' });
  res.status(204).send();
};
