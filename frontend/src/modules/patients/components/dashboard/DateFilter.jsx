import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/shared/components/utils";

export default function DateFilter({ onDateChange, selectedDate, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (date) => {
    onDateChange(date);
    setIsOpen(false);
  };

  const clearFilter = () => {
    onDateChange(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-center gap-3", className)}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50",
              !selectedDate && "text-gray-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : `Today: ${format(new Date(), "MMM dd, yyyy")}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="rounded-md border bg-white"
          />
        </PopoverContent>
      </Popover>
      
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-8 w-8 p-0 bg-white border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
