import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Save, Loader2, User, FileText, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientForm({ onSubmit, isLoading, initialData = {} }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
                  required
                />
              </div>
              <div>
                <Label htmlFor="gender" className="text-sm font-medium text-neutral-700">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
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
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium text-neutral-700">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="medical_record_number" className="text-sm font-medium text-neutral-700">Medical Record Number *</Label>
                <Input
                  id="medical_record_number"
                  value={formData.medical_record_number}
                  onChange={(e) => handleChange('medical_record_number', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                  <Label htmlFor="status" className="text-sm font-medium text-neutral-700">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
                </div>
            </div>
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
              <FileText className="w-5 h-5 text-teal-600" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chief_complaint" className="text-sm font-medium text-neutral-700">Chief Complaint</Label>
              <Textarea
                id="chief_complaint"
                value={formData.chief_complaint}
                onChange={(e) => handleChange('chief_complaint', e.target.value)}
                className="mt-1 min-h-[80px]"
                placeholder="Primary reason for visit or concern..."
              />
            </div>
            <div>
              <Label htmlFor="medical_history" className="text-sm font-medium text-neutral-700">Medical History</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => handleChange('medical_history', e.target.value)}
                className="mt-1 min-h-[100px]"
                placeholder="Past medical history and conditions..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_medications" className="text-sm font-medium text-neutral-700">Current Medications</Label>
                <Textarea
                  id="current_medications"
                  value={formData.current_medications}
                  onChange={(e) => handleChange('current_medications', e.target.value)}
                  className="mt-1 min-h-[80px]"
                  placeholder="Current medications and dosages..."
                />
              </div>
              <div>
                <Label htmlFor="allergies" className="text-sm font-medium text-neutral-700">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  className="mt-1 min-h-[80px]"
                  placeholder="Known allergies and reactions..."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="symptoms" className="text-sm font-medium text-neutral-700">Current Symptoms</Label>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => handleChange('symptoms', e.target.value)}
                className="mt-1 min-h-[80px]"
                placeholder="Current symptoms and observations..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lab_results" className="text-sm font-medium text-neutral-700">Lab Results</Label>
                <Textarea
                  id="lab_results"
                  value={formData.lab_results}
                  onChange={(e) => handleChange('lab_results', e.target.value)}
                  className="mt-1 min-h-[80px]"
                  placeholder="Laboratory test results..."
                />
              </div>
              <div>
                <Label htmlFor="diagnosis" className="text-sm font-medium text-neutral-700">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => handleChange('diagnosis', e.target.value)}
                  className="mt-1 min-h-[80px]"
                  placeholder="Primary and secondary diagnoses..."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="treatment_plan" className="text-sm font-medium text-neutral-700">Treatment Plan</Label>
              <Textarea
                id="treatment_plan"
                value={formData.treatment_plan}
                onChange={(e) => handleChange('treatment_plan', e.target.value)}
                className="mt-1 min-h-[100px]"
                placeholder="Recommended treatment plan..."
              />
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
              <Activity className="w-5 h-5 text-emerald-600" />
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="blood_pressure" className="text-sm font-medium text-neutral-700">Blood Pressure</Label>
                <Input
                  id="blood_pressure"
                  value={formData.vital_signs.blood_pressure}
                  onChange={(e) => handleChange('vital_signs.blood_pressure', e.target.value)}
                  className="mt-1"
                  placeholder="120/80"
                />
              </div>
              <div>
                <Label htmlFor="heart_rate" className="text-sm font-medium text-neutral-700">Heart Rate</Label>
                <Input
                  id="heart_rate"
                  value={formData.vital_signs.heart_rate}
                  onChange={(e) => handleChange('vital_signs.heart_rate', e.target.value)}
                  className="mt-1"
                  placeholder="72 bpm"
                />
              </div>
              <div>
                <Label htmlFor="temperature" className="text-sm font-medium text-neutral-700">Temperature</Label>
                <Input
                  id="temperature"
                  value={formData.vital_signs.temperature}
                  onChange={(e) => handleChange('vital_signs.temperature', e.target.value)}
                  className="mt-1"
                  placeholder="98.6°F"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="text-sm font-medium text-neutral-700">Weight</Label>
                <Input
                  id="weight"
                  value={formData.vital_signs.weight}
                  onChange={(e) => handleChange('vital_signs.weight', e.target.value)}
                  className="mt-1"
                  placeholder="150 lbs"
                />
              </div>
              <div>
                <Label htmlFor="height" className="text-sm font-medium text-neutral-700">Height</Label>
                <Input
                  id="height"
                  value={formData.vital_signs.height}
                  onChange={(e) => handleChange('vital_signs.height', e.target.value)}
                  className="mt-1"
                  placeholder="5'8"
                />
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
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving Patient...
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
  );
}