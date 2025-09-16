import React, { useState } from "react";
import { Patient } from "@/entities/Patient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import PatientForm from "../components/forms/PatientForm";

export default function NewPatient() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    try {
      // Generate unique MRN if not provided
      if (!formData.medical_record_number) {
        formData.medical_record_number = `MRN${Date.now()}`;
      }
      
      const newPatient = await Patient.create(formData);
      navigate(createPageUrl(`PatientDetail?id=${newPatient.id}`));
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Error creating patient. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="hover:bg-neutral-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Add New Patient</h1>
            <p className="text-neutral-600 mt-1">Enter patient information to create a comprehensive medical record</p>
          </div>
        </motion.div>

        <PatientForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}