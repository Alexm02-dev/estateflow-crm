import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-6 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/90 dark:border-rose-900/60 shadow-sm text-center flex flex-col items-center justify-center space-y-3 my-4 animate-in fade-in duration-200 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>

      <div className="max-w-md">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onRetry}
          className="mt-1"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
