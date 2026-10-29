import React, { ReactNode } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface FilterToolbarProps {
  children?: ReactNode;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (key: string) => void;
  onClearAll?: () => void;
  totalResults?: number;
  className?: string;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  children,
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  totalResults,
  className = '',
}) => {
  return (
    <div className={`space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      {/* Top filter inputs / dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 min-w-0 w-full">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider flex-shrink-0">
          <Filter className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0 w-full">
          {children}
        </div>
      </div>

      {/* Active Filter Chips & Clear */}
      {(activeFilters.length > 0 || totalResults !== undefined) && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500 font-medium mr-1">Active:</span>
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800 font-medium"
              >
                <span>
                  <strong className="font-semibold text-brand-900 dark:text-brand-200">{filter.label}:</strong> {filter.value}
                </span>
                {onRemoveFilter && (
                  <button
                    type="button"
                    onClick={() => onRemoveFilter(filter.key)}
                    className="hover:text-brand-900 dark:hover:text-brand-100 focus:outline-none"
                    aria-label={`Remove filter ${filter.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}

            {activeFilters.length > 0 && onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-2 font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            )}
          </div>

          {totalResults !== undefined && (
            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{totalResults}</span> records
            </div>
          )}
        </div>
      )}
    </div>
  );
};
