// pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { Patient } from "./entities/Patient";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Search, Plus, Users, Brain, TrendingUp, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";

import StatsCards from "./components/dashboard/StatsCards";
import PatientCard from "./components/dashboard/PatientCard";
import { listPatients } from "../services/PatientService";

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const data = await listPatients('-created_date');
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
    setIsLoading(false);
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePatients = patients.filter(p => p.status === 'active').length;
  const patientsWithSummary = patients.filter(p => p.ai_summary).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Patient Dashboard</h1>
            <p className="text-neutral-600">Manage and monitor patient care with AI-powered insights</p>
          </div>
          <Link to={createPageUrl("NewPatient")}>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              New Patient
            </Button>
          </Link>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCards 
            title="Total Patients" 
            value={patients.length}
            icon={Users}
            gradient="bg-gradient-to-r from-blue-500 to-blue-600"
            description="All registered patients"
          />
          <StatsCards 
            title="Active Patients" 
            value={activePatients}
            icon={Activity}
            gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
            description="Currently active cases"
          />
          <StatsCards 
            title="AI Summaries" 
            value={patientsWithSummary}
            icon={Brain}
            gradient="bg-gradient-to-r from-purple-500 to-purple-600"
            description="Generated summaries"
          />
          <StatsCards 
            title="Summary Rate" 
            value={patients.length > 0 ? `${Math.round((patientsWithSummary / patients.length) * 100)}%` : '0%'}
            icon={TrendingUp}
            gradient="bg-gradient-to-r from-orange-500 to-orange-600"
            description="Completion percentage"
          />
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <Input
              placeholder="Search patients or medical record number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 border-neutral-200 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </motion.div>

        {/* Patients Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-lg shadow-sm h-64"></div>
                </div>
              ))}
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient, index) => (
                <motion.div
                  key={patient.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <PatientCard patient={patient} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Users className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-600 mb-2">No Patients Found</h3>
              <p className="text-neutral-500 mb-6">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first patient.'}
              </p>
              {!searchTerm && (
                <Link to={createPageUrl("NewPatient")}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-5 h-5 mr-2" />
                    Add First Patient
                  </Button>
                </Link>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
