const Patient = require('../models/patient.model');

const MAX_PAGE_SIZE = 200;

function buildSearchFilter(query = '') {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const regex = new RegExp(trimmed, 'i');
  return {
    $or: [
      { first_name: regex },
      { last_name: regex },
      { medical_record_number: regex },
      { email: regex },
      { phone: regex },
    ],
  };
}

function sanitizePagination(page = 1, limit = 50) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), MAX_PAGE_SIZE);
  return { safePage, safeLimit };
}

async function searchPatients({
  q = '',
  status,
  page = 1,
  limit = 50,
  sort = 'last_name first_name',
} = {}) {
  const filter = {};

  const searchFilter = buildSearchFilter(q);
  if (searchFilter) {
    Object.assign(filter, searchFilter);
  }

  if (status) {
    filter.status = status;
  }

  const { safePage, safeLimit } = sanitizePagination(page, limit);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Patient.find(filter).sort(sort).skip(skip).limit(safeLimit),
    Patient.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
}

async function getPatientById(id) {
  return Patient.findById(id);
}

async function createPatient(data) {
  return Patient.create(data);
}

async function updatePatient(id, data) {
  return Patient.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true },
  );
}

async function deletePatient(id) {
  return Patient.findByIdAndDelete(id);
}

module.exports = {
  searchPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
