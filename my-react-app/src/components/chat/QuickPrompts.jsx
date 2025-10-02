import React from 'react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";

const quickPrompts = [
  "Show me a summary of all active patients",
  "Which patients need follow-up visits?",
  "List patients with high blood pressure",
  "Show patients with diabetes",
  "Who are my patients with medication allergies?",
  "Generate a report on recent diagnoses",
  "Show patients by age groups",
  "List patients with pending lab results"
];

export default function QuickPrompts({ onPromptSelect, isLoading }) {
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
      <h3 className="font-semibold text-neutral-700 mb-4 text-base">Quick Prompts</h3>
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