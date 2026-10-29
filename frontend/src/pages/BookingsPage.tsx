import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookingsApi';
import { projectsApi } from '../api/projectsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Booking } from '../types';
import {
  CheckCircle2,
  Plus,
  Eye,
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  Building,
  User,
  Download,
  ExternalLink,
  ShieldCheck,
  Ban,
  Clock,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { FilterToolbar, ActiveFilter } from '../components/common/FilterToolbar';
import { DataTable, Column } from '../components/common/DataTable';
import { DataTableToolbar } from '../components/common/DataTableToolbar';
import { RecordDetailDrawer } from '../components/common/RecordDetailDrawer';
import { exportToCsv } from '../utils/csvExport';
import { Link, useNavigate } from 'react-router-dom';

export const BookingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('bookingDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Row selection state
  const [selectedBookingIds, setSelectedBookingIds] = useState<(number | string)[]>([]);

  // Modals & Drawer
  const [activeBookingDrawer, setActiveBookingDrawer] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Queries
  const { data: bookingsData, isLoading, error } = useQuery({
    queryKey: ['bookings', { statusFilter, projectFilter, page, pageSize, sortField, sortDir }],
    queryFn: () =>
      bookingsApi.getBookings({
        status: statusFilter || undefined,
        projectId: projectFilter ? Number(projectFilter) : undefined,
        page,
        size: pageSize,
      }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: projectsApi.getProjects,
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      bookingsApi.cancelBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Booking cancelled successfully', 'Associated property unit has been released back to Available status.');
      setCancelTarget(null);
      setCancelReason('');
      if (activeBookingDrawer?.id === cancelTarget?.id) {
        setActiveBookingDrawer(null);
      }
    },
    onError: (err: any) => {
      toast.error('Failed to cancel booking', err.response?.data?.message || err.message);
    },
  });

  const formatCurrency = (val: number | undefined) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportCsv = (selectedOnly: boolean) => {
    const listToExport = selectedOnly
      ? (bookingsData?.content || []).filter((b) => selectedBookingIds.includes(b.id))
      : bookingsData?.content || [];

    if (listToExport.length === 0) {
      toast.warning('No bookings to export');
      return;
    }

    exportToCsv(
      selectedOnly ? 'selected-bookings' : 'all-bookings',
      listToExport as any[],
      [
        { key: 'bookingReference', label: 'Booking Code' },
        { key: 'customerName', label: 'Buyer Name' },
        { key: 'customerPhone', label: 'Phone' },
        { key: 'customerEmail', label: 'Email' },
        { key: 'projectName', label: 'Project' },
        { key: 'buildingName', label: 'Building' },
        { key: 'unitNumber', label: 'Unit Number' },
        { key: 'agreedPrice', label: 'Unit Price' },
        { key: 'bookingAmount', label: 'Token Amount' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'status', label: 'Contract Status' },
        { key: 'bookedByName', label: 'Sales Agent' },
        { key: 'bookingDate', label: 'Booking Date' },
      ]
    );

    toast.info(`Exported ${listToExport.length} booking(s) to CSV`);
  };

  const activeFilters: ActiveFilter[] = [];
  if (statusFilter) {
    activeFilters.push({ key: 'status', label: 'Status', value: statusFilter });
  }
  if (projectFilter) {
    const proj = projects?.find((p) => p.id === Number(projectFilter));
    activeFilters.push({ key: 'project', label: 'Project', value: proj?.name || projectFilter });
  }

  const handleRemoveFilter = (key: string) => {
    if (key === 'status') setStatusFilter('');
    if (key === 'project') setProjectFilter('');
    setPage(0);
  };

  const handleClearAll = () => {
    setStatusFilter('');
    setProjectFilter('');
    setPage(0);
  };

  const columns: Column<Booking>[] = [
    {
      key: 'bookingReference',
      header: 'Booking Code & Date',
      render: (booking) => (
        <div>
          <span className="font-bold text-brand-700 dark:text-brand-400 block text-sm">{booking.bookingReference}</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
            {new Date(booking.bookingDate).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Buyer Details',
      render: (booking) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">{booking.customerName}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">{booking.customerPhone}</span>
        </div>
      ),
    },
    {
      key: 'property',
      header: 'Property Unit',
      render: (booking) => (
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{booking.projectName}</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
            Bldg: {booking.buildingName} • Unit #{booking.unitNumber}
          </span>
        </div>
      ),
    },
    {
      key: 'amounts',
      header: 'Financials',
      render: (booking) => (
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Price: <strong className="text-slate-800 dark:text-slate-100 font-semibold">{formatCurrency(booking.agreedPrice)}</strong>
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
            Token: {formatCurrency(booking.bookingAmount)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Contract Status',
      render: (booking) => <StatusBadge status={booking.status} />,
    },
    {
      key: 'bookedBy',
      header: 'Sales Agent',
      render: (booking) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {booking.bookedByName || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (booking) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setActiveBookingDrawer(booking)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Inspect Booking Details"
            aria-label="Inspect booking details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/bookings/${booking.id}`)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Open Agreement"
            aria-label="Open agreement"
          >
            <FileText className="w-4 h-4" />
          </button>
          {booking.status === 'CONFIRMED' && (
            <button
              type="button"
              onClick={() => setCancelTarget(booking)}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
              title="Cancel Booking Contract"
              aria-label="Cancel booking contract"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <PageHeader
        title="Bookings & Transactions"
        description="Concurrency-safeguarded property bookings, agreed settlements, and token receipts."
        breadcrumbs={[{ label: 'Bookings' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={() => handleExportCsv(false)}
            >
              Export All (CSV)
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/bookings/new')}
            >
              New Booking
            </Button>
          </>
        }
      />

      {/* Filters */}
      <FilterToolbar
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
        totalResults={bookingsData?.totalElements}
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
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {projects && (
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Filter by Project"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </FilterToolbar>

      {/* Bulk Action Toolbar */}
      <DataTableToolbar
        selectedCount={selectedBookingIds.length}
        totalCount={bookingsData?.content?.length}
        onClearSelection={() => setSelectedBookingIds([])}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => handleExportCsv(true)}
          >
            Export Selected (CSV)
          </Button>
        }
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={bookingsData?.content || []}
        isLoading={isLoading}
        emptyTitle="No bookings found"
        emptyDescription="There are no property bookings matching the specified filters."
        emptyActionLabel="Create Booking"
        onEmptyAction={() => navigate('/bookings/new')}
        selectable
        selectedIds={selectedBookingIds}
        onSelectionChange={setSelectedBookingIds}
        onRowClick={(booking) => setActiveBookingDrawer(booking)}
        highlightRowId={activeBookingDrawer?.id}
        page={page}
        pageSize={pageSize}
        totalPages={bookingsData?.totalPages || 1}
        totalElements={bookingsData?.totalElements || 0}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(0);
        }}
      />

      {/* Slide-out Record Detail Inspection Drawer */}
      <RecordDetailDrawer
        isOpen={!!activeBookingDrawer}
        onClose={() => setActiveBookingDrawer(null)}
        title={activeBookingDrawer?.bookingReference || 'Booking Details'}
        subtitle={
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">
              {activeBookingDrawer && new Date(activeBookingDrawer.bookingDate).toLocaleDateString()}
            </span>
            {activeBookingDrawer && <StatusBadge status={activeBookingDrawer.status} />}
          </div>
        }
        footer={
          activeBookingDrawer && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveBookingDrawer(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/bookings/${activeBookingDrawer.id}`)}
              >
                Full Agreement View
              </Button>
            </>
          )
        }
      >
        {activeBookingDrawer && (
          <div className="space-y-6 text-sm">
            {/* Financial Highlights */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Agreed Price
                </span>
                <span className="text-lg font-bold text-emerald-900 dark:text-emerald-200 block mt-0.5">
                  {formatCurrency(activeBookingDrawer.agreedPrice)}
                </span>
              </div>
              <div className="bg-brand-50/70 dark:bg-brand-950/40 p-3.5 rounded-xl border border-brand-200/60 dark:border-brand-900/60">
                <span className="text-[11px] font-semibold text-brand-800 dark:text-brand-300 uppercase tracking-wider block">
                  Token Amount
                </span>
                <span className="text-lg font-bold text-brand-900 dark:text-brand-200 block mt-0.5">
                  {formatCurrency(activeBookingDrawer.bookingAmount)}
                </span>
              </div>
            </div>

            {/* Buyer Info */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Purchaser Particulars
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{activeBookingDrawer.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Phone Number</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBookingDrawer.customerPhone}</span>
                </div>
                {activeBookingDrawer.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Email Address</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">{activeBookingDrawer.customerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Unit Particulars */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Property Unit Particulars
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Project</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBookingDrawer.projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Building</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBookingDrawer.buildingName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Unit Number</span>
                  <span className="font-bold text-brand-700 dark:text-brand-400">#{activeBookingDrawer.unitNumber}</span>
                </div>
              </div>
            </div>

            {/* Settlement Status */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Settlement Details
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payment Method</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBookingDrawer.paymentMethod || 'BANK_TRANSFER'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Registered Agent</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBookingDrawer.bookedByName}</span>
                </div>
              </div>
            </div>

            {/* Cancellation Notice if cancelled */}
            {activeBookingDrawer.status === 'CANCELLED' && (
              <div className="bg-rose-50 dark:bg-rose-950/60 p-4 rounded-xl border border-rose-200 dark:border-rose-900 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> Cancellation Reason
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  {activeBookingDrawer.cancellationReason || 'No reason specified'}
                </p>
              </div>
            )}
          </div>
        )}
      </RecordDetailDrawer>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Booking Contract"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Cancelling this booking will revert Unit #{cancelTarget?.unitNumber} back to{' '}
            <strong className="text-emerald-700 dark:text-emerald-400">AVAILABLE</strong> status and mark this contract as cancelled.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Cancellation <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Buyer financing rejected, client withdrew earnest deposit..."
              rows={3}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelTarget(null)}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              isLoading={cancelMutation.isPending}
              onClick={() => {
                if (cancelTarget && cancelReason.trim()) {
                  cancelMutation.mutate({ id: cancelTarget.id, reason: cancelReason });
                }
              }}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
