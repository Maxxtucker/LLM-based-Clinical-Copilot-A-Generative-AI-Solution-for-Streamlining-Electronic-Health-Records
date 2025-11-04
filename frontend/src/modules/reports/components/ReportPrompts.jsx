import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const quickPrompts = [
  "Eg1",
  "Eg2",
  "Eg3",
  "Eg4",
  "Eg5",
  "Eg6",
  "Eg7",
  "Eg8"
];

export default function ReportPrompts({ onPromptSelect, isLoading }) {
  return (
    <Card className="p-4 bg-gradient-to-r from-pink-50 to-red-50 border-0">
      <h3 className="font-semibold text-neutral-700 mb-4 text-base">🔍 To be filled up</h3>
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
