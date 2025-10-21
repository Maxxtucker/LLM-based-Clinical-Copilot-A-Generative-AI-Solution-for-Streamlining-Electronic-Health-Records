
import React, { useState, useEffect } from "react";
// import { Patient } from "../entities/Patient";
import { FileText, Download, Users } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/card";
import { motion } from "framer-motion";

import DischargeReport from "../components/reports/DischargeReport";
import ReferralReport from "../components/reports/ReferralReport";
import HandoverReport from "../components/reports/HandoverReport";

export default function Reports() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discharge");

  useEffect(() => {
    loadPatients();
  }, []);

  // const loadPatients = async () => {
  //   setIsLoading(true);
  //   try {
  //     const data = await Patient.list('-created_date');
  //     setPatients(data);
  //   } catch (error) {
  //     console.error('Error loading patients:', error);
  //   }
  //   setIsLoading(false);
  // };

  const loadPatients = async () => {
  setIsLoading(true);

  // Dummy static data (replace with actual fetch later)
  const data = [
    {
      id: 1,
      first_name: "Alice",
      last_name: "Tan",
      gender: "female",
      date_of_birth: "1988-05-12",
      phone: "+65 9123 4567",
      status: "active",
      medical_record_number: "MRN001",
      chief_complaint: "Frequent headaches for the past 2 weeks",
      ai_summary: true,
    },
    {
      id: 2,
      first_name: "John",
      last_name: "Lim",
      gender: "male",
      date_of_birth: "1975-09-23",
      phone: "+65 9876 5432",
      status: "inactive",
      medical_record_number: "MRN002",
      chief_complaint: "Chest pain when exercising",
      ai_summary: false,
    },
  ];

  setPatients(data);
  setIsLoading(false);
};

  const reportTypes = [
    {
      id: "discharge",
      title: "Discharge Summary",
      description: "Comprehensive discharge documentation for patient transitions",
      icon: FileText,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "referral", 
      title: "Referral Letter",
      description: "Professional referral documentation for specialist consultations",
      icon: Users,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      id: "handover",
      title: "Handover Notes",
      description: "Detailed handover documentation for care transitions",
      icon: Download,
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 p-6">
       <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .printable-area {
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              background-color: white !important;
            }
            .printable-content {
              box-shadow: none !important;
              border: none !important;
              background-color: white !important;
            }
            .printable-content table {
              border-collapse: collapse;
              width: 100%;
              margin: 10px 0;
            }
            .printable-content table, 
            .printable-content th, 
            .printable-content td {
              border: 1px solid #333;
              padding: 8px;
            }
            .printable-content th {
              background-color: #f5f5f5 !important;
              font-weight: bold;
            }
            .printable-content h1, 
            .printable-content h2, 
            .printable-content h3 {
              color: #333 !important;
              margin: 15px 0 10px 0;
            }
            body {
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html {
              background: white !important;
            }
          }
          .printable-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
            font-size: 11px;
          }
          .printable-content table th,
          .printable-content table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .printable-content table th {
            background-color: #f8f9fa;
            font-weight: 600;
          }
          .printable-content h1 {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1f2937;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
          }
          .printable-content h2 {
            font-size: 14px;
            margin: 20px 0 10px 0;
            color: #374151;
            background-color: #f3f4f6;
            padding: 8px 12px;
            border-left: 4px solid #3b82f6;
          }
          .printable-content h3 {
            font-size: 12px;
            margin: 15px 0 8px 0;
            color: #4b5563;
            font-weight: 600;
          }
          .printable-content .header-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 no-print"
        >
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Medical Report Generation</h1>
          <p className="text-neutral-600">Create professional medical reports with AI-powered templates</p>
        </motion.div>

        {/* Report Type Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print"
        >
          {reportTypes.map((type) => (
            <Card 
              key={type.id}
              className={`border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
                activeTab === type.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-neutral-50'
              }`}
              onClick={() => setActiveTab(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center shadow-sm`}>
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                    <p className="text-sm text-neutral-600 mt-1">{type.description}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </motion.div>

        {/* Report Generation Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
        <div className="w-full printable-area">
          {activeTab === "discharge" && (
            <DischargeReport patients={patients} isLoading={isLoading} />
          )}
          {activeTab === "referral" && (
            <ReferralReport patients={patients} isLoading={isLoading} />
          )}
          {activeTab === "handover" && (
            <HandoverReport patients={patients} isLoading={isLoading} />
          )}
        </div>

        </motion.div>
      </div>
    </div>
  );
}
