import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div
      role="status"
      aria-busy="true"
      className={`flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400 animate-in fade-in duration-200 ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-brand-600 mb-3`} />
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
};
