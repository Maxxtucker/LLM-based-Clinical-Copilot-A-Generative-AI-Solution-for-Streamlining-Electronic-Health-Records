import React, { useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";

import Dashboard from "@/modules/patients/pages/Dashboard";
import PatientDetail from "@/modules/patients/pages/PatientDetail";
import AIAssistant from "@/modules/ai/pages/AIAssistant";
import PatientForm from "@/modules/patients/components/forms/PatientForm";
import Profile from "@/modules/auth/pages/Profile";
import Login from "@/modules/auth/pages/Login";
import ReportGenerator from "@/modules/reports/pages/ReportGenerator";
import {
  createPatient as createPatientRecord,
  createCheckup as createPatientCheckup,
  findPatientByExactMrn,
} from "@/modules/patients/services/PatientService.ts";
import { Home, User, FileText, Brain, UserCog, LogOut } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirmdialog";

import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";
import "./App.css";
import MediQueryLogo from "@/shared/logo_MediQuery AI.png";

function SidebarFooterContent({ onLogoutClick }) {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/profile"><UserCog className="mr-2 h-4 w-4" />Profile</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={onLogoutClick}>
            <LogOut className="mr-2 h-4 w-4" />Logout
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

function App() {
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("isAuthenticated") === "true"
  );
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  // derive current user role for role-based navigation and route guarding
  const [role, setRole] = useState(null);
  React.useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ""}/api/users/me`, { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        const u = json.user || json;
        const roles = Array.isArray(u.roles) ? u.roles : [];
        const r = u.role || (roles.includes("doctor") ? "doctor" : roles.includes("nurse") ? "nurse" : roles[0] || "user");
        if (!cancelled) setRole(r);
      } catch {
        if (!cancelled) setRole(null);
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL || ""}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.warn("Logout request failed (continuing)", e);
    }
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    try { navigate("/", { replace: true }); } catch { window.location.href = "/"; }
  };
  const handleLogoutCancel = () => setShowLogoutConfirm(false);

  /* ========= Nurse save flow (called by PatientForm) =========
     Accept vitals from ANY of these shapes:
     - fullForm.vitals.{bp_sys,bp_dia,heart_rate,temperature_c,weight,height}
     - fullForm.vital_signs.{blood_pressure,heart_rate,temperature,weight,height}
     - Top-level: blood_pressure, heart_rate, temperature(_c), weight, height
  */
  const handlePatientSubmit = async (fullForm) => {
    const tag = `[NURSE_SAVE:${Date.now()}]`;
    console.groupCollapsed(`${tag} START`);
    console.log("incoming form:", fullForm);

    setIsSavingPatient(true);
    try {
      const mrn = (fullForm.medical_record_number || "").trim();

      // --- Accept multiple input shapes for vitals ---
      const rawVitals =
        fullForm.vitals ||
        fullForm.vital_signs || {
          blood_pressure: fullForm.blood_pressure,
          bp_sys: fullForm.bp_sys,
          bp_dia: fullForm.bp_dia,
          heart_rate: fullForm.heart_rate,
          temperature_c: fullForm.temperature_c ?? fullForm.temperature,
          weight: fullForm.weight,
          height: fullForm.height,
        };

      console.log(`${tag} rawVitals (pre-parse)`, rawVitals);

      // parse "120/80" → {bp_sys, bp_dia}
      function parseBP(s) {
        if (!s) return {};
        const m = String(s).match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/);
        if (!m) return {};
        return { bp_sys: Number(m[1]), bp_dia: Number(m[2]) };
      }

      const bpParsed =
        rawVitals?.bp_sys != null && rawVitals?.bp_dia != null
          ? { bp_sys: Number(rawVitals.bp_sys), bp_dia: Number(rawVitals.bp_dia) }
          : parseBP(rawVitals?.blood_pressure);

      const toNum = (v) => (v === "" || v == null ? undefined : Number(v));
      const cleanVitals = Object.fromEntries(
        Object.entries({
          ...bpParsed,
          heart_rate: toNum(rawVitals?.heart_rate),
          temperature_c: toNum(rawVitals?.temperature_c ?? rawVitals?.temperature),
          weight: toNum(rawVitals?.weight),
          height: toNum(rawVitals?.height),
        }).filter(([, v]) => v !== undefined && !Number.isNaN(v))
      );

      console.log(`${tag} MRN ${mrn || "(none)"} vitals`, cleanVitals);

      // 1) If MRN exists, append a checkup (when any vitals provided)
      const existing = await findPatientByExactMrn(mrn);
      if (existing) {
        console.log(`${tag} existing patient`, existing._id);
        if (Object.keys(cleanVitals).length > 0) {
          await createPatientCheckup(existing._id, { vitals: cleanVitals });
          console.log(`${tag} ✔ checkup created for`, existing._id);
        } else {
          console.log(`${tag} no vitals provided, skipping checkup`);
        }
        console.groupEnd();
        return; // stay on /patients (keep form open)
      }

      // 2) Otherwise create a new patient
      const payload = {
        first_name: fullForm.first_name,
        last_name: fullForm.last_name,
        medical_record_number: mrn || `MRN${Date.now()}`,
        date_of_birth: fullForm.date_of_birth || undefined,
        gender: fullForm.gender || undefined,
        phone: fullForm.phone || undefined,
        email: fullForm.email || undefined,
        address: fullForm.address || undefined,
      };
      const created = await createPatientRecord(payload);
      console.log(`${tag} ✔ patient created`, created?._id);

      // 3) If vitals provided, create a checkup for the new patient too
      if (Object.keys(cleanVitals).length > 0) {
        await createPatientCheckup(created._id, { vitals: cleanVitals });
        console.log(`${tag} ✔ checkup created for`, created._id);
      } else {
        console.log(`${tag} no vitals provided for new patient, skipping checkup`);
      }

      console.groupEnd();
      return; // keep nurse on the form
    } catch (e) {
      console.error(`${tag} ❌ Save flow failed:`, e);
      console.groupEnd();
      throw e; // let PatientForm show error banner/toast
    } finally {
      setIsSavingPatient(false);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <SidebarProvider>
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar>
                  <SidebarHeader>
                    <div className="flex items-center">
                      <img
                        src={MediQueryLogo}
                        alt="MediQuery AI"
                        className="h-14 w-auto"
                      />
                    </div>
                  </SidebarHeader>
                  <SidebarContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/dashboard"><Home className="mr-2 h-4 w-4" />Dashboard</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {role === "nurse" && (
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <Link to="/patients"><User className="mr-2 h-4 w-4" />Patients</Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/ai"><Brain className="mr-2 h-4 w-4" />AI Assistant</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/report-builder"><FileText className="mr-2 h-4 w-4" />Report Generator</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarContent>
                  <SidebarFooterContent onLogoutClick={handleLogoutClick} />
                </Sidebar>

                <div className="flex-1 flex flex-col">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                      path="/patients"
                      element={
                        role === "nurse" ? (
                          <section className="p-6 mb-6">
                            <h2 className="text-xl font-bold text-neutral-800 mb-4">
                              Add / Update Patient <i>(Nurse)</i>
                            </h2>
                          <PatientForm onSubmit={handlePatientSubmit} isLoading={isSavingPatient} />
                        </section>
                        ) : (
                          <Navigate to="/dashboard" replace />
                        )
                      }
                    />
                    <Route path="/ai" element={<AIAssistant />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/patient" element={<PatientDetail />} />
                    <Route path="/report-builder" element={<ReportGenerator />} />
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
