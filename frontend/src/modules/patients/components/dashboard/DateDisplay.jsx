// components/dashboard/DateDisplay.jsx
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/components/utils";

export default function DateDisplay({ selectedDate, onDateChange, className = "", infoMessage }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const displayDate = selectedDate || currentTime;

  const getDateInfo = (date) => {
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
      const today = new Date();
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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

  const handleDateSelect = (date) => {
    onDateChange(date);
    setIsOpen(false);
  };

  const clearDate = () => {
    onDateChange(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className={`cursor-pointer rounded-lg border-2 ${dateInfo.borderColor} ${dateInfo.bgColor} p-4 shadow-sm`}
            title="Click to filter by date"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${dateInfo.bgColor} ${dateInfo.color}`}>
                <CalendarIcon className="h-5 w-5" />
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

            <div className="text-xs text-gray-600 mt-2 ml-12 italic">Click to filter by date</div>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="rounded-md border bg-white"
            dayClassName={(date) => isToday(date) ? "font-bold text-blue-600" : undefined}
          />
        </PopoverContent>
      </Popover>
            {infoMessage && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 text-xs text-blue-600 italic px-2 py-1 bg-blue-50 rounded"
        >
          {infoMessage}
        </motion.p>
      )}

      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 text-xs text-gray-500 bg-white/50 rounded px-2 py-1 inline-flex items-center gap-1"
        >
          Filtered view
          <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={clearDate}>
            <X className="h-3 w-3 text-red-500" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
