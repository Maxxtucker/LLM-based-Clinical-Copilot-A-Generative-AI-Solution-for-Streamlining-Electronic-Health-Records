/* eslint-disable no-console */
require("dotenv").config();
const mongoose = require("mongoose");

// Use your actual models
const Patient = require("../modules/patients/models/patient.model");
const Visit = require("../modules/patients/models/visit.model");
const Checkup = require("../modules/patients/models/checkup.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/clinical_copilot_clean";

const PATIENT_COUNT = 45;
const MONTHS_BACK = 4;
const MIN_VISITS_PER_PATIENT = 2;
const MAX_VISITS_PER_PATIENT = 4;

const SG_STREETS = [
  "Ang Mo Kio Ave 10", "Bedok North St 3", "Bukit Batok St 11", "Clementi Ave 3",
  "Geylang Rd", "Hougang Ave 8", "Jurong West St 52", "Pasir Ris Dr 6", "Punggol Walk",
  "Sengkang East Way", "Serangoon Ave 2", "Tampines St 45", "Toa Payoh Lor 2",
  "Woodlands Ave 6", "Yishun Ave 11"
];
const FIRST_NAMES = ["Wei Ming","Hui Ling","Jia Hao","Siti","Aisyah","Nurul","Arun","Priya","Kumar","Daniel","Sarah","Clarence","Jolene","Zhi Wei","Pei Ying","Hafiz","Syafiq","Yi Xuan","Lakshmi","Dinesh"];
const LAST_NAMES  = ["Tan","Lim","Lee","Ng","Goh","Ong","Chua","Chen","Wong","Teo","Yap","Hassan","Rahman","Ibrahim","Raj","Menon","Singh","Nair","Koh","Quek"];
const HISTORIES   = ["Hypertension","Diabetes","High cholesterol","Asthma","Allergic rhinitis"];
const CHRONIC_MEDS= ["Metformin","Amlodipine","Losartan","Atorvastatin","Inhaler"];
const ALLERGENS   = ["None known","Penicillin","NSAIDs","Seafood"];

const randInt=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const pick   =(arr)=>arr[randInt(0,arr.length-1)];
const pickMany=(arr,min=1,max=2)=>{const n=randInt(min,max);const c=[...arr];const o=[];for(let i=0;i<n&&c.length;i++){o.push(c.splice(randInt(0,c.length-1),1)[0]);}return o;};
const randomMobile = ()=> (Math.random()<0.5?"8":"9")+String(randInt(0,9999999)).padStart(7,"0");
const randomAddressStr = ()=>`Blk ${randInt(1,999)} ${pick(SG_STREETS)} #${randInt(1,99)
  .toString().padStart(2,"0")}-${randInt(1,999).toString().padStart(3,"0")}, Singapore ${randInt(100000,889999)}`;
const randomDOB=()=>{const y=randInt(20,85);const d=new Date();d.setFullYear(d.getFullYear()-y,randInt(0,11),randInt(1,28));return d;};
const randomDatePastMonths=(m)=>{const now=new Date();const start=new Date();start.setMonth(now.getMonth()-m);return new Date(randInt(start.getTime(), now.getTime()));};
const nameToEmail=(f,l)=>`${(f+"."+l).toLowerCase().replace(/\s+/g,"")}@example.sg`;
const generateNRIC=()=>{const p=Math.random()<0.5?"S":"T";const digits=Array.from({length:7},()=>randInt(0,9));const w=[2,7,6,5,4,3,2];let s=digits.reduce((a,d,i)=>a+d*w[i],0)+(p==="T"?4:0);const map="JZIHGFEDCBA";return p+digits.join("")+map[s%11];};
const vitalsWithBaseline=(h,w)=>({bp_sys:randInt(100,140),bp_dia:randInt(65,90),heart_rate:randInt(60,100),temperature_c:Math.round((36.3+Math.random()*1.2)*10)/10,weight:w+randInt(-2,2),height:h});

// --- Simple realistic visits ---
const ENCOUNTER_SETS = [
  { complaint:"Fever and cough", symptoms:"Fever for 2 days, dry cough, tiredness.", diagnosis:"Common cold", plan:"Rest, drink plenty of water, take Panadol if needed.", meds:["Paracetamol"] },
  { complaint:"Sore throat", symptoms:"Pain when swallowing, mild fever.", diagnosis:"Throat infection", plan:"Gargle with salt water, drink warm fluids, take lozenges or Panadol.", meds:["Paracetamol","Throat lozenges"] },
  { complaint:"Stomach pain and diarrhoea", symptoms:"Loose stools, cramps, no vomiting.", diagnosis:"Food poisoning", plan:"Drink fluids, eat light meals, take charcoal tablets.", meds:["Charcoal tablets","ORS solution"] },
  { complaint:"Runny nose and sneezing", symptoms:"Blocked nose, mild sore throat.", diagnosis:"Allergic rhinitis", plan:"Avoid dust, take antihistamine daily if needed.", meds:["Loratadine"] },
  { complaint:"Chest tightness", symptoms:"Tight chest, mild wheeze, no fever.", diagnosis:"Asthma flare-up", plan:"Use inhaler 2 puffs as needed, avoid triggers.", meds:["Salbutamol inhaler"] },
  { complaint:"Back pain", symptoms:"Lower back ache after lifting heavy items.", diagnosis:"Muscle strain", plan:"Rest, apply heat pack, take painkillers if needed.", meds:["Ibuprofen"] },
  { complaint:"Headache", symptoms:"Mild tension headache, no nausea.", diagnosis:"Tension headache", plan:"Rest, stay hydrated, take Panadol if needed.", meds:["Paracetamol"] },
  { complaint:"Cough with phlegm", symptoms:"Coughing yellow phlegm, no fever.", diagnosis:"Bronchitis", plan:"Hydrate well, take cough syrup, rest at home.", meds:["Cough syrup"] },
  { complaint:"Body aches and fever", symptoms:"Fever with joint pain and fatigue.", diagnosis:"Viral fever", plan:"Take Panadol, rest and stay hydrated.", meds:["Paracetamol"] },
];
const randomEncounter=()=>pick(ENCOUNTER_SETS);

(async function main(){
  try{
    await mongoose.connect(MONGO_URI,{autoIndex:true});
    console.log("✅ Connected to:", MONGO_URI);
    await Promise.all([Patient.deleteMany({}), Visit.deleteMany({}), Checkup.deleteMany({})]);
    console.log("🧹 Cleared Patient, Visit, Checkup collections");
    console.log("🌱 Seeding started…");

    const patients=[];
    const baselines=new Map();

    for (let i=0;i<PATIENT_COUNT;i++){
      const first=pick(FIRST_NAMES), last=pick(LAST_NAMES);
      const history=pickMany(HISTORIES,1,2).join(", ");
      const chronicMeds=pickMany(CHRONIC_MEDS,0,2).join(", ");
      const allergy=pick(ALLERGENS);
      const baseH=randInt(150,185), baseW=randInt(50,90);

      const patient=new Patient({
        first_name:first,
        last_name:last,
        medical_record_number:generateNRIC(),
        date_of_birth:randomDOB(),
        gender:Math.random()<0.5?"male":"female",
        phone:randomMobile(),
        email:nameToEmail(first,last),
        address:randomAddressStr(),
        status:"active",
        medical_history:history,
        current_medications:chronicMeds,
        allergies:allergy,
        chief_complaint:"Initial registration",
        symptoms:"",
        diagnosis:"",
        treatment_plan:"",
        ai_summary:true,
        ai_summary_content:"Patient registered with basic health info.",
        vital_signs:{blood_pressure:"120/80",heart_rate:72,temperature:36.7,weight:baseW,height:baseH}
      });
      patients.push(patient);
      baselines.set(String(patient._id),{baseH,baseW});
    }
    await Patient.insertMany(patients);
    console.log(`👥 Inserted ${patients.length} patients`);

    let visitTotal=0,checkupTotal=0;
    for (const p of patients){
      const {baseH,baseW}=baselines.get(String(p._id));
      const visitCount=randInt(MIN_VISITS_PER_PATIENT,MAX_VISITS_PER_PATIENT);
      let latestVitals=null,latestSlice=null,lastVisitAt=null,lastVisitId=null,lastCheckupAt=null,lastCheckupId=null;

      for (let v=0;v<visitCount;v++){
        const when=randomDatePastMonths(MONTHS_BACK);
        const slice=randomEncounter();
        const vit=vitalsWithBaseline(baseH,baseW);

        const checkup=await Checkup.create({
          patient_id:p._id,
          nurse_id:`nurse_${randInt(100,999)}`,
          date:when,
          vitals:vit,
          _source:"live"
        });
        checkupTotal++;

        const currentMeds=[...(p.current_medications? p.current_medications.split(", "):[]),...slice.meds];
        const uniqueMeds=[...new Set(currentMeds)].join(", ");

        const visit=await Visit.create({
          patient_id:p._id,
          checkup_id:checkup._id,
          visit_date:when,
          clinician:`Dr ${pick(LAST_NAMES)}`,
          chief_complaint:slice.complaint,
          medical_history:p.medical_history,
          current_medications:uniqueMeds,
          allergies:p.allergies,
          symptoms:slice.symptoms,
          diagnosis:slice.diagnosis,
          treatment_plan:slice.plan,
          notes:`Given: ${slice.meds.join(", ")}.`,
          _source:"live"
        });
        visitTotal++;

        if(!lastVisitAt||when>lastVisitAt){lastVisitAt=when;lastVisitId=visit._id;}
        if(!lastCheckupAt||when>lastCheckupAt){lastCheckupAt=when;lastCheckupId=checkup._id;latestVitals=vit;latestSlice=slice;}
      }

      await Patient.updateOne({_id:p._id},{
        $set:{
          last_visit_id:lastVisitId,
          last_visit_at:lastVisitAt,
          last_checkup_id:lastCheckupId,
          last_checkup_at:lastCheckupAt,
          vital_signs:{
            blood_pressure:`${latestVitals.bp_sys}/${latestVitals.bp_dia}`,
            heart_rate:latestVitals.heart_rate,
            temperature:latestVitals.temperature_c,
            weight:latestVitals.weight,
            height:latestVitals.height
          },
          chief_complaint:latestSlice.complaint,
          symptoms:latestSlice.symptoms,
          diagnosis:latestSlice.diagnosis,
          treatment_plan:latestSlice.plan,
          current_medications:[...(p.current_medications? p.current_medications.split(", "):[]),...latestSlice.meds].join(", "),
          ai_summary:true,
          ai_summary_content:`Last visit: ${latestSlice.diagnosis} — ${latestSlice.plan}`
        }
      });
    }

    console.log(`🗓️ Created ${visitTotal} visits and ${checkupTotal} checkups`);
    console.log("✅ Seeding complete.");
  }catch(e){
    console.error("❌ Seed error:",e);
    process.exitCode=1;
  }finally{
    await mongoose.disconnect();
  }
})();
