// src/App.js
import React from "react";
import PatientCard from "./components/dashboard/PatientCard";
import StatsCard from "./components/dashboard/StatsCards";
import { Users, Activity, ClipboardList, Home, User } from "lucide-react";

// Import your Sidebar system
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
} from "./components/ui/sidebar"; // adjust path if needed

function App() {
  // Dummy patients data
  const patients = [
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
      {
      id: 3,
      first_name: "James",
      last_name: "Tan",
      gender: "male",
      date_of_birth: "1975-09-23",
      phone: "+65 9876 5432",
      status: "inactive",
      medical_record_number: "MRN002",
      chief_complaint: "Chest pain when exercising",
      ai_summary: false,
    },
  ];

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
                <SidebarMenuButton>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User className="mr-2 h-4 w-4" />
                  Patients
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <p className="text-sm text-gray-500">© 2025 MediSynth</p>
          </SidebarFooter>
        </Sidebar>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow p-4 flex items-center justify-between">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold text-blue-600">
              MediSynth AI Dashboard
            </h1>
          </header>

          {/* Stats Section */}
          <section className="p-6 grid gap-6 md:grid-cols-3">
            <StatsCard
              title="Total Patients"
              value="256"
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

          {/* Patients Section */}
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
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
