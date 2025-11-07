import React from 'react';
import { motion } from "framer-motion";
import { User, Brain } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-blue-600 text-white ml-auto' 
            : 'bg-white border border-neutral-200 shadow-sm'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message}</p>
          ) : (
            <div className="text-sm leading-relaxed text-neutral-700 prose prose-sm max-w-none">
              <ReactMarkdown>{message}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 order-2">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}