import React from 'react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";

const quickPrompts = [
  "Find patients with similar symptoms to chest pain",
  "What treatments worked for diabetic patients?",
  "Show me patients with hypertension and their outcomes",
  "Find elderly patients with heart conditions",
  "Which patients had successful migraine treatments?",
  "Show patients with similar medical history patterns",
  "Find patients who responded well to specific medications",
  "Analyze treatment patterns for chronic conditions"
];

export default function QuickPrompts({ onPromptSelect, isLoading }) {
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
      <h3 className="font-semibold text-neutral-700 mb-4 text-base">🔍 RAG-Enhanced Queries</h3>
      <div className="flex flex-wrap gap-3">
        {quickPrompts.map((prompt, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onPromptSelect(prompt)}
            disabled={isLoading}
            className="text-left justify-start h-auto p-3 hover:bg-white/70 text-neutral-600 hover:text-neutral-900 text-sm leading-relaxed min-h-[60px] max-w-[300px] flex-shrink-0"
          >
            <span className="whitespace-normal break-words">{prompt}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}