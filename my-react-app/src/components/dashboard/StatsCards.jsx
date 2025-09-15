import React from 'react';
import { Card, CardContent } from "../ui/card";
import { motion } from "framer-motion";

export default function StatsCards({ title, value, icon: Icon, gradient, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
        <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 ${gradient} rounded-full opacity-10`} />
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
              <p className="text-3xl font-bold text-neutral-900 mb-1">{value}</p>
              <p className="text-xs text-neutral-400">{description}</p>
            </div>
            <div className={`p-3 rounded-xl ${gradient} bg-opacity-20 shadow-sm`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}