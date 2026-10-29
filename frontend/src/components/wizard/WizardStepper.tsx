import React from 'react';
import { Check } from 'lucide-react';

export interface WizardStep {
  num: number;
  label: string;
  description?: string;
}

interface WizardStepperProps {
  currentStep: number;
  totalSteps?: number;
  steps?: WizardStep[];
  onStepClick?: (stepNum: number) => void;
  className?: string;
}

export const defaultWizardSteps: WizardStep[] = [
  { num: 1, label: 'Select Buyer', description: 'Choose customer lead' },
  { num: 2, label: 'Select Property Unit', description: 'Available inventory' },
  { num: 3, label: 'Pricing & Terms', description: 'Token deposit agreement' },
  { num: 4, label: 'Review & Confirm', description: 'Lock unit & execute' },
];

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  steps = defaultWizardSteps,
  onStepClick,
  className = '',
}) => {
  return (
    <div
      role="navigation"
      aria-label="Reservation Wizard Progress"
      className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div
          className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 -z-0"
          aria-hidden="true"
        />

        {steps.map((step) => {
          const isCurrent = currentStep === step.num;
          const isCompleted = currentStep > step.num;
          const isClickable = isCompleted && onStepClick;

          return (
            <div
              key={step.num}
              onClick={() => isClickable && onStepClick(step.num)}
              className={`relative z-10 flex flex-col items-center gap-1.5 transition-all ${
                isClickable ? 'cursor-pointer group' : ''
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-200 ring-4 ring-white dark:ring-slate-900 ${
                  isCurrent
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 scale-105'
                    : isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs group-hover:bg-emerald-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.num}
              </div>

              <div className="text-center">
                <span
                  className={`block text-[11px] sm:text-xs tracking-tight transition-colors ${
                    isCurrent
                      ? 'font-bold text-slate-900 dark:text-slate-100'
                      : isCompleted
                      ? 'font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="hidden md:block text-[10px] text-slate-400 font-normal">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
