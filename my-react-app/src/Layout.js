import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from './utils';
import { cn } from "./components/utils";
import { Button } from "./components/ui/button";
import { User, LogOut, Home, Stethoscope, FileText, Bot, PlusCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./components/ui/sidebar";

// Main Layout Component
export default function Layout({ children, currentPageName }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-neutral-100">
        <AppSidebar currentPageName={currentPageName} />
        <div className="flex-1">
          <AppHeader />
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Sidebar Component
function AppSidebar({ currentPageName }) {
  const navItems = [
    { name: "Dashboard", icon: Home, page: "Dashboard" },
    { name: "New Patient", icon: PlusCircle, page: "NewPatient" },
    { name: "AI Assistant", icon: Bot, page: "AIAssistant" },
    { name: "Reports", icon: FileText, page: "Reports" },
  ];

  return (
    <Sidebar className="border-r bg-white">
      <SidebarHeader>
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
          <Stethoscope className="w-8 h-8 text-blue-600" />
          <h1 className="text-xl font-bold text-neutral-800">MediSynth AI</h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <Link to={createPageUrl(item.page)}>
                <SidebarMenuButton
                  className={`gap-2 ${currentPageName === item.page ? "bg-blue-100 text-blue-700" : ""}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2">
              <User className="w-5 h-5" />
              Profile
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="gap-2">
              <LogOut className="w-5 h-5" />
              Logout
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Header Component
function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <SidebarTrigger className="sm:hidden" />
    </header>
  );
}