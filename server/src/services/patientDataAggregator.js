// services/patientDataAggregator.js
const Patient = require("../models/Patient");
const Visit = require("../models/Visit");
const Checkup = require("../models/Checkup");

async function aggregatePatientData(patientId) {
  const patient = await Patient.findById(patientId).lean();
  if (!patient) return null;

  const visits = await Visit.find({ patient_id: patientId })
    .sort({ visit_date: -1 })
    .limit(5)
    .lean();

  const checkups = await Checkup.find({ patient_id: patientId })
    .sort({ date: -1 })
    .limit(5)
    .lean();

  const visitText = visits
    .map(
      (v, i) => `
### Visit ${i + 1} (${new Date(v.visit_date).toLocaleDateString()}):
- Chief Complaint: ${v.chief_complaint}
- Diagnosis: ${v.diagnosis}
- Treatment Plan: ${v.treatment_plan}
- Notes: ${v.notes || "None"}
`
    )
    .join("\n");

  const vitalsText = checkups
    .map(
      (c, i) => `
### Checkup ${i + 1} (${new Date(c.date).toLocaleDateString()}):
- Vitals: ${JSON.stringify(c.vitals || {})}
`
    )
    .join("\n");

  const combinedText = `
# Patient Summary
- Name: ${patient.first_name} ${patient.last_name}
- DOB: ${patient.date_of_birth}
- Gender: ${patient.gender}
- Chief Complaint: ${patient.chief_complaint}
- Diagnosis: ${patient.diagnosis}
- Treatment Plan: ${patient.treatment_plan}
- Medications: ${patient.current_medications}
- Allergies: ${patient.allergies}
- Medical History: ${patient.medical_history}
- Status: ${patient.status}

# Past Visits
${visitText || "No visits recorded."}

# Vital Signs
${vitalsText || "No vitals recorded."}
`;

  return combinedText;
}

module.exports = { aggregatePatientData };