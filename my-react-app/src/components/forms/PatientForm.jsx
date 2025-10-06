import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Save, Loader2, User, Activity } from "lucide-react";
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
                <Label htmlFor="medical_record_number" className="text-sm font-medium text-neutral-700">Medical Record Number / IC *</Label>
                <Input
                  id="medical_record_number"
                  value={formData.medical_record_number}
                  onChange={(e) => handleChange('medical_record_number', e.target.value)}
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
                <Label htmlFor="height" className="text-sm font-medium text-neutral-700">Height (cm)</Label>
                <Input
                  id="height"
                  value={formData.vital_signs.height}
                  onChange={(e) => handleChange('vital_signs.height', e.target.value)}
                  className="mt-1"
                  placeholder="165 cm"
                />
              </div>

              <div>
                <Label htmlFor="weight" className="text-sm font-medium text-neutral-700">Weight (kg)</Label>
                <Input
                  id="weight"
                  value={formData.vital_signs.weight}
                  onChange={(e) => handleChange('vital_signs.weight', e.target.value)}
                  className="mt-1"
                  placeholder="60 kg"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-medium text-neutral-700">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
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
                />
              </div>
              <div>
                <Label htmlFor="heart_rate" className="text-sm font-medium text-neutral-700">Heart Rate (bpm)</Label>
                <Input
                  id="heart_rate"
                  value={formData.vital_signs.heart_rate}
                  onChange={(e) => handleChange('vital_signs.heart_rate', e.target.value)}
                  className="mt-1"
                  placeholder="72 bpm"
                />
              </div>
              <div>
                <Label htmlFor="temperature" className="text-sm font-medium text-neutral-700">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  value={formData.vital_signs.temperature}
                  onChange={(e) => handleChange('vital_signs.temperature', e.target.value)}
                  className="mt-1"
                  placeholder="36.8 °C"
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
