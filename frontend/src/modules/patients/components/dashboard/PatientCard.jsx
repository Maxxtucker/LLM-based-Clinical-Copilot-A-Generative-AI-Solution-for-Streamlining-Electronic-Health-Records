import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  Phone, 
  Brain,
  ArrowRight,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/shared/utils";

export default function PatientCard({ patient }) {
  const age = patient.date_of_birth 
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <h3 className="font-bold text-lg text-neutral-900">
                  {patient.first_name} {patient.last_name}
                </h3>
                <p className="text-sm text-neutral-500">MRN: {patient.medical_record_number}</p>
              </div>
            </div>
            {/* Removed Badge for status */}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">Age: {age}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600 capitalize">{patient.gender}</span>
            </div>
            {patient.phone && (
              <div className="flex items-center gap-2 col-span-2">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-600">{patient.phone}</span>
              </div>
            )}
          </div>
          
          {patient.chief_complaint && (
            <div className="bg-neutral-50 rounded-lg p-3">
              <h4 className="font-medium text-sm text-neutral-700 mb-1">Chief Complaint</h4>
              <p className="text-sm text-neutral-600 line-clamp-2">{patient.chief_complaint}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              {patient.ai_summary ? (
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <Brain className="w-3 h-3" />
                  <span>AI Summary Available</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <Activity className="w-3 h-3" />
                  <span>No Summary Yet</span>
                </div>
              )}
            </div>
            
            <Link to={`${createPageUrl('PatientDetail')}?id=${patient.id}` }>
              <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
                View Details
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
