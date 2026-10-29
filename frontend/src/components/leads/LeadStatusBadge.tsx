import React from 'react';
import { LeadStage } from '../../types';

interface LeadStatusBadgeProps {
  status: LeadStage | string;
  size?: 'sm' | 'md';
  className?: string;
  showDot?: boolean;
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
  showDot = true,
}) => {
  const getBadgeConfig = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'NEW':
        return {
          label: 'New Lead',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'CONTACTED':
        return {
          label: 'Contacted',
          bg: 'bg-indigo-50',
          text: 'text-indigo-700',
          border: 'border-indigo-200',
          dot: 'bg-indigo-500',
        };
      case 'SITE_VISIT':
        return {
          label: 'Site Visit',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          dot: 'bg-purple-500',
        };
      case 'INTERESTED':
        return {
          label: 'Interested',
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'NEGOTIATION':
        return {
          label: 'In Negotiation',
          bg: 'bg-orange-50',
          text: 'text-orange-800',
          border: 'border-orange-200',
          dot: 'bg-orange-500',
        };
      case 'BOOKED':
      case 'CONVERTED':
        return {
          label: 'Converted',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-800 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800/60',
          dot: 'bg-emerald-500',
        };
      case 'LOST':
        return {
          label: 'Lost',
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: s ? s.replace('_', ' ') : 'Unknown',
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs transition-colors duration-150 ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{config.label}</span>
    </span>
  );
};
