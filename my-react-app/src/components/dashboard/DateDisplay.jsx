import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, addDays, subDays } from "date-fns";

export default function DateDisplay({ selectedDate, className = "" }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Determine which date to display
  const displayDate = selectedDate || currentTime;
  
  // Format the date with relative information
  const getDateInfo = (date) => {
    const today = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (isToday(date)) {
      return {
        primary: "Today",
        secondary: format(date, "EEEE, MMMM do, yyyy"),
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    } else if (isTomorrow(date)) {
      return {
        primary: "Tomorrow",
        secondary: format(date, "EEEE, MMMM do, yyyy"),
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    } else if (isYesterday(date)) {
      return {
        primary: "Yesterday",
        secondary: format(date, "EEEE, MMMM do, yyyy"),
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    } else {
      const diffDays = Math.floor((dateOnly - todayOnly) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return {
          primary: `In ${diffDays} day${diffDays > 1 ? 's' : ''}`,
          secondary: format(date, "EEEE, MMMM do, yyyy"),
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200"
        };
      } else {
        return {
          primary: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`,
          secondary: format(date, "EEEE, MMMM do, yyyy"),
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200"
        };
      }
    }
  };

  const dateInfo = getDateInfo(displayDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${className}`}
    >
      <div className={`rounded-lg border-2 ${dateInfo.borderColor} ${dateInfo.bgColor} p-4 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${dateInfo.bgColor} ${dateInfo.color}`}>
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className={`text-sm font-semibold ${dateInfo.color}`}>
              {dateInfo.primary}
            </div>
            <div className="text-sm text-gray-600">
              {dateInfo.secondary}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{format(currentTime, "h:mm a")}</span>
          </div>
        </div>
        
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 text-xs text-gray-500 bg-white/50 rounded px-2 py-1 inline-block"
          >
            Filtered view
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
