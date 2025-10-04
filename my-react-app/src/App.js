// src/App.js
import React, { useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import PatientDetail from "./pages/PatientDetail";
import Reports from "./pages/Reports"; 
import AIAssistant from "./pages/AIAssistant";
import PatientForm from "./components/forms/PatientForm";
import Profile from "./pages/Profile";
import Login from "./pages/Login";  

import { Home, User, FileText, Brain, UserCog, LogOut } from "lucide-react";
import ConfirmDialog from "./components/ui/confirmdialog";

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
} from "./components/ui/sidebar";

function SidebarFooterContent({ onLogoutClick }) {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/profile">
              <UserCog className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={onLogoutClick}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

function App() {
  const navigate = useNavigate();
 
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 
  const [isSavingPatient, setIsSavingPatient] = useState(false); //


  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    console.log("User confirmed logout");
    setIsAuthenticated(false); // 👈 reset auth
    navigate("/");
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handlePatientSubmit = async (formData) => {
    setIsSavingPatient(true);
    try {
      const payload = {
        ...formData,
        medical_record_number: formData.medical_record_number || `MRN${Date.now()}`,
      };
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to save patient (status ${res.status})`);
      }
      // Optionally use returned patient
      await res.json();
      navigate('/dashboard');
    } catch (e) {
      console.error('Create patient failed:', e);
      alert(e.message || 'Failed to create patient');
    } finally {
      setIsSavingPatient(false);
    }
  };

  return (
    <Routes>
      {/* Login route (default) */}
      <Route path="/" element={<Login setIsAuthenticated={setIsAuthenticated}/>} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <SidebarProvider>
              <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar */}
                <Sidebar>
                  <SidebarHeader>
                    <h2 className="text-xl font-bold text-blue-600">
                      BT4103 Grp 10
                    </h2>
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
                  <SidebarFooterContent onLogoutClick={handleLogoutClick} />
                </Sidebar>

                {/* Main content */}
                <div className="flex-1 flex flex-col">
                  <Routes>
                    {/* Redirect root to dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />

                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route
                      path="/patients"
                      element={
                        <section className="p-6 mb-6">
                          <h2 className="text-xl font-bold text-neutral-800 mb-4">
                            Add New Patient
                          </h2>
                          <PatientForm onSubmit={handlePatientSubmit} isLoading={isSavingPatient} />
                        </section>
                      }
                    />

                    <Route path="/reports" element={<Reports />} />
                    <Route path="/ai" element={<AIAssistant />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/patient" element={<PatientDetail />} />

                    {/* Catch-all redirect to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </div>
              </div>

              <ConfirmDialog
                open={showLogoutConfirm}
                title="Confirm Logout"
                description="Are you sure you want to logout?"
                onConfirm={handleLogoutConfirm}
                onCancel={handleLogoutCancel}
              />
            </SidebarProvider>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
