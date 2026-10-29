import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUpsApi } from '../api/followUpsApi';
import { leadsApi } from '../api/leadsApi';
import { useToast } from '../context/ToastContext';
import { FollowUp, FollowUpStatus } from '../types';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  ArrowRight,
  Download,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { FilterToolbar, ActiveFilter } from '../components/common/FilterToolbar';
import { DataTable, Column } from '../components/common/DataTable';
import { exportToCsv } from '../utils/csvExport';
import { Link, useSearchParams } from 'react-router-dom';

export const FollowUpsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const urlOverdue = searchParams.get('overdue') === 'true';
  const urlStatus = searchParams.get('status') || 'PENDING';

  const [statusFilter, setStatusFilter] = useState<string>(urlStatus);
  const [overdueOnly, setOverdueOnly] = useState<boolean>(urlOverdue);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Synchronize state when URL search params change
  React.useEffect(() => {
    const isOverdue = searchParams.get('overdue') === 'true';
    const statusParam = searchParams.get('status') || 'PENDING';
    setOverdueOnly(isOverdue);
    setStatusFilter(statusParam);
  }, [searchParams]);

  // Complete follow-up modal state
  const [completeTarget, setCompleteTarget] = useState<FollowUp | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Schedule new follow-up modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Queries
  const { data: followUpsData, isLoading, error } = useQuery({
    queryKey: ['follow-ups', { statusFilter, overdueOnly, page, pageSize }],
    queryFn: () =>
      followUpsApi.getFollowUps({
        status: statusFilter || undefined,
        overdueOnly: overdueOnly || undefined,
        page,
        size: pageSize,
      }),
  });

  const { data: leadsList } = useQuery({
    queryKey: ['leads-all-selector'],
    queryFn: () => leadsApi.getLeads({ size: 100 }),
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      followUpsApi.completeFollowUp(id, { completionNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Follow-up marked completed');
      setCompleteTarget(null);
      setCompletionNotes('');
    },
    onError: (err: any) => {
      toast.error('Failed to complete follow-up', err.response?.data?.message || err.message);
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => followUpsApi.createFollowUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Follow-up scheduled successfully');
      setIsCreateOpen(false);
      setSelectedLeadId('');
      setScheduledAt('');
      setNewNotes('');
    },
    onError: (err: any) => {
      toast.error('Failed to schedule follow-up', err.response?.data?.message || err.message);
    },
  });

  const handleExportCsv = () => {
    const list = followUpsData?.content || [];
    if (list.length === 0) {
      toast.warning('No follow-ups to export');
      return;
    }

    exportToCsv('follow-ups-schedule', list as any[], [
      { key: 'leadName', label: 'Lead Name' },
      { key: 'leadPhone', label: 'Phone' },
      { key: 'scheduledAt', label: 'Scheduled Time' },
      { key: 'notes', label: 'Notes' },
      { key: 'status', label: 'Status' },
      { key: 'assignedToName', label: 'Assigned Agent' },
      { key: 'completionNotes', label: 'Completion Notes' },
    ]);

    toast.info(`Exported ${list.length} follow-up(s) to CSV`);
  };

  const activeFilters: ActiveFilter[] = [];
  if (statusFilter) {
    activeFilters.push({ key: 'status', label: 'Status', value: statusFilter });
  }
  if (overdueOnly) {
    activeFilters.push({ key: 'overdueOnly', label: 'Overdue Only', value: 'Yes' });
  }

  const handleRemoveFilter = (key: string) => {
    if (key === 'status') setStatusFilter('');
    if (key === 'overdueOnly') setOverdueOnly(false);
    setPage(0);
  };

  const handleClearAll = () => {
    setStatusFilter('');
    setOverdueOnly(false);
    setPage(0);
  };

  const columns: Column<FollowUp>[] = [
    {
      key: 'scheduledAt',
      header: 'Scheduled Date & Time',
      render: (fu) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-sm">
            <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>
              {new Date(fu.scheduledAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {new Date(fu.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {fu.overdue && (
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-1.5 py-0.2 rounded">
                Overdue
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'leadName',
      header: 'Lead Details',
      render: (fu) => (
        <div>
          <Link
            to={`/leads/${fu.leadId}`}
            className="font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 block text-sm"
          >
            {fu.leadName}
          </Link>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            {fu.leadPhone}
          </span>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Action Notes',
      render: (fu) => (
        <div className="max-w-xs text-xs">
          <p className="text-slate-700 dark:text-slate-300 truncate">{fu.notes || '—'}</p>
          {fu.completionNotes && (
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded mt-1 border border-emerald-100 dark:border-emerald-900 truncate font-medium">
              Outcome: {fu.completionNotes}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'assignedToName',
      header: 'Assigned Agent',
      render: (fu) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{fu.assignedToName}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (fu) => <StatusBadge status={fu.status} />,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (fu) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          {fu.status === 'PENDING' ? (
            <Button
              variant="outline"
              size="sm"
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={() => setCompleteTarget(fu)}
            >
              Complete
            </Button>
          ) : (
            <span className="text-xs text-slate-400 italic">Resolved</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Page Header */}
      <PageHeader
        title="Follow-ups & Schedules"
        description="Never miss an appointment, walkthrough, or client callback across your active sales pipeline."
        breadcrumbs={[{ label: 'Follow-ups' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportCsv}
            >
              Export Schedule (CSV)
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Schedule Follow-up
            </Button>
          </>
        }
      />

      {/* Filter Toolbar */}
      <FilterToolbar
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
        totalResults={followUpsData?.totalElements}
      >
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Filter by Status"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Only</option>
          <option value="COMPLETED">Completed Only</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => {
              setOverdueOnly(e.target.checked);
              setPage(0);
            }}
            className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-rose-600 dark:text-rose-400 font-semibold">Overdue Tasks Only</span>
        </label>
      </FilterToolbar>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={followUpsData?.content || []}
        isLoading={isLoading}
        emptyTitle="No follow-ups found"
        emptyDescription="There are no follow-up schedules matching your active filter criteria."
        emptyActionLabel="Schedule First Follow-up"
        onEmptyAction={() => setIsCreateOpen(true)}
        page={page}
        pageSize={pageSize}
        totalPages={followUpsData?.totalPages || 1}
        totalElements={followUpsData?.totalElements || 0}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(0);
        }}
      />

      {/* Complete Follow-up Modal */}
      <Modal
        isOpen={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        title="Complete Follow-up"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (completeTarget && completionNotes.trim()) {
              completeMutation.mutate({ id: completeTarget.id, notes: completionNotes.trim() });
            }
          }}
          className="space-y-4"
        >
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Record outcome and meeting notes for <strong className="text-slate-800 dark:text-slate-100">{completeTarget?.leadName}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Discussion Summary / Outcome <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g. Spoke with client. Confirmed mortgage approval and scheduled on-site tour for Friday..."
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setCompleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={completeMutation.isPending}>
              Mark Completed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule New Follow-up"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedLeadId && scheduledAt) {
              createMutation.mutate({
                leadId: Number(selectedLeadId),
                scheduledAt,
                notes: newNotes.trim(),
              });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Lead <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">-- Select Lead --</option>
              {leadsList?.content?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName} ({l.leadCode} • {l.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Instructions & Action Items
            </label>
            <textarea
              rows={3}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Call to discuss pricing discounts approved by director..."
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createMutation.isPending}>
              Schedule Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
