import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';
import { LeadRow } from './LeadRow';
import { SearchInput } from '../common/SearchInput';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { Users, Filter, CheckCircle2 } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onProceedToNext?: (lead: Lead) => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  showFilters?: boolean;
  className?: string;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  selectedLead,
  onSelectLead,
  onProceedToNext,
  isLoading = false,
  error = null,
  onRetry,
  showFilters = true,
  className = '',
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'budget' | 'date'>('date');

  // Filter & sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.fullName.toLowerCase().includes(q) ||
          l.leadCode.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.email && l.email.toLowerCase().includes(q))
      );
    }

    if (stageFilter) {
      result = result.filter((l) => l.stage === stageFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName);
      }
      if (sortBy === 'budget') {
        return (b.budget || 0) - (a.budget || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [leads, search, stageFilter, sortBy]);

  if (isLoading) {
    return <LoadingState message="Loading eligible prospective buyers..." size="lg" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to retrieve buyers"
        message={error.message || 'Could not fetch lead inquiries from the database.'}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Lead Highlight Banner if chosen */}
      {selectedLead && (
        <div className="flex items-center justify-between p-3.5 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 rounded-xl text-xs text-brand-900 dark:text-brand-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span>
                Selected Buyer: <strong>{selectedLead.fullName}</strong> ({selectedLead.leadCode})
              </span>
              <span className="text-slate-500 dark:text-slate-400 ml-2 hidden sm:inline">
                • Phone: {selectedLead.phone}
              </span>
            </div>
          </div>

          {onProceedToNext && (
            <button
              type="button"
              onClick={() => onProceedToNext(selectedLead)}
              className="font-bold text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-200 underline decoration-brand-400 hover:decoration-brand-800"
            >
              Continue to Unit Selection &rarr;
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SearchInput
            value={search}
            onChangeValue={setSearch}
            placeholder="Search buyer name, phone, email, or code..."
            className="flex-1"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Filter by Lead Stage"
            >
              <option value="">All Active Stages</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="SITE_VISIT">Site Visit</option>
              <option value="INTERESTED">Interested</option>
              <option value="NEGOTIATION">Negotiation</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Sort Leads"
            >
              <option value="date">Sort: Recent First</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="budget">Sort: Highest Budget</option>
            </select>
          </div>
        </div>
      )}

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No eligible buyers found"
          description={
            search || stageFilter
              ? 'No buyers match your filter query. Try clearing your search.'
              : 'There are currently no active leads available for reservation.'
          }
        />
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredLeads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              isSelected={selectedLead?.id === lead.id}
              onSelect={onSelectLead}
              onProceed={onProceedToNext}
            />
          ))}
        </div>
      )}
    </div>
  );
};
