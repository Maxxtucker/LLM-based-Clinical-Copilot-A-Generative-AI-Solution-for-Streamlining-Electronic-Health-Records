const Patient = require('../models/Patient');

exports.list = async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? {
        $or: [
          { first_name: new RegExp(q, 'i') },
          { last_name: new RegExp(q, 'i') },
          { medical_record_number: new RegExp(q, 'i') },
        ],
      }
    : {};
  const patients = await Patient.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(patients);
};

exports.get = async (req, res) => {
  const p = await Patient.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not Found' });
  res.json(p);
};

exports.create = async (req, res, next) => {
  try {
    const p = await Patient.create(req.body);
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
    const p = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
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
  const result = await Patient.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ message: 'Not Found' });
  res.status(204).send();
};
