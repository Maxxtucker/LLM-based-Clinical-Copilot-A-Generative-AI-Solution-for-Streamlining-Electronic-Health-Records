import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Stethoscope, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Pass `setIsAuthenticated` down from App.js
export default function Login({ setIsAuthenticated, setUserRole }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mock credentials for both doctor and nurse
    const mockUsers = [
      {
        email: "doctor@hospital.com",
        password: "doctor123",
        role: "doctor"
      },
      {
        email: "nurse@hospital.com", 
        password: "nurse123",
        role: "nurse"
      }
    ];

    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      // persist auth + role
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", user.role);

      setIsAuthenticated(true);
      if (typeof setUserRole === "function") {
        setUserRole(user.role);
      }
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 pb-6 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-9 h-9 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold text-neutral-900">BT4103 Grp 10</CardTitle>
            <CardDescription className="text-neutral-600 text-base">
              Intelligent Healthcare Management System
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-700 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com or nurse@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 border-neutral-300 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 border-neutral-300 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-neutral-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Sign In
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-sm text-neutral-600 mt-6">
                Don't have an account?{' '}
                <button type="button" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact Administrator
                </button>
              </p>
            </form>

            {/* Demo Notice */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 text-center mb-2">
                <strong>Demo Mode:</strong> Use any of these accounts to login:
              </p>
              <div className="space-y-1 text-xs text-amber-800">
                <div className="flex justify-between">
                  <span><strong>Doctor:</strong></span>
                  <span><code>doctor@hospital.com</code> / <code>doctor123</code></span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Nurse:</strong></span>
                  <span><code>nurse@hospital.com</code> / <code>nurse123</code></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
