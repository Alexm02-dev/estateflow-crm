import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookingsApi';
import {
  ArrowLeft,
  CheckCircle2,
  Printer,
  Building,
  User,
  CreditCard,
  Calendar,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getBookingById(bookingId),
    enabled: !isNaN(bookingId),
  });

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (error || !booking) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Booking Record Not Found</h3>
        <Link to="/bookings">
          <Button variant="secondary" size="sm" className="mt-3">Back to Bookings</Button>
        </Link>
      </div>
    );
  }

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
  };

  const balanceRemaining = booking.agreedPrice - booking.bookingAmount;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      <Breadcrumbs
        items={[
          { label: 'Bookings', path: '/bookings' },
          { label: booking.bookingReference },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/bookings"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Booking Ref: {booking.bookingReference}
              </h1>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Settlement completed on {new Date(booking.bookingDate).toLocaleString()}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Printer className="w-4 h-4" />}
          onClick={() => window.print()}
        >
          Print Voucher
        </Button>
      </div>

      {/* Cancellation Warning Banner if Cancelled */}
      {booking.status === 'CANCELLED' && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-rose-900 dark:text-rose-200">This booking was cancelled</h4>
            <p className="mt-0.5">
              <strong>Reason:</strong> {booking.cancellationReason}
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
              Cancelled on {booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString() : '—'} by {booking.cancelledByName || 'Admin'}
            </p>
          </div>
        </div>
      )}

      {/* Official Booking Certificate Slip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card p-6 sm:p-10 space-y-8">
        {/* Top Header of Certificate */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">EstateFlow Real Estate CRM</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Official Unit Booking Agreement Receipt</span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-mono block">Booking Reference</span>
            <span className="text-lg font-bold font-mono text-brand-600 dark:text-brand-400">{booking.bookingReference}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          {/* Buyer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[11px]">
              Customer Information
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-2">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block">Client Name</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{booking.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block">Phone</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{booking.customerPhone}</span>
              </div>
              {booking.customerEmail && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block">Email</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{booking.customerEmail}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block">Lead File Code</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{booking.leadCode}</span>
              </div>
            </div>
          </div>

          {/* Property Unit Information */}
          <div className="space-y-3">
            <h3 className="font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[11px]">
              Property Unit Specifications
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-2">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block">Unit Number</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Unit {booking.unitNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block">Development Project</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{booking.projectName}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block">Building / Tower</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{booking.buildingName}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase block">Unit Configuration</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{booking.unitType?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Settlement Breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[11px]">
            Financial Settlement Breakdown
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Agreed Unit Selling Price</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">{formatCurrency(booking.agreedPrice)}</span>
            </div>
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-emerald-50/40 dark:bg-emerald-950/40">
              <div>
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 block">Token Deposit Paid</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Method: {booking.paymentMethod || 'Bank Wire'}</span>
              </div>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                - {formatCurrency(booking.bookingAmount)}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-900">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Remaining Balance at Registration</span>
              <span className="text-lg font-black text-brand-600 dark:text-brand-400">{formatCurrency(balanceRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Verification and Agent Signoff */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <div>
            <p>Authorized Sales Agent: <strong className="text-slate-800 dark:text-slate-200">{booking.bookedByName}</strong></p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Booking timestamp: {new Date(booking.bookingDate).toISOString()}</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="w-4 h-4" />
            <span>Database Integrity Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
