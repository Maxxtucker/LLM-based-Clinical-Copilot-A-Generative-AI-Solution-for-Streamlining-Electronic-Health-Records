import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, User, Activity, Search, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


export default function PatientForm({ onSubmit, isLoading, initialData = {} }) {
 const [searchMRN, setSearchMRN] = useState('');
 const [isSearching, setIsSearching] = useState(false);
 const [searchResult, setSearchResult] = useState(null);
 const [patientFound, setPatientFound] = useState(false);
 const [hasSearched, setHasSearched] = useState(false);
 const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState({
   first_name: '',
   last_name: '',
   date_of_birth: '',
   gender: '',
   phone: '',
   email: '',
   address: '',
   medical_record_number: '',
   chief_complaint: '',
   medical_history: '',
   current_medications: '',
   allergies: '',
   symptoms: '',
   lab_results: '',
   diagnosis: '',
   treatment_plan: '',
   vital_signs: {
     blood_pressure: '',
     heart_rate: '',
     temperature: '',
     weight: '',
     height: ''
   },
   status: 'active',
   ...initialData
 });


 const handleChange = (field, value) => {
   if (field.includes('.')) {
     const [parent, child] = field.split('.');
     setFormData(prev => ({
       ...prev,
       [parent]: {
         ...prev[parent],
         [child]: value
       }
     }));
   } else {
     setFormData(prev => ({ ...prev, [field]: value }));
   }
 };


 // -------------------- Validation helpers (regex + simple ranges) --------------------
 const MRN_REGEX = /^[STFG]\d{7}[A-Z]$/i;               // e.g. S1234567D
 const SG_PHONE_REGEX = /^(\+65)?[3689]\d{7}$/;         // +6591234567 or 91234567
 const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 const GENDERS = new Set(['male', 'female', 'other']);


 const inPastSane = (iso) => {
   if (!iso) return false; // required field
   const d = new Date(iso);
   if (Number.isNaN(d.getTime())) return false;
   const now = new Date();
   const min = new Date(1905, 0, 1);
   return d <= now && d >= min;
 };


 const bpLooksOk = (bp) => {
   if (!bp) return true;
   const m = bp.match(/^(\d{2,3})\/(\d{2,3})$/);
   if (!m) return false;
   const sys = parseInt(m[1], 10);
   const dia = parseInt(m[2], 10);
   if (sys <= dia) return false;
   return sys >= 90 && sys <= 180 && dia >= 60 && dia <= 110;
 };


 const inRange = (v, min, max) => {
   if (!v && v !== 0) return true;
   const n = Number(v);
   return Number.isFinite(n) && n >= min && n <= max;
 };


 // Field-specific validators that return warning strings or null
 const validateMRN = (v) => {
   if (!v) return "MRN/IC is required.";
   if (!MRN_REGEX.test(String(v).toUpperCase())) return "Use NRIC-like format e.g. S1234567D.";
   return null;
 };
 const validateEmail = (email) => {
   if (!email) return null;
   return EMAIL_REGEX.test(email) ? null : "Invalid email format. Please enter a valid email address.";
 };
 const validatePhone = (phone) => {
   if (!phone) return null;
   return SG_PHONE_REGEX.test(phone) ? null : "Invalid Singapore number (e.g. +6591234567 or 91234567).";
 };
 const validateDOB = (dob) => {
   if (!dob) return "Date of birth is required.";
   return inPastSane(dob) ? null : "Date must be in the past (and not before 1905).";
 };
 const validateGender = (g) => {
   if (!g) return null; // optional in your UI
   return GENDERS.has(String(g).toLowerCase()) ? null : "Select: Male, female, or other.";
 };
 const validateHeight = () => {
   if (!formData.vital_signs.height) return null;
   return inRange(formData.vital_signs.height, 100, 250) ? null : `Height (${formData.vital_signs.height} cm) seems unusual. Please verify.`;
 };
 const validateWeight = () => {
   if (!formData.vital_signs.weight) return null;
   return inRange(formData.vital_signs.weight, 20, 200) ? null : `Weight (${formData.vital_signs.weight} kg) seems unusual. Please verify.`;
 };
 const validateBloodPressure = () => {
   if (!formData.vital_signs.blood_pressure) return null;
   return bpLooksOk(formData.vital_signs.blood_pressure) ? null : `Blood pressure (${formData.vital_signs.blood_pressure}) seems unusual. Please verify.`;
 };
 const validateHeartRate = () => {
   if (!formData.vital_signs.heart_rate) return null;
   return inRange(formData.vital_signs.heart_rate, 50, 120) ? null : `Heart Rate (${formData.vital_signs.heart_rate} bpm) is abnormal. Please verify.`;
 };
 const validateTemperature = () => {
   if (!formData.vital_signs.temperature) return null;
   return inRange(formData.vital_signs.temperature, 35.0, 42.0) ? null : `Temperature (${formData.vital_signs.temperature}°C) is abnormal. Please verify.`;
 };

 // Address warning: recommend entering a full address with an example format
 const validateAddress = (addr) => {
   if (!addr || String(addr).trim().length === 0) {
     return 'Please provide a full address. Example: "xx Road, Singapore, 123456"';
   }
   return null;
 };

 // Live warnings (computed on render)
 const mrnWarning  = validateMRN(formData.medical_record_number);
 const emailWarning = validateEmail(formData.email);
 const phoneWarning = validatePhone(formData.phone);
 const dobWarning   = validateDOB(formData.date_of_birth);
 const genderWarning = validateGender(formData.gender);
 const heightWarning = validateHeight();
 const weightWarning = validateWeight();
 const bpWarning = validateBloodPressure();
 const hrWarning = validateHeartRate();
 const tempWarning = validateTemperature();
 const addressWarning = validateAddress(formData.address);


 const hasErrors =
   !!mrnWarning ||
   !!dobWarning ||
   !!emailWarning ||
   !!phoneWarning ||
   !!genderWarning ||
   !!heightWarning ||
   !!weightWarning ||
   !!bpWarning ||
   !!hrWarning ||
   !!tempWarning;


 // Small helper to add red border if a field has a warning
 const invalidClass = (invalid) =>
   invalid ? "border-red-500 focus-visible:ring-red-500" : "";


 const handleSearchPatient = async () => {
   if (!searchMRN.trim()) {
     alert('Please enter a Medical Record Number to search');
     return;
   }


   setIsSearching(true);
   setHasSearched(true);
   try {
     const response = await fetch(`/api/patients?q=${encodeURIComponent(searchMRN)}`);
     const data = await response.json();
     const patients = Array.isArray(data) ? data : (data.items || []);
    
     if (patients && patients.length > 0) {
       const patient = patients.find(p => p.medical_record_number === searchMRN);
       if (patient) {
         setSearchResult(patient);
         setPatientFound(true);
        
         let formattedDateOfBirth = '';
         if (patient.date_of_birth) {
           if (patient.date_of_birth instanceof Date) {
             formattedDateOfBirth = patient.date_of_birth.toISOString().split('T')[0];
           } else if (typeof patient.date_of_birth === 'string') {
             formattedDateOfBirth = patient.date_of_birth.split('T')[0];
           }
         }
        
         setFormData(prev => ({
           ...prev,
           first_name: patient.first_name || '',
           last_name: patient.last_name || '',
           date_of_birth: formattedDateOfBirth,
           gender: patient.gender || '',
           phone: patient.phone || '',
           email: patient.email || '',
           address: patient.address || '',
           medical_record_number: patient.medical_record_number || '',
           vital_signs: {
             blood_pressure: patient.vital_signs?.blood_pressure || '',
             heart_rate: patient.vital_signs?.heart_rate || '',
             temperature: patient.vital_signs?.temperature || '',
             weight: patient.vital_signs?.weight || '',
             height: patient.vital_signs?.height || ''
           }
         }));
       } else {
         setPatientFound(false);
         setSearchResult(null);
         setFormData({
           first_name: '',
           last_name: '',
           date_of_birth: '',
           gender: '',
           phone: '',
           email: '',
           address: '',
           medical_record_number: searchMRN,
           chief_complaint: '',
           medical_history: '',
           current_medications: '',
           allergies: '',
           symptoms: '',
           lab_results: '',
           diagnosis: '',
           treatment_plan: '',
           vital_signs: {
             blood_pressure: '',
             heart_rate: '',
             temperature: '',
             weight: '',
             height: ''
           },
           status: 'active',
           ...initialData
         });
       }
     } else {
       setPatientFound(false);
       setSearchResult(null);
       setFormData({
         first_name: '',
         last_name: '',
         date_of_birth: '',
         gender: '',
         phone: '',
         email: '',
         address: '',
         medical_record_number: searchMRN,
         chief_complaint: '',
         medical_history: '',
         current_medications: '',
         allergies: '',
         symptoms: '',
         lab_results: '',
         diagnosis: '',
         treatment_plan: '',
         vital_signs: {
           blood_pressure: '',
           heart_rate: '',
           temperature: '',
           weight: '',
           height: ''
         },
         status: 'active',
         ...initialData
       });
     }
   } catch (error) {
     console.error('Error searching for patient:', error);
     alert('Error searching for patient. Please try again.');
   }
   setIsSearching(false);
 };


 const handleClearForm = () => {
   setFormData({
     first_name: '',
     last_name: '',
     date_of_birth: '',
     gender: '',
     phone: '',
     email: '',
     address: '',
     medical_record_number: '',
     chief_complaint: '',
     medical_history: '',
     current_medications: '',
     allergies: '',
     symptoms: '',
     lab_results: '',
     diagnosis: '',
     treatment_plan: '',
     vital_signs: {
       blood_pressure: '',
       heart_rate: '',
       temperature: '',
       weight: '',
       height: ''
     },
     status: 'active',
     ...initialData
   });
   setSearchMRN('');
   setSearchResult(null);
   setPatientFound(false);
   setHasSearched(false);
 };


 const handleSubmit = async (e) => {
   e.preventDefault();


   // Guard: required basics + no validation errors
   if (!hasSearched) {
     alert("Please search an MRN first.");
     return;
   }
   if (hasErrors) {
     alert("Please fix the highlighted fields before saving.");
     return;
   }
   if (!formData.first_name || !formData.last_name) {
     alert("First and last name are required.");
     return;
   }


   try {
     await onSubmit(formData);
     setShowSuccessDialog(true);
     setTimeout(() => {
       setShowSuccessDialog(false);
     }, 3000);
   } catch (error) {
     console.error('Error saving patient:', error);
     // Parent handles error UI
   }
 };


 return (
   <>
     {/* Success Dialog */}
     <AnimatePresence>
       {showSuccessDialog && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.3 }}
             className="absolute inset-0 bg-black/50 backdrop-blur-sm"
             onClick={() => setShowSuccessDialog(false)}
           />
           {/* Popup Content */}
           <motion.div
             initial={{ opacity: 0, scale: 0.9, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: 20 }}
             transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
             className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 z-10"
           >
             <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="w-12 h-12 text-green-600" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-neutral-900 mb-2">Patient Saved!</h3>
                 <p className="text-lg text-neutral-700">
                   Patient information has been successfully saved.
                 </p>
               </div>
               <button
                 type="button"
                 onClick={() => setShowSuccessDialog(false)}
                 className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
               >
                 OK
               </button>
             </div>
           </motion.div>
         </div>
       )}
     </AnimatePresence>


     <form onSubmit={handleSubmit} className="space-y-6">
     {/* Patient Search Section */}
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.4 }}
     >
       <Card className="border-0 shadow-sm bg-blue-50">
         <CardHeader className="pb-4">
           <CardTitle className="flex items-center gap-2 text-xl">
             <Search className="w-5 h-5 text-blue-600" />
             Search Existing Patient
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex gap-3">
             <div className="flex-1">
               <Label htmlFor="search_mrn" className="text-sm font-medium text-neutral-700">Medical Record Number</Label>
               <Input
                 id="search_mrn"
                 value={searchMRN}
                 onChange={(e) => setSearchMRN(e.target.value)}
                 placeholder="Enter MRN to search for existing patient"
                 className="mt-1"
               />
             </div>
             <div className="flex items-end gap-2">
               <Button
                 type="button"
                 onClick={handleSearchPatient}
                 disabled={isSearching || !searchMRN.trim()}
                 className="bg-blue-600 hover:bg-blue-700"
               >
                 {isSearching ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   <Search className="w-4 h-4" />
                 )}
               </Button>
               <Button
                 type="button"
                 onClick={handleClearForm}
                 variant="outline"
               >
                 <RefreshCw className="w-4 h-4" />
               </Button>
             </div>
           </div>
          
           {/* Search Result Status */}
           {searchResult && patientFound && (
             <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
               <p className="text-sm text-green-800">
                 <strong>Patient Found:</strong> {searchResult.first_name} {searchResult.last_name}
                 (MRN: {searchResult.medical_record_number})
               </p>
               <p className="text-xs text-green-600 mt-1">
                 Personal information has been auto-populated. Please fill in the vital signs below.
               </p>
             </div>
           )}
          
           {hasSearched && !patientFound && !isSearching && (
             <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
               <p className="text-sm text-yellow-800">
                 <strong>New Patient:</strong> No existing patient found with MRN "{searchMRN}".
                 Please fill in all patient information below.
               </p>
             </div>
           )}
          
           {!hasSearched && (
             <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
               <p className="text-sm text-blue-800">
                 <strong>Search Required:</strong> Please search for a patient's MRN first before filling in the form below.
               </p>
             </div>
           )}
         </CardContent>
       </Card>
     </motion.div>


     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.4, delay: 0.1 }}
     >
       <Card className="border-0 shadow-sm">
         <CardHeader className="pb-4">
           <CardTitle className="flex items-center gap-2 text-xl">
             <User className="w-5 h-5 text-blue-600" />
             Basic Information
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <Label htmlFor="first_name" className="text-sm font-medium text-neutral-700">First Name *</Label>
               <Input
                 id="first_name"
                 value={formData.first_name}
                 onChange={(e) => handleChange('first_name', e.target.value)}
                 className={`mt-1 ${(!formData.first_name && hasSearched) ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 disabled={!hasSearched}
                 required
               />
               {hasSearched && !formData.first_name && (
                 <p className="text-xs text-red-600 mt-1">First name is required.</p>
               )}
             </div>


             <div>
               <Label htmlFor="last_name" className="text-sm font-medium text-neutral-700">Last Name *</Label>
               <Input
                 id="last_name"
                 value={formData.last_name}
                 onChange={(e) => handleChange('last_name', e.target.value)}
                 className={`mt-1 ${(!formData.last_name && hasSearched) ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 disabled={!hasSearched}
                 required
               />
               {hasSearched && !formData.last_name && (
                 <p className="text-xs text-red-600 mt-1">Last name is required.</p>
               )}
             </div>


             <div>
               <Label htmlFor="medical_record_number" className="text-sm font-medium text-neutral-700">Medical Record Number / IC *</Label>
               <Input
                 id="medical_record_number"
                 value={formData.medical_record_number}
                 onChange={(e) => handleChange('medical_record_number', e.target.value)}
                 className={`mt-1 ${hasSearched && mrnWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 disabled={!hasSearched}
                 required
               />
               {hasSearched && mrnWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {mrnWarning}</p>
               )}
             </div>


             <div>
               <Label htmlFor="date_of_birth" className="text-sm font-medium text-neutral-700">Date of Birth *</Label>
               <Input
                 id="date_of_birth"
                 type="date"
                 value={formData.date_of_birth}
                 onChange={(e) => handleChange('date_of_birth', e.target.value)}
                 className={`mt-1 ${hasSearched && dobWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 disabled={!hasSearched}
                 required
               />
               {hasSearched && dobWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {dobWarning}</p>
               )}
             </div>


             <div>
               <Label htmlFor="gender" className="text-sm font-medium text-neutral-700">Gender</Label>
               <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)} disabled={!hasSearched}>
                 <SelectTrigger className={`mt-1 ${hasSearched && genderWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
                   <SelectValue placeholder="Select gender" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="male">Male</SelectItem>
                   <SelectItem value="female">Female</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
               </Select>
               {hasSearched && genderWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {genderWarning}</p>
               )}
             </div>


             <div>
               <Label htmlFor="phone" className="text-sm font-medium text-neutral-700">Phone</Label>
               <Input
                 id="phone"
                 value={formData.phone}
                 onChange={(e) => handleChange('phone', e.target.value)}
                 className={`mt-1 ${hasSearched && phoneWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 disabled={!hasSearched}
               />
               {hasSearched && phoneWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {phoneWarning}</p>
               )}
             </div>


             <div>
               <Label htmlFor="height" className="text-sm font-medium text-neutral-700">Height (cm)</Label>
               <Input
                 id="height"
                 value={formData.vital_signs.height}
                 onChange={(e) => handleChange('vital_signs.height', e.target.value)}
                 className={`mt-1 ${hasSearched && heightWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 placeholder="165 cm"
                 disabled={!hasSearched}
               />
               {hasSearched && heightWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {heightWarning}</p>
               )}
             </div>


             <div>
               <Label htmlFor="weight" className="text-sm font-medium text-neutral-700">Weight (kg)</Label>
               <Input
                 id="weight"
                 value={formData.vital_signs.weight}
                 onChange={(e) => handleChange('vital_signs.weight', e.target.value)}
                 className={`mt-1 ${hasSearched && weightWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 placeholder="60 kg"
                 disabled={!hasSearched}
               />
               {hasSearched && weightWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {weightWarning}</p>
               )}
             </div>


             <div>
               <Label htmlFor="address" className="text-sm font-medium text-neutral-700">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={`mt-1 ${hasSearched && addressWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                placeholder="xx Road, Singapore, 123456"
                disabled={!hasSearched}
              />
              {hasSearched && addressWarning && (
                <p className="text-xs text-red-600 mt-1">⚠️ {addressWarning}</p>
              )}
             </div>


             <div>
               <Label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</Label>
               <Input
                 id="email"
                 type="email"
                 value={formData.email}
                 onChange={(e) => handleChange('email', e.target.value)}
                 className={`mt-1 ${hasSearched && emailWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 disabled={!hasSearched}
               />
               {hasSearched && emailWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {emailWarning}</p>
               )}
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>


     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.4, delay: 0.2 }}
     >
       <Card className="border-0 shadow-sm">
         <CardHeader className="pb-4">
           <CardTitle className="flex items-center gap-2 text-xl">
             <Activity className="w-5 h-5 text-orange-600" />
             Vital Signs
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <div>
               <Label htmlFor="blood_pressure" className="text-sm font-medium text-neutral-700">Blood Pressure</Label>
               <Input
                 id="blood_pressure"
                 value={formData.vital_signs.blood_pressure}
                 onChange={(e) => handleChange('vital_signs.blood_pressure', e.target.value)}
                 className={`mt-1 ${hasSearched && bpWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 placeholder="120/80"
                 disabled={!hasSearched}
               />
               {hasSearched && bpWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {bpWarning}</p>
               )}
             </div>
             <div>
               <Label htmlFor="heart_rate" className="text-sm font-medium text-neutral-700">Heart Rate (bpm)</Label>
               <Input
                 id="heart_rate"
                 value={formData.vital_signs.heart_rate}
                 onChange={(e) => handleChange('vital_signs.heart_rate', e.target.value)}
                 className={`mt-1 ${hasSearched && hrWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 placeholder="72 bpm"
                 disabled={!hasSearched}
               />
               {hasSearched && hrWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {hrWarning}</p>
               )}
             </div>
             <div>
               <Label htmlFor="temperature" className="text-sm font-medium text-neutral-700">Temperature (°C)</Label>
               <Input
                 id="temperature"
                 value={formData.vital_signs.temperature}
                 onChange={(e) => handleChange('vital_signs.temperature', e.target.value)}
                 className={`mt-1 ${hasSearched && tempWarning ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                 placeholder="36.8 °C"
                 disabled={!hasSearched}
               />
               {hasSearched && tempWarning && (
                 <p className="text-xs text-red-600 mt-1">⚠️ {tempWarning}</p>
               )}
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>


     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.4, delay: 0.3 }}
       className="flex justify-end"
     >
       <Button
         type="submit"
         className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
         disabled={isLoading || !hasSearched || hasErrors}
         title={hasErrors ? "Fix the highlighted fields" : undefined}
       >
         {isLoading ? (
           <>
             <Loader2 className="w-5 h-5 mr-2 animate-spin" />
             Saving Patient...
           </>
         ) : !hasSearched ? (
           <>
             <Save className="w-5 h-5 mr-2" />
             Search Patient First
           </>
         ) : hasErrors ? (
           <>
             <Save className="w-5 h-5 mr-2" />
             Fix Errors to Save
           </>
         ) : (
           <>
             <Save className="w-5 h-5 mr-2" />
             Save Patient
           </>
         )}
       </Button>
     </motion.div>
   </form>
   </>
 );
}


