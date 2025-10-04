// pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, Plus, Users, Brain, TrendingUp, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StatsCards from "../components/dashboard/StatsCards";
import PatientCard from "../components/dashboard/PatientCard";
import DateFilter from "../components/dashboard/DateFilter";
import DateDisplay from "../components/dashboard/DateDisplay";

export default function Dashboard() {
  // Patients loaded from API; falls back to demo if fetch fails
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/patients');
        if (!res.ok) throw new Error('Failed to fetch patients');
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map(p => ({ ...p, id: p._id }));
        if (isMounted) setPatients(mapped);
      } catch (e) {
        console.warn('Falling back to demo patients:', e);
        if (isMounted) setPatients([
          {
            id: 'demo-1',
            first_name: "Alice",
            last_name: "Tan",
            gender: "female",
            date_of_birth: "1988-05-12",
            phone: "+65 9123 4567",
            status: "active",
            medical_record_number: "MRN001",
            chief_complaint: "Frequent headaches for the past 2 weeks",
            ai_summary: true,
          },
          {
            id: 'demo-2',
            first_name: "John",
            last_name: "Lim",
            gender: "male",
            date_of_birth: "1975-09-23",
            phone: "+65 9876 5432",
            status: "inactive",
            medical_record_number: "MRN002",
            chief_complaint: "Chest pain when exercising",
            ai_summary: false,
          },
        ]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  // ✅ Filtered list by name, MRN, and date
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!selectedDate) return matchesSearch;
    
    // Filter by date - you can customize this logic based on what date field you want to filter by
    // For now, we'll filter by date_of_birth as an example
    const patientDate = new Date(patient.date_of_birth);
    const filterDate = new Date(selectedDate);
    
    return matchesSearch && 
      patientDate.getFullYear() === filterDate.getFullYear() &&
      patientDate.getMonth() === filterDate.getMonth() &&
      patientDate.getDate() === filterDate.getDate();
  });

  // ✅ Dummy stats
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'active').length;
  const aiSummaries = patients.filter(p => p.ai_summary).length;
  const summaryRate = totalPatients > 0 ? `${Math.round((aiSummaries / totalPatients) * 100)}%` : '0%';

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
          <Link to="/patients">
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              New Patient
            </Button>
          </Link>
        </motion.div>

        {/* ✅ Date Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <DateDisplay selectedDate={selectedDate} />
        </motion.div>

        {/* ✅ Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCards 
            title="Total Patients" 
            value={totalPatients}
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
            value={aiSummaries}
            icon={Brain}
            gradient="bg-gradient-to-r from-purple-500 to-purple-600"
            description="Generated summaries"
          />
          <StatsCards 
            title="Summary Rate" 
            value={summaryRate}
            icon={TrendingUp}
            gradient="bg-gradient-to-r from-orange-500 to-orange-600"
            description="Completion percentage"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <Input
                placeholder="Search patients or medical record number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 border-neutral-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <DateFilter 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              className="w-full sm:w-auto"
            />
          </div>
        </motion.div>

        {/* ✅ Patient Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {loading && (
            <div className="text-center text-neutral-500 py-8">Loading patients…</div>
          )}
          {filteredPatients.length > 0 ? (
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
                <Link to="/patients">
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
