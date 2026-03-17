import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 1, label: "Client" },
  { id: 2, label: "Project" },
  { id: 3, label: "Materials" },
  { id: 4, label: "Labor" },
  { id: 5, label: "Subcontractors" },
  { id: 6, label: "Other Costs" },
  { id: 7, label: "Overhead & Profit" },
  { id: 8, label: "Payment" },
  { id: 9, label: "Documents" },
  { id: 10, label: "Summary" },
];

export default function WizardShell({ currentStep, children, onBack, onNext, onClose, nextLabel, nextDisabled, isLastStep }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">Job Setup Wizard</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]?.label}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none px-2">✕</button>
        </div>

        {/* Step Progress */}
        <div className="px-6 py-3 border-b shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {STEPS.map((step, i) => {
              const done = currentStep > step.id;
              const active = currentStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                      ${done ? "bg-primary text-primary-foreground" : active ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : step.id}
                    </div>
                    <span className={`text-[10px] whitespace-nowrap ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-4 mt-[-10px] rounded ${done ? "bg-primary" : "bg-border"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30 shrink-0 rounded-b-2xl">
          <Button variant="outline" onClick={onBack} disabled={currentStep === 1}>← Back</Button>
          <Button onClick={onNext} disabled={nextDisabled}>
            {isLastStep ? "✓ Create Job" : nextLabel || "Next →"}
          </Button>
        </div>
      </div>
    </div>
  );
}