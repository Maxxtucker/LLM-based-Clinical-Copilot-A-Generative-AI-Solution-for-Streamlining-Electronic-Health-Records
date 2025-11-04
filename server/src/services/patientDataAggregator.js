// services/patientDataAggregator.js
const Patient = require("../models/Patient");
const Visit = require("../models/Visit");
const Checkup = require("../models/Checkup");

async function aggregatePatientData(patientId) {
  const patient = await Patient.findById(patientId).lean();
  if (!patient) return null;

  // Fetch ALL visits and checkups for complete history (no limit for embeddings)
  // This ensures all historical data is included in the vector database
  const visits = await Visit.find({ patient_id: patientId })
    .sort({ visit_date: -1 })
    .lean();

  const checkups = await Checkup.find({ patient_id: patientId })
    .sort({ date: -1 })
    .lean();

  const visitText = visits
    .map(
      (v, i) => {
        const visitDate = new Date(v.visit_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        return `
### Visit ${i + 1} (${visitDate}):
- Chief Complaint: ${v.chief_complaint || "None"}
- Symptoms: ${v.symptoms || "None"}
- Diagnosis: ${v.diagnosis || "None"}
- Treatment Plan: ${v.treatment_plan || "None"}
- Medical History (from visit): ${v.medical_history || "None"}
- Medications (from visit): ${v.current_medications || "None"}
- Allergies (from visit): ${v.allergies || "None"}
- Notes: ${v.notes || "None"}
`;
      }
    )
    .join("\n");

  const vitalsText = checkups
    .map(
      (c, i) => {
        const checkupDate = new Date(c.date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
        const vitals = c.vitals || {};
        const bpText = vitals.bp_sys && vitals.bp_dia 
          ? `${vitals.bp_sys}/${vitals.bp_dia} mmHg` 
          : "Not recorded";
        return `
### Vital Signs Reading ${i + 1} (${checkupDate}):
- Blood Pressure: ${bpText}
- Heart Rate: ${vitals.heart_rate ? vitals.heart_rate + ' bpm' : "Not recorded"}
- Temperature: ${vitals.temperature_c ? vitals.temperature_c + '°C' : "Not recorded"}
- Weight: ${vitals.weight ? vitals.weight + ' kg' : "Not recorded"}
- Height: ${vitals.height ? vitals.height + ' cm' : "Not recorded"}
`;
      }
    )
    .join("\n");

  // --- Snapshot vitals from Patient document (fallback when checkups are missing a field) ---
  const snapshot = patient.vital_signs || {};
  const snapshotBp = snapshot.blood_pressure ? `${snapshot.blood_pressure} mmHg` : null;
  const snapshotLines = [];
  if (snapshotBp) snapshotLines.push(`- Blood Pressure (snapshot): ${snapshotBp}`);
  if (snapshot.heart_rate != null) snapshotLines.push(`- Heart Rate (snapshot): ${snapshot.heart_rate} bpm`);
  if (snapshot.temperature != null) snapshotLines.push(`- Temperature (snapshot): ${snapshot.temperature}°C`);
  if (snapshot.weight != null) snapshotLines.push(`- Weight (snapshot): ${snapshot.weight} kg`);
  if (snapshot.height != null) snapshotLines.push(`- Height (snapshot): ${snapshot.height} cm`);
  const snapshotText = snapshotLines.length > 0
    ? `\n## Snapshot Vital Signs (from Patient record)\n${snapshotLines.join("\n")}\n`
    : "";

  // Build comprehensive medical history from all sources
  const historicalData = [];
  if (visits.length > 0) {
    historicalData.push(`**${visits.length} past visit(s) recorded** with diagnoses, treatments, and clinical notes`);
  }
  if (checkups.length > 0) {
    historicalData.push(`**${checkups.length} vital sign reading(s) recorded** with complete measurements`);
  }
  const historySummary = historicalData.length > 0 
    ? historicalData.join('. ') + '.'
    : "No historical visits or vital sign readings recorded.";

  // Extract vital signs summary for quick reference
  let vitalSignsSummary = "No vital sign readings available.";
  if (checkups.length > 0) {
    const latestCheckup = checkups[0]; // Most recent (already sorted by date desc)
    const vitals = latestCheckup.vitals || {};
    const latestVitals = [];
    if (vitals.bp_sys && vitals.bp_dia) {
      latestVitals.push(`BP: ${vitals.bp_sys}/${vitals.bp_dia} mmHg`);
    }
    if (vitals.heart_rate) latestVitals.push(`HR: ${vitals.heart_rate} bpm`);
    if (vitals.temperature_c != null) latestVitals.push(`Temp: ${vitals.temperature_c}°C`);
    if (vitals.weight) latestVitals.push(`Weight: ${vitals.weight} kg`);
    if (vitals.height) latestVitals.push(`Height: ${vitals.height} cm`);
    
    if (latestVitals.length > 0) {
      vitalSignsSummary = `Latest vital signs (${new Date(latestCheckup.date).toLocaleDateString()}): ${latestVitals.join(', ')}. ${checkups.length > 1 ? `Total of ${checkups.length} readings in history.` : ''}`;
    }
  }
  // Fallback to snapshot for quick reference if no checkup values produced any fields
  if (vitalSignsSummary === "No vital sign readings available." && snapshotLines.length > 0) {
    vitalSignsSummary = `Latest vital signs (snapshot): ${snapshotLines
      .map((l) => l.replace(/^-\s*/, ''))
      .join(', ')}.`;
  }

  const combinedText = `
# Patient Summary
- Name: ${patient.first_name} ${patient.last_name}
- Medical Record Number: ${patient.medical_record_number || "N/A"}
- DOB: ${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "Not provided"}
- Gender: ${patient.gender || "Not specified"}
- Status: ${patient.status || "active"}

# Current Medical Information
- Chief Complaint: ${patient.chief_complaint || "None"}
- Current Diagnosis: ${patient.diagnosis || "None"}
- Current Treatment Plan: ${patient.treatment_plan || "None"}
- Current Medications: ${patient.current_medications || "None"}
- Known Allergies: ${patient.allergies || "None"}
- Medical History (from patient record): ${patient.medical_history || "None"}

# ⚠️ VITAL SIGNS QUICK REFERENCE
${vitalSignsSummary}
**IMPORTANT**: When asked about vitals, temperature, blood pressure, heart rate, or vital history, refer to the "Past Vital Sign Readings" section below for complete historical data with dates and all measurements.

# Complete Medical History (Past Visits and Clinical Encounters)
${historySummary}

${visits.length > 0 ? `## Past Clinical Visits (${visits.length} visit(s)):\n${visitText}` : "## Past Clinical Visits: No visits recorded."}

${checkups.length > 0 ? `## Past Vital Sign Readings (${checkups.length} reading(s)):\n${vitalsText}` : "## Past Vital Sign Readings: No vitals recorded."}
${snapshotText}

**Note:** The above visits and vital sign readings constitute the patient's complete medical history and clinical record. When asked about "history", "past history", "medical history", or "vital history", refer to all visits and checkups listed above.
`;

  return combinedText;
}

module.exports = { aggregatePatientData };