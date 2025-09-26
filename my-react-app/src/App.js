// src/App.js
import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports"; 
import AIAssistant from "./pages/AIAssistant";
import PatientForm from "./components/forms/PatientForm";
import { Home, User, FileText, Brain } from "lucide-react";

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
                  <Link to="/ai">
                    <Brain className="mr-2 h-4 w-4" />
                    AI Assistant
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

          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* Dashboard now fully handled in Dashboard.jsx */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Patients form */}
            <Route
              path="/patients"
              element={
                <section className="p-6 mb-6">
                  <h2 className="text-xl font-bold text-neutral-800 mb-4">
                    Add New Patient
                  </h2>
                  <PatientForm />
                </section>
              }
            />

            {/* Other routes */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai" element={<AIAssistant />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
