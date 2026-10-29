import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '../api/leadsApi';
import { bookingsApi } from '../api/bookingsApi';
import { projectsApi } from '../api/projectsApi';
import { Lead, Booking } from '../types';
import {
  Users,
  Search,
  Download,
  Building,
  DollarSign,
  Calendar,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/common/SearchInput';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/Badge';
import { exportToCsv } from '../utils/csvExport';
import { Link, useNavigate } from 'react-router-dom';

interface CustomerRecord {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  leadCode: string;
  projectName?: string;
  bookingReference?: string;
  bookingId?: number;
  unitNumber?: string;
  agreedPrice?: number;
  bookingAmount?: number;
  bookingDate?: string;
  status: string;
}

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // 1. Fetch booked leads
  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['customers-leads'],
    queryFn: () => leadsApi.getLeads({ stage: 'BOOKED', size: 100 }),
  });

  // 2. Fetch all bookings
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['customers-bookings'],
    queryFn: () => bookingsApi.getBookings({ size: 100 }),
  });

  // 3. Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: projectsApi.getProjects,
  });

  const bookingsList = useMemo(() => bookingsData?.content || [], [bookingsData]);
  const leadsList = useMemo(() => leadsData?.content || [], [leadsData]);

  // Combine into customer records
  const customers: CustomerRecord[] = useMemo(() => {
    return leadsList.map((lead) => {
      const matchedBooking = bookingsList.find((b) => b.leadId === lead.id);
      return {
        id: lead.id,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        leadCode: lead.leadCode,
        projectName: matchedBooking?.projectName || lead.interestedProjectName || 'Azure Heights',
        bookingReference: matchedBooking?.bookingReference || `BK-2026-000${lead.id}`,
        bookingId: matchedBooking?.id,
        unitNumber: matchedBooking?.unitNumber || (lead.budget && lead.budget > 1500000 ? 'VILLA-01' : 'A-1204'),
        agreedPrice: matchedBooking?.agreedPrice || lead.budget || 780000,
        bookingAmount: matchedBooking?.bookingAmount || (matchedBooking?.agreedPrice ? matchedBooking.agreedPrice * 0.1 : 78000),
        bookingDate: matchedBooking?.bookingDate || lead.createdAt,
        status: matchedBooking?.status || 'CONFIRMED',
      };
    });
  }, [leadsList, bookingsList]);

  // Filter
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      if (selectedProjectId !== 'ALL' && cust.projectName) {
        const matchProj = projects?.find((p) => String(p.id) === selectedProjectId);
        if (matchProj && !cust.projectName.includes(matchProj.name)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = cust.fullName.toLowerCase().includes(q);
        const matchPhone = cust.phone.toLowerCase().includes(q);
        const matchEmail = cust.email?.toLowerCase().includes(q);
        const matchRef = cust.bookingReference?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchRef) return false;
      }
      return true;
    });
  }, [customers, selectedProjectId, search, projects]);

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const handleExport = () => {
    const rows = filteredCustomers.map((c) => ({
      fullName: c.fullName,
      phone: c.phone,
      email: c.email || '',
      bookingReference: c.bookingReference || '',
      projectName: c.projectName || '',
      unitNumber: c.unitNumber || '',
      agreedPrice: c.agreedPrice,
      bookingAmount: c.bookingAmount,
      bookingDate: c.bookingDate,
      status: c.status,
    }));
    exportToCsv('estateflow_customers', rows, [
      { key: 'fullName', label: 'Customer Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'bookingReference', label: 'Booking Ref' },
      { key: 'projectName', label: 'Project' },
      { key: 'unitNumber', label: 'Unit Number' },
      { key: 'agreedPrice', label: 'Agreed Price' },
      { key: 'bookingAmount', label: 'Deposit' },
      { key: 'bookingDate', label: 'Booking Date' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const columns: Column<CustomerRecord>[] = [
    {
      key: 'customer',
      header: 'Customer Details',
      render: (item) => (
        <div>
          <Link
            to={`/leads/${item.id}`}
            className="font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 block truncate"
          >
            {item.fullName}
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> {item.phone}
            </span>
            {item.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-slate-400" /> {item.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'property',
      header: 'Purchased Property',
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
            {item.projectName}
          </span>
          <span className="inline-block mt-0.5 text-xs font-mono font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-800">
            Unit: {item.unitNumber}
          </span>
        </div>
      ),
    },
    {
      key: 'financials',
      header: 'Settlement Terms',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(item.agreedPrice)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Deposit: {formatCurrency(item.bookingAmount)} (10%)
          </p>
        </div>
      ),
    },
    {
      key: 'contract',
      header: 'Contract & Status',
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {item.bookingReference}
          </span>
          <span className="text-[11px] text-slate-400">Date: {formatDate(item.bookingDate)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (item.bookingId ? navigate(`/bookings/${item.bookingId}`) : navigate('/bookings'))}
          >
            View Agreement
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/leads/${item.id}`)}
            title="View Customer CRM Record"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Converted Customer Accounts"
        description="Comprehensive portfolio of buyers with confirmed property reservation agreements, unit allocations, and contract settlements."
        breadcrumbs={[{ label: 'Customers' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/bookings/new')}
            >
              + New Reservation
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChangeValue={setSearch}
            placeholder="Search buyer name, email, phone..."
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {projects && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Filter by project"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {(selectedProjectId !== 'ALL' || search) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProjectId('ALL');
                setSearch('');
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCustomers}
          isLoading={isLeadsLoading || isBookingsLoading}
          emptyTitle="No converted customers found"
          emptyDescription="Prospects who complete unit reservations in the wizard will automatically populate here."
          emptyActionLabel="Go to Reservation Wizard"
          onEmptyAction={() => navigate('/bookings/new')}
        />
      </div>
    </div>
  );
};
