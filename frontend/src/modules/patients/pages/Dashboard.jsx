import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Users, Brain, TrendingUp, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import StatsCards from "@/modules/patients/components/dashboard/StatsCards";
import PatientCard from "@/modules/patients/components/dashboard/PatientCard";
import DateDisplay from "@/modules/patients/components/dashboard/DateDisplay";
import { isSameDay } from "date-fns";
import { listPatients } from "@/modules/patients/services/PatientService.ts";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // server-reported totals (from backend pagination response)
  const [totalFromServer, setTotalFromServer] = useState(0);

  // search + view toggles
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedQ = useMemo(() => searchTerm.trim(), [searchTerm]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAllPatients, setShowAllPatients] = useState(false);

  // --- Load patients from backend (uses ?q= and returns {items,total}) ---
  const loadPatients = useCallback(async () => {
    let cancelled = false;

    try {
      setLoading(true);
      // sort matches your previous UI ordering; pull a big page so cards fill out
      // Only fetch active patients (exclude inactive and discharged)
      const { items, total } = await listPatients(
        "last_name first_name",
        debouncedQ,
        1,
        200,
        "active"
      );

      if (!cancelled) {
        // map _id -> id for PatientCard component
        setPatients(items.map((p) => ({ ...p, id: p._id })));
        setTotalFromServer(total);
      }
    } catch (e) {
      console.warn("Falling back to demo patients:", e);
      if (!cancelled) {
        const demo = [
          {
            id: "demo-1",
            first_name: "Alice",
            last_name: "Tan",
            gender: "female",
            date_of_birth: "1988-05-12",
            phone: "+65 9123 4567",
            status: "active",
            medical_record_number: "MRN001",
            chief_complaint: "Frequent headaches for the past 2 weeks",
            ai_summary: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: "demo-2",
            first_name: "John",
            last_name: "Lim",
            gender: "male",
            date_of_birth: "1975-09-23",
            phone: "+65 9876 5432",
            status: "inactive",
            medical_record_number: "MRN002",
            chief_complaint: "Chest pain when exercising",
            ai_summary: false,
            createdAt: new Date().toISOString(),
          },
        ];
        setPatients(demo);
        setTotalFromServer(demo.length);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Refresh when navigating to dashboard (e.g., after creating a patient)
  useEffect(() => {
    if (location.pathname === "/dashboard") {
      loadPatients();
    }
  }, [location.pathname, loadPatients]);

  // Handle patient updates from voice processing
  const handlePatientUpdate = async (_patientId, _updateData) => {
    try {
      // Optimistic local update (optional: keep as-is)
      // setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...updateData.medicalExtraction?.extractedData } : p));

      // Refresh from server to stay canonical
      await loadPatients();
    } catch (error) {
      console.error("Error updating patient:", error);
    }
  };

  // When a date is picked, turn off "All Patients"
  function handleDateChange(date) {
    setSelectedDate(date);
    if (showAllPatients) setShowAllPatients(false);
  }

  // Client-side filtering for date + name/MRN (UI behavior preserved)
  // Note: Backend already filters by status="active", but we keep this as a safety check
  const filteredPatients = patients.filter((patient) => {
    // Exclude inactive/discharged patients (safety check, backend should already filter)
    if (patient.status === "inactive" || patient.status === "discharged") {
      return false;
    }

    const matchesSearch =
      `${patient.first_name} ${patient.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (patient.medical_record_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (showAllPatients) return matchesSearch;

    // Check multiple dates to determine if patient should appear on selected date:
    // 1. last_checkup_at (most recent vital reading)
    // 2. last_visit_at (most recent visit)
    // 3. updatedAt (any patient record update)
    // 4. createdAt (fallback to original creation date)
    const relevantDates = [
      patient.last_checkup_at,
      patient.last_visit_at,
      patient.updatedAt,
      patient.createdAt,
    ].filter(Boolean).map(d => new Date(d));

    if (relevantDates.length === 0) return matchesSearch;

    // Find the most recent activity date
    const mostRecentDate = relevantDates.reduce((latest, current) => 
      current > latest ? current : latest
    );

    // Use isSameDay for date comparison (handles timezone differences)
    return matchesSearch && isSameDay(mostRecentDate, selectedDate);
  });

  // Show backend total when "View All Patients" is ON (matches search across entire DB).
  // Otherwise show the filtered count for the picked day (your existing behavior).
  const totalPatients = showAllPatients ? totalFromServer : filteredPatients.length;

  const aiSummaries = filteredPatients.filter((p) => p.ai_summary).length;
  const summaryRate =
    totalPatients > 0
      ? `${Math.round((aiSummaries / totalPatients) * 100)}%`
      : "0%";

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
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Patient Dashboard
            </h1>
            <p className="text-neutral-600">
              Manage and monitor patient care with AI-powered insights
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Toggle: View All Patients */}
            <label
              htmlFor="toggleAllPatients"
              className="flex items-center cursor-pointer select-none"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  id="toggleAllPatients"
                  className="sr-only"
                  checked={showAllPatients}
                  onChange={(e) => setShowAllPatients(e.target.checked)}
                />
                <div
                  className={`block w-12 h-6 rounded-full transition-colors ${
                    showAllPatients ? "bg-blue-600" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    showAllPatients ? "transform translate-x-6" : ""
                  }`}
                ></div>
              </div>
              <span className="ml-3 text-sm font-medium text-neutral-700">
                View All Patients
              </span>
            </label>

            {/* Add Patient */}
            <Link to="/patients">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                New Patient
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Date Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          {showAllPatients ? (
            <p className="text-blue-600 font-bold italic text-sm -mb-2">
              Displaying all patients (no date filter)
            </p>
          ) : (
            <DateDisplay selectedDate={selectedDate} onDateChange={handleDateChange} />
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCards
            title="Total Patients"
            value={totalPatients}
            icon={Users}
            gradient="bg-gradient-to-r from-blue-500 to-blue-600"
            description={showAllPatients ? "Across entire database" : "For selected day"}
          />
          <StatsCards
            title="AI Summaries"
            value={aiSummaries}
            icon={Brain}
            gradient="bg-gradient-to-r from-green-500 to-green-600"
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

        {/* Search input */}
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
            <Button
              onClick={loadPatients}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Patient Cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
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
                  <PatientCard patient={patient} onPatientUpdate={handlePatientUpdate} />
                </motion.div>
              ))}
            </div>
          ) : (
            !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <Users className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-xl font-semibold text-neutral-600 mb-2">No Patients Found</h3>
                <p className="text-neutral-500 mb-6">
                  {searchTerm ? "Try adjusting your search terms." : "Get started by adding your first patient."}
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
            )
          )}
        </motion.div>
      </div>
    </div>
  );
}
