import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface WizardNavigationProps {
  onBack?: () => void;
  onContinue?: () => void;
  canBack?: boolean;
  canContinue?: boolean;
  isSubmitting?: boolean;
  continueLabel?: string;
  backLabel?: string;
  isFinalStep?: boolean;
  validationWarning?: string | null;
  className?: string;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  onBack,
  onContinue,
  canBack = true,
  canContinue = true,
  isSubmitting = false,
  continueLabel = 'Continue',
  backLabel = 'Back',
  isFinalStep = false,
  validationWarning = null,
  className = '',
}) => {
  return (
    <div className={`space-y-3 pt-5 border-t border-slate-100 ${className}`}>
      {/* Validation Warning Alert */}
      {validationWarning && !canContinue && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{validationWarning}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {onBack && canBack ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBack}
            disabled={isSubmitting}
          >
            {backLabel}
          </Button>
        ) : (
          <div />
        )}

        {onContinue && (
          <Button
            type="button"
            variant={isFinalStep ? 'primary' : 'primary'}
            size="md"
            disabled={!canContinue || isSubmitting}
            isLoading={isSubmitting}
            onClick={onContinue}
            icon={isFinalStep ? <CheckCircle2 className="w-4 h-4" /> : undefined}
            className={
              isFinalStep
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20'
                : 'shadow-md shadow-brand-600/20'
            }
          >
            <span>{continueLabel}</span>
            {!isFinalStep && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        )}
      </div>
    </div>
  );
};
