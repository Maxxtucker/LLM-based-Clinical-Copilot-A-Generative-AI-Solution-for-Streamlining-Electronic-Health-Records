import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const quickPrompts = [
  "Analyze disease distribution by age and gender",
  "Generate overall demographic trends report",
  "Identify top comorbidities among patient groups",
  "Create cardiovascular risk assessment summary",
  "Visualize trends in disease prevalence over time",
  "Show patient outcome trends across key conditions",
];

export default function ReportPrompts({ onPromptSelect, isLoading }) {
  return (
    <Card className="p-6 bg-gradient-to-r from-pink-50 to-red-50 border-0 w-full">
      <h3 className="font-semibold text-neutral-700 mb-4 text-base">
        🔍 Report Quick Prompts
      </h3>

      {/* Grid with 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickPrompts.map((prompt, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onPromptSelect(prompt)}
            disabled={isLoading}
            className="text-left justify-start h-auto p-3 hover:bg-white/70 
                       text-neutral-600 hover:text-neutral-900 text-sm 
                       leading-relaxed min-h-[60px] w-full"
          >
            <span className="whitespace-normal break-words">{prompt}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
