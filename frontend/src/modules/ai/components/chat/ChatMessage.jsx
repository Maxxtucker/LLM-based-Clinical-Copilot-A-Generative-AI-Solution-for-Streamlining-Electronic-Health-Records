import React from 'react';
import { motion } from "framer-motion";
import { User, Bot, Brain } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
            <div className="text-sm leading-relaxed text-neutral-700 markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-5 space-y-1.5 my-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-5 space-y-1.5 my-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-neutral-700 leading-relaxed" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-2 last:mb-0" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-neutral-900" {...props} />
                  ),
                  h1: ({ node, ...props }) => (
                    <h1 className="text-lg font-bold text-neutral-900 mt-3 mb-2" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-base font-bold text-neutral-900 mt-3 mb-2" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-sm font-bold text-neutral-900 mt-2 mb-1" {...props} />
                  ),
                  code: ({ node, inline, ...props }) => 
                    inline ? (
                      <code className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                    ) : (
                      <code className="block bg-neutral-100 text-neutral-800 p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto" {...props} />
                    ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-2 text-neutral-600 italic" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4 w-full">
                      <table className="min-w-full border-collapse border border-neutral-300 rounded-lg bg-white shadow-sm" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-neutral-50" {...props} />
                  ),
                  tbody: ({ node, ...props }) => (
                    <tbody {...props} />
                  ),
                  tr: ({ node, ...props }) => (
                    <tr className="hover:bg-neutral-50 transition-colors" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-neutral-300 bg-neutral-100 px-4 py-3 text-left font-semibold text-neutral-900 text-sm" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-neutral-300 px-4 py-2.5 text-neutral-700 text-sm" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="my-3 border-neutral-200" {...props} />
                  ),
                }}
              >
                {message}
              </ReactMarkdown>
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