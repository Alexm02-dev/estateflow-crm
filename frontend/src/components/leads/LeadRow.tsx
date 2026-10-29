import React from 'react';
import { Lead } from '../../types';
import { LeadCheckbox } from './LeadCheckbox';
import { LeadStatusBadge } from './LeadStatusBadge';
import { LeadDetailsPopover } from './LeadDetailsPopover';
import { Phone, Mail, Building, ArrowRight, Check } from 'lucide-react';
import { Button } from '../common/Button';

interface LeadRowProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: (lead: Lead) => void;
  onProceed?: (lead: Lead) => void;
  onViewDetails?: (lead: Lead) => void;
  showCheckbox?: boolean;
  showAction?: boolean;
  actionLabel?: string;
  className?: string;
}

export const LeadRow: React.FC<LeadRowProps> = ({
  lead,
  isSelected,
  onSelect,
  onProceed,
  onViewDetails,
  showCheckbox = true,
  showAction = true,
  actionLabel = 'Select & Proceed',
  className = '',
}) => {
  const formatCurrency = (val: number | undefined) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleRowClick = () => {
    onSelect(lead);
  };

  const handleProceedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(lead);
    if (onProceed) {
      onProceed(lead);
    }
  };

  return (
    <div
      role="row"
      aria-selected={isSelected}
      onClick={handleRowClick}
      className={`group relative rounded-xl border p-4 transition-all duration-200 ease-out cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isSelected
          ? 'bg-brand-50/70 dark:bg-brand-950/60 border-brand-500 ring-2 ring-brand-500/20 shadow-md translate-y-0'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/90 dark:hover:bg-slate-800/80 hover:shadow-md hover:-translate-y-0.5'
      } ${className}`}
    >
      {/* Left side: Checkbox, Name, and Contact details */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {showCheckbox && (
          <div className="pt-0.5 sm:pt-0 flex-shrink-0">
            <LeadCheckbox
              checked={isSelected}
              onChange={() => onSelect(lead)}
              label={`Select ${lead.fullName}`}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <LeadDetailsPopover
              lead={lead}
              onViewDetails={
                onViewDetails
                  ? () => onViewDetails(lead)
                  : () => {
                      window.location.href = `/leads/${lead.id}`;
                    }
              }
            >
              <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-sm sm:text-base hover:underline cursor-pointer">
                {lead.fullName}
              </span>
            </LeadDetailsPopover>

            <span className="font-mono text-[11px] text-slate-400">
              {lead.leadCode}
            </span>

            <LeadStatusBadge status={lead.stage} size="sm" />
          </div>

          {/* Contact and Project info */}
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{lead.phone}</span>
            </span>

            {lead.email && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{lead.email}</span>
              </span>
            )}

            {lead.interestedProjectName && (
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{lead.interestedProjectName}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Budget and Action Button */}
      <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Budget
          </span>
          <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 block">
            {formatCurrency(lead.budget)}
          </span>
        </div>

        {showAction && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isSelected ? 'primary' : 'outline'}
              size="sm"
              onClick={handleProceedClick}
              icon={isSelected ? <Check className="w-3.5 h-3.5" /> : undefined}
              className={`transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                  : 'text-slate-700 dark:text-slate-200 hover:text-brand-600 hover:border-brand-300'
              }`}
            >
              <span>{isSelected ? 'Proceed to Unit' : actionLabel}</span>
              {!isSelected && <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:translate-x-0.5 transition-transform" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
