// src/App.js
import React, { useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

import PatientCard from "./components/dashboard/PatientCard";
import StatsCard from "./components/dashboard/StatsCards";
import PatientForm from "./components/forms/PatientForm";
import { Users, Activity, ClipboardList, Home, User, FileText } from "lucide-react";

// Report components
import DischargeReport from "./components/reports/DischargeReport";
import HandoverReport from "./components/reports/HandoverReport";
import ReferralReport from "./components/reports/ReferralReport";

// Sidebar imports
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "./components/ui/sidebar";

function App() {
  const [patients, setPatients] = useState([
    {
      id: 1,
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
      id: 2,
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

  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (newPatient) => {
    setIsLoading(true);
    setTimeout(() => {
      setPatients((prev) => [
        ...prev,
        { id: prev.length + 1, ...newPatient },
      ]);
      setIsLoading(false);
      alert("Patient saved successfully!");
    }, 1000);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-xl font-bold text-blue-600">MediSynth AI</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/patients">
                    <User className="mr-2 h-4 w-4" />
                    Patients
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/reports">
                    <FileText className="mr-2 h-4 w-4" />
                    Reports
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <p className="text-sm text-gray-500">© 2025 MediSynth</p>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow p-4 flex items-center justify-between">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold text-blue-600">
              MediSynth AI
            </h1>
          </header>

          <Routes>
            {/* Redirect root to /dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* Dashboard route = StatsCards + PatientCards */}
            <Route
              path="/dashboard"
              element={
                <>
                  <section className="p-6 grid gap-6 md:grid-cols-3">
                    <StatsCard
                      title="Total Patients"
                      value={patients.length.toString()}
                      description="Active in system"
                      icon={Users}
                      gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                    />
                    <StatsCard
                      title="Active Cases"
                      value="48"
                      description="Ongoing treatments"
                      icon={Activity}
                      gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    />
                    <StatsCard
                      title="Reports Generated"
                      value="1,024"
                      description="AI-powered summaries"
                      icon={ClipboardList}
                      gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                    />
                  </section>

                  <section className="p-6">
                    <h2 className="text-xl font-bold text-neutral-800 mb-4">
                      Recent Patients
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      {patients.map((p) => (
                        <PatientCard key={p.id} patient={p} />
                      ))}
                    </div>
                  </section>
                </>
              }
            />

            {/* Patients route = PatientForm */}
            <Route
              path="/patients"
              element={
                <section className="p-6 mb-6">
                  <h2 className="text-xl font-bold text-neutral-800 mb-4">
                    Add New Patient
                  </h2>
                  <PatientForm
                    onSubmit={handleFormSubmit}
                    isLoading={isLoading}
                  />
                </section>
              }
            />

            {/* Reports hub */}
            <Route
              path="/reports"
              element={
                <section className="p-6">
                  <h2 className="text-xl font-bold text-neutral-800 mb-4">
                    Reports
                  </h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <Link to="/reports/discharge" className="text-blue-600 hover:underline">
                        Discharge Report
                      </Link>
                    </li>
                    <li>
                      <Link to="/reports/handover" className="text-blue-600 hover:underline">
                        Handover Report
                      </Link>
                    </li>
                    <li>
                      <Link to="/reports/referral" className="text-blue-600 hover:underline">
                        Referral Report
                      </Link>
                    </li>
                  </ul>
                </section>
              }
            />

            {/* Sub-report routes */}
            
            <Route
              path="/reports/discharge"
              element={<DischargeReport patients={patients} isLoading={isLoading} />}
            />

            <Route path="/reports/handover" element={<HandoverReport />} />
            <Route path="/reports/referral" element={<ReferralReport />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
