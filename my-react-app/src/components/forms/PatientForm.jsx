import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Save, Loader2, User, Activity, Search, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientForm({ onSubmit, isLoading, initialData = {} }) {
  const [searchMRN, setSearchMRN] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [patientFound, setPatientFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
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

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format. Please enter a valid email address.";
    }
    return null;
  };

  const validateHeight = () => {
    if (!formData.vital_signs.height) return null;
    const height = parseFloat(formData.vital_signs.height);
    if (!isNaN(height) && (height < 100 || height > 250)) {
      return `Height (${height} cm) seems unusual. Please verify.`;
    }
    return null;
  };

  const validateWeight = () => {
    if (!formData.vital_signs.weight) return null;
    const weight = parseFloat(formData.vital_signs.weight);
    if (!isNaN(weight) && (weight < 20 || weight > 200)) {
      return `Weight (${weight} kg) seems unusual. Please verify.`;
    }
    return null;
  };

  const validateBloodPressure = () => {
    if (!formData.vital_signs.blood_pressure) return null;
    const bpMatch = formData.vital_signs.blood_pressure.match(/(\d+)\/(\d+)/);
    if (bpMatch) {
      const systolic = parseInt(bpMatch[1]);
      const diastolic = parseInt(bpMatch[2]);
      
      if (systolic < 90 || systolic > 180) {
        return `Blood Pressure systolic (${systolic}) is abnormal. Please verify.`;
      }
      if (diastolic < 60 || diastolic > 110) {
        return `Blood Pressure diastolic (${diastolic}) is abnormal. Please verify.`;
      }
    }
    return null;
  };

  const validateHeartRate = () => {
    if (!formData.vital_signs.heart_rate) return null;
    const hr = parseInt(formData.vital_signs.heart_rate);
    if (!isNaN(hr) && (hr < 50 || hr > 120)) {
      return `Heart Rate (${hr} bpm) is abnormal. Please verify.`;
    }
    return null;
  };

  const validateTemperature = () => {
    if (!formData.vital_signs.temperature) return null;
    const temp = parseFloat(formData.vital_signs.temperature);
    if (!isNaN(temp) && (temp < 35.0 || temp > 42.0)) {
      return `Temperature (${temp}°C) is abnormal. Please verify.`;
    }
    return null;
  };

  const emailWarning = validateEmail(formData.email);
  const heightWarning = validateHeight();
  const weightWarning = validateWeight();
  const bpWarning = validateBloodPressure();
  const hrWarning = validateHeartRate();
  const tempWarning = validateTemperature();

  const handleSearchPatient = async () => {
    if (!searchMRN.trim()) {
      alert('Please enter a Medical Record Number to search');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      console.log('🔍 Searching for MRN:', searchMRN);
      const response = await fetch(`/api/patients?q=${encodeURIComponent(searchMRN)}`);
      const data = await response.json();
      console.log('📊 API Response:', data);
      
      // Handle both array response and paginated response with 'items' field
      const patients = Array.isArray(data) ? data : (data.items || []);
      console.log('📋 Processed patients array:', patients);
      
      if (patients && patients.length > 0) {
        console.log('✅ Found patients in response');
        const patient = patients.find(p => p.medical_record_number === searchMRN);
        console.log('🔎 Matching patient found:', patient);
        if (patient) {
          setSearchResult(patient);
          setPatientFound(true);
          
          // Auto-populate form with existing patient data
          // Format date_of_birth if it's a Date object
          let formattedDateOfBirth = '';
          if (patient.date_of_birth) {
            if (patient.date_of_birth instanceof Date) {
              formattedDateOfBirth = patient.date_of_birth.toISOString().split('T')[0];
            } else if (typeof patient.date_of_birth === 'string') {
              // If it's already a string, use it directly
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
            // Populate vital signs with existing data (nurse can edit)
            vital_signs: {
              blood_pressure: patient.vital_signs?.blood_pressure || '',
              heart_rate: patient.vital_signs?.heart_rate || '',
              temperature: patient.vital_signs?.temperature || '',
              weight: patient.vital_signs?.weight || '',
              height: patient.vital_signs?.height || ''
            }
          }));
        } else {
          // Patient not found - clear the form
          console.log('⚠️ No exact MRN match found');
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
            medical_record_number: searchMRN, // Keep the searched MRN
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
        // No patients found - clear the form
        console.log('⚠️ No patients found in API response');
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
          medical_record_number: searchMRN, // Keep the searched MRN
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

  const resetForm = () => {
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

  const handleClearForm = () => {
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    try {
      // Call onSubmit and wait for it to complete
      await onSubmit(formData);
      
      // Show success message
      setSuccessMessage('Patient saved!');
      
      // Reset form after a longer delay to show the success message
      setTimeout(() => {
        resetForm();
        setSuccessMessage('');
        // Scroll to top to show the form is reset
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 5000); // Changed from 2000 to 5000 (5 seconds)
    } catch (error) {
      console.error('Error saving patient:', error);
      // Error handling is done by the parent component
    }
  };

  return (
    <>
      {/* Success Message Popup Modal */}
      <AnimatePresence>
        {successMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSuccessMessage('')}
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
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">Success!</h3>
                  <p className="text-lg text-neutral-700">{successMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage('')}
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
                  className="mt-1"
                  disabled={!hasSearched}
                  required
                />
              </div>

              <div>
                <Label htmlFor="last_name" className="text-sm font-medium text-neutral-700">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="mt-1"
                  disabled={!hasSearched}
                  required
                />
              </div>

              <div>
                <Label htmlFor="medical_record_number" className="text-sm font-medium text-neutral-700">Medical Record Number / IC *</Label>
                <Input
                  id="medical_record_number"
                  value={formData.medical_record_number}
                  onChange={(e) => handleChange('medical_record_number', e.target.value)}
                  className="mt-1"
                  disabled={!hasSearched}
                  required
                />
              </div>

              <div>
                <Label htmlFor="date_of_birth" className="text-sm font-medium text-neutral-700">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className="mt-1"
                  disabled={!hasSearched}
                  required
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-neutral-700">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)} disabled={!hasSearched}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-neutral-700">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="mt-1"
                  disabled={!hasSearched}
                />
              </div>

              <div>
                <Label htmlFor="height" className="text-sm font-medium text-neutral-700">Height (cm)</Label>
                <Input
                  id="height"
                  value={formData.vital_signs.height}
                  onChange={(e) => handleChange('vital_signs.height', e.target.value)}
                  className="mt-1"
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
                  className="mt-1"
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
                  className="mt-1"
                  disabled={!hasSearched}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="mt-1"
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
                  className="mt-1"
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
                  className="mt-1"
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
                  className="mt-1"
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
          disabled={isLoading || !hasSearched}
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
