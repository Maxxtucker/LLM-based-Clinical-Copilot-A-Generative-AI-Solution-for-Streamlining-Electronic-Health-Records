// src/App.js
import React, { useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import PatientDetail from "./pages/PatientDetail";
import Reports from "./pages/Reports";
import AIAssistant from "./pages/AIAssistant";
import PatientForm from "./components/forms/PatientForm";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ReportGenerator from "./pages/ReportGenerator";
import { Home, User, FileText, Brain, UserCog, LogOut } from "lucide-react";
import ConfirmDialog from "./components/ui/confirmdialog";

import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "./components/ui/sidebar";

/* =========================
   API helpers (frontend)
   ========================= */
const RAW_API = process.env.REACT_APP_API_BASE_URL || "";   // e.g. http://localhost:5001
const API = RAW_API.replace(/\/+$/, "");
const apiUrl = (p) => (p.startsWith("http") ? p : `${API}${p}`);

const robustJson = async (res) => {
  try { return await res.json(); }
  catch { try { const t = await res.text(); return t ? { _raw: t } : {}; } catch { return {}; } }
};

async function findPatientByExactMrn(mrn) {
  if (!mrn) return null;
  const url = apiUrl(`/api/patients?search=${encodeURIComponent(mrn)}`);
  console.groupCollapsed(`🔎 findPatientByExactMrn [MRN ${mrn}]`);
  console.log("GET", url);
  const res = await fetch(url, { credentials: "include" });
  const body = await robustJson(res);
  const items = Array.isArray(body?.items) ? body.items : [];
  const match =
    items.find((p) => (p.medical_record_number || "").toLowerCase() === mrn.toLowerCase()) || null;
  console.log("status:", res.status, "match:", match?._id || null);
  console.groupEnd();
  return match;
}

async function createPatient(payload) {
  console.groupCollapsed("➡️ createPatient");
  console.log("POST", apiUrl("/api/patients"));
  console.log("payload:", payload);
  const res = await fetch(apiUrl("/api/patients"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const body = await robustJson(res);
  console.log("status:", res.status, "body:", body);
  console.groupEnd();
  if (!res.ok) throw new Error(body?.error || body?._raw || `Create patient failed (${res.status})`);
  return body;
}

async function createCheckup(patientId, vitals) {
  console.groupCollapsed("➡️ createCheckup");
  console.log("POST", apiUrl(`/api/patients/${patientId}/checkups`));
  console.log("vitals:", vitals);
  const res = await fetch(apiUrl(`/api/patients/${patientId}/checkups`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ vitals }),
  });
  const body = await robustJson(res);
  console.log("status:", res.status, "body:", body);
  console.groupEnd();
  if (!res.ok) throw new Error(body?.error || body?._raw || `Create checkup failed (${res.status})`);
  return body;
}

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

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
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
    console.log("API base =", API || "(relative)");
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
          await createCheckup(existing._id, cleanVitals);
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
      const created = await createPatient(payload);
      console.log(`${tag} ✔ patient created`, created?._id);

      // 3) If vitals provided, create a checkup for the new patient too
      if (Object.keys(cleanVitals).length > 0) {
        await createCheckup(created._id, cleanVitals);
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
                    <h2 className="text-xl font-bold text-blue-600">MediQuery AI</h2>
                  </SidebarHeader>
                  <SidebarContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/dashboard"><Home className="mr-2 h-4 w-4" />Dashboard</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link to="/patients"><User className="mr-2 h-4 w-4" />Patients</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
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
                        <section className="p-6 mb-6">
                          <h2 className="text-xl font-bold text-neutral-800 mb-4">
                            Add / Update Patient <i>(Nurse)</i>
                          </h2>
                          <PatientForm onSubmit={handlePatientSubmit} isLoading={isSavingPatient} />
                        </section>
                      }
                    />
                    <Route path="/reports" element={<Reports />} />
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
