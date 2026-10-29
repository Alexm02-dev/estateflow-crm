import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DataTableToolbarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  actions?: ReactNode;
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 rounded-xl animate-in fade-in duration-200 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm">
          {selectedCount}
        </span>
        <span className="text-sm font-semibold text-brand-900 dark:text-brand-100">
          {selectedCount} {selectedCount === 1 ? 'record' : 'records'} selected
          {totalCount !== undefined && <span className="font-normal text-brand-700 dark:text-brand-300"> of {totalCount}</span>}
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300 hover:text-brand-900 dark:hover:text-white ml-1 underline decoration-brand-400 hover:decoration-brand-700 focus:outline-none"
        >
          <X className="w-3.5 h-3.5" />
          Clear selection
        </button>
      </div>

      {actions && (
        <div className="flex items-center flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};
