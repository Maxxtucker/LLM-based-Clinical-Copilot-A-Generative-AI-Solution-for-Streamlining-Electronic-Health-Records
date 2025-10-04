import React, { useState } from "react";
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

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Mock user data - in a real app, this would come from authentication context
  const [userData, setUserData] = useState({
    name: "Dr. Sarah Johnson",
    email: "doctor@hospital.com",
    phone: "+65 9123 4567",
    role: "doctor",
    department: "Emergency Medicine",
    employeeId: "EMP001",
    joinDate: "2020-03-15",
    address: "123 Medical Center, Singapore 123456",
    avatar: null
  });

  const [editData, setEditData] = useState({ ...userData });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...userData });
  };

  const handleSave = () => {
    setUserData({ ...editData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleIcon = () => {
    return userData.role === "doctor" ? <Shield className="w-5 h-5" /> : <Heart className="w-5 h-5" />;
  };

  const getRoleColor = () => {
    return userData.role === "doctor" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-green-100 text-green-800 border-green-200";
  };

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
                <Button variant="outline" size="sm">
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
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
