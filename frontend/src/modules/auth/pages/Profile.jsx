import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Heart, 
  Edit3, 
  Save, 
  X, 
  Key,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userData, setUserData] = useState(null);
  const [editData, setEditData] = useState(null);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");

  function deriveRole(u) {
    if (!u) return "user";
    if (u.role) return u.role;
    const roles = Array.isArray(u.roles) ? u.roles : [];
    if (roles.includes("doctor")) return "doctor";
    if (roles.includes("nurse")) return "nurse";
    return roles[0] || "user";
  }

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ""}/api/users/me`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load profile");
        const u = json.user || json; // backend wraps in { user }
        const merged = {
          _id: u._id,
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          department: u.department || "",
          employeeId: u.employeeId || "",
          joinDate: u.joinDate || "",
          address: u.address || "",
          avatarUrl: u.avatarUrl || null,
          roles: Array.isArray(u.roles) ? u.roles : [],
        };
        merged.role = deriveRole({ ...u, roles: merged.roles });
        if (!cancelled) {
          setUserData(merged);
          setEditData(merged);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Unexpected error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...userData });
  };

  const handleSave = async () => {
    if (!editData) return;
    setError("");
    try {
      const payload = {
        name: editData.name || "",
        phone: editData.phone || "",
        department: editData.department || "",
        employeeId: editData.employeeId || "",
        joinDate: editData.joinDate || "",
        address: editData.address || "",
        email: editData.email || "",
        avatarUrl: editData.avatarUrl || null,
      };
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ""}/api/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save changes");
      // merge server response to ensure consistency
      const u = json.user || json;
      const merged = {
        _id: u._id,
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        department: u.department || "",
        employeeId: u.employeeId || "",
        joinDate: u.joinDate || "",
        address: u.address || "",
        avatarUrl: u.avatarUrl || null,
        roles: Array.isArray(u.roles) ? u.roles : userData?.roles || [],
      };
      merged.role = (function(){
        const roles = merged.roles || [];
        if (u.role) return u.role;
        if (roles.includes("doctor")) return "doctor";
        if (roles.includes("nurse")) return "nurse";
        return roles[0] || "user";
      })();
      setUserData(merged);
      setEditData(merged);
      setIsEditing(false);
    } catch (e) {
      setError(e.message || "Unexpected error");
    }
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleIcon = () => {
    const role = userData?.role;
    return role === "doctor" ? <Shield className="w-5 h-5" /> : <Heart className="w-5 h-5" />;
  };

  const getRoleColor = () => {
    const role = userData?.role;
    return role === "doctor" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-green-100 text-green-800 border-green-200";
  };

  if (loading) {
    return <div className="min-h-screen p-6 flex items-center justify-center">Loading…</div>;
  }
  if (error) {
    return <div className="min-h-screen p-6 flex items-center justify-center text-red-600">{error}</div>;
  }
  const initials = (userData?.name || "").split(' ').filter(Boolean).map(n => n[0]).join('') || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Profile Settings</h1>
          <p className="text-neutral-600">Manage your account information</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="h-fit">
              <CardHeader className="text-center pb-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                    {initials}
                  </div>
                </div>
                <CardTitle className="text-xl">{userData.name}</CardTitle>
                <Badge className={`${getRoleColor()} border font-medium`}>
                  {getRoleIcon()}
                  <span className="ml-1 capitalize">{userData.role}</span>
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-neutral-600">{userData.department}</p>
                  <p className="text-xs text-neutral-500">Employee ID: {userData.employeeId}</p>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Member since</span>
                    <span className="font-medium">{userData.joinDate ? new Date(userData.joinDate).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Personal Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                {!isEditing && (
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="h-10"
                      />
                    ) : (
                      <div className="h-10 flex items-center px-3 bg-neutral-50 rounded-md border">
                        {userData.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="h-10"
                      />
                    ) : (
                      <div className="h-10 flex items-center px-3 bg-neutral-50 rounded-md border">
                        <Mail className="w-4 h-4 mr-2 text-neutral-400" />
                        {userData.email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="h-10"
                      />
                    ) : (
                      <div className="h-10 flex items-center px-3 bg-neutral-50 rounded-md border">
                        <Phone className="w-4 h-4 mr-2 text-neutral-400" />
                        {userData.phone}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        value={editData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="h-10"
                      />
                    ) : (
                      <div className="h-10 flex items-center px-3 bg-neutral-50 rounded-md border">
                        {userData.department}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={editData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="h-10"
                    />
                  ) : (
                    <div className="h-10 flex items-center px-3 bg-neutral-50 rounded-md border">
                      <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
                      {userData.address}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value="••••••••••••"
                      readOnly
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!showChangePassword && (
                  <Button variant="outline" size="sm" onClick={() => { setShowChangePassword(true); setCpError(""); setCpSuccess(""); }}>
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                )}

                {showChangePassword && (
                  <div className="mt-2 space-y-3">
                    {cpError && <div className="text-sm text-red-600">{cpError}</div>}
                    {cpSuccess && <div className="text-sm text-green-600">{cpSuccess}</div>}

                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm new password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <Button
                        onClick={async () => {
                          setCpError("");
                          setCpSuccess("");
                          if (!currentPassword || !newPassword || !confirmPassword) {
                            setCpError("Please fill in all password fields.");
                            return;
                          }
                          if (newPassword.length < 8) {
                            setCpError("New password must be at least 8 characters.");
                            return;
                          }
                          if (newPassword !== confirmPassword) {
                            setCpError("New passwords do not match.");
                            return;
                          }
                          try {
                            setCpLoading(true);
                            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ""}/api/auth/change-password`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ currentPassword, newPassword })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data?.error || "Failed to change password");
                            setCpSuccess("Password updated successfully.");
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                          } catch (e) {
                            setCpError(e.message || "Unexpected error");
                          } finally {
                            setCpLoading(false);
                          }
                        }}
                        disabled={cpLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {cpLoading ? "Updating…" : "Save New Password"}
                      </Button>
                      <Button variant="outline" onClick={() => { setShowChangePassword(false); setCpError(""); setCpSuccess(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
