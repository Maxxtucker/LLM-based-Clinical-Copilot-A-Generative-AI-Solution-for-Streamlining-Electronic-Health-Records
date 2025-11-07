import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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
  Camera,
  Key,
  Bell,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { getMyProfile, updateMyProfile } from "../api/users";
import { changePassword } from "../api/auth";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdError, setPwdError] = useState(null);
  const [pwdSuccess, setPwdSuccess] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // User data loaded from API
  const [userData, setUserData] = useState(null);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getMyProfile();
        const user = (res && res.user) || {};
        // Provide sensible defaults for missing fields
        const profile = {
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          // Keep roles array from DB; display role will be derived from this array
          roles: Array.isArray(user.roles) ? user.roles : [],
          department: user.department || "",
          employeeId: user.employeeId || "",
          joinDate: user.joinDate || new Date().toISOString().slice(0,10),
          address: user.address || "",
          avatar: user.avatar || null,
        };
        if (mounted) {
          setUserData(profile);
          setEditData(profile);
          setError(null);
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...(userData || {}) });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { roles, ...payload } = editData || {};
      const res = await updateMyProfile(payload);
      const updated = (res && res.user) || payload;
      setUserData(updated);
      setEditData(updated);
      setIsEditing(false);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...(userData || {}) });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const deriveRole = (rolesArr) => {
    if (Array.isArray(rolesArr) && rolesArr.length) {
      if (rolesArr.includes('doctor')) return 'doctor';
      if (rolesArr.includes('nurse')) return 'nurse';
      return rolesArr[0];
    }
    return 'user';
  };
  const role = deriveRole(userData && userData.roles);
  const getRoleIcon = () => {
    return role === "doctor" ? <Shield className="w-5 h-5" /> : <Heart className="w-5 h-5" />;
  };

  const getRoleColor = () => {
    return role === "doctor" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-green-100 text-green-800 border-green-200";
  };

  const initials = useMemo(() => {
    const name = (userData && userData.name) || '';
    if (!name.trim()) return "?";
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0,2).toUpperCase();
  }, [userData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-600">Loading profile...</div>
      </div>
    );
  }

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
          <p className="text-neutral-600">Manage your account information and preferences</p>
        </motion.div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

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
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center hover:bg-blue-50 transition-colors">
                    <Camera className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
                <CardTitle className="text-xl">{userData.name}</CardTitle>
                <Badge className={`${getRoleColor()} border font-medium`}>
                  {getRoleIcon()}
                  <span className="ml-1 capitalize">{role}</span>
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
                    <span className="font-medium">{new Date(userData.joinDate).toLocaleDateString()}</span>
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

                {pwdError && (
                  <div className="p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{pwdError}</div>
                )}
                {pwdSuccess && (
                  <div className="p-2 rounded border border-green-200 bg-green-50 text-green-700 text-sm">{pwdSuccess}</div>
                )}

                {!showChangePassword ? (
                  <Button variant="outline" size="sm" onClick={() => { setShowChangePassword(true); setPwdError(null); setPwdSuccess(null); }}>
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" value={pwdForm.currentPassword} onChange={(e) => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={pwdSubmitting}
                        onClick={async () => {
                          try {
                            setPwdError(null);
                            setPwdSuccess(null);
                            if (!pwdForm.currentPassword || !pwdForm.newPassword) {
                              setPwdError('Please fill in all password fields.');
                              return;
                            }
                            if (pwdForm.newPassword.length < 8) {
                              setPwdError('New password must be at least 8 characters.');
                              return;
                            }
                            if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                              setPwdError('New password and confirmation do not match.');
                              return;
                            }
                            setPwdSubmitting(true);
                            await changePassword({
                              currentPassword: pwdForm.currentPassword,
                              newPassword: pwdForm.newPassword,
                              confirmPassword: pwdForm.confirmPassword,
                            });
                            setPwdSuccess('Password changed successfully.');
                            setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            setShowChangePassword(false);
                          } catch (e) {
                            setPwdError(e.message || 'Failed to change password');
                          } finally {
                            setPwdSubmitting(false);
                          }
                        }}
                      >
                        Save New Password
                      </Button>
                      <Button variant="outline" onClick={() => { setShowChangePassword(false); setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwdError(null); setPwdSuccess(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-neutral-600">Receive updates about patient care</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-neutral-600">Receive urgent alerts via SMS</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
