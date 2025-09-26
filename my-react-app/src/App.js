// src/App.js
import React, { useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports"; 
import AIAssistant from "./pages/AIAssistant";
import PatientForm from "./components/forms/PatientForm";
import Profile from "./pages/Profile";
import { Home, User, FileText, Brain, UserCog, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  SidebarTrigger,
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

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    console.log("User confirmed logout");
    // Clear auth tokens here if needed
    navigate("/");
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <h2 className="text-xl font-bold text-blue-600">BT4103 Grp 10</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {/* Your existing nav items */}
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
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
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
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>

          <ConfirmDialog
            open={showLogoutConfirm}
            title="Confirm Logout"
            description="Are you sure you want to logout?"
            onConfirm={handleLogoutConfirm}
            onCancel={handleLogoutCancel}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}


export default App;
