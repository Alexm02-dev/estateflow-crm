import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { employeesApi } from '../api/employeesApi';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Role } from '../types';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  Shield,
  Edit,
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  UserX,
  Power,
  ShieldAlert,
  Users,
  Briefcase,
  Award,
  TrendingUp,
  DollarSign,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { FilterToolbar, ActiveFilter } from '../components/common/FilterToolbar';
import { DataTable, Column } from '../components/common/DataTable';
import { DataTableToolbar } from '../components/common/DataTableToolbar';
import { RecordDetailDrawer } from '../components/common/RecordDetailDrawer';
import { UserAvatar } from '../components/common/UserAvatar';
import { SearchInput } from '../components/common/SearchInput';
import { exportToCsv } from '../utils/csvExport';

export const EmployeesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'directory';
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Row selection
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<(number | string)[]>([]);

  // Modals & Drawer
  const [activeEmployeeDrawer, setActiveEmployeeDrawer] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('SALES_EMPLOYEE');

  // Edit Modal state
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<Role>('SALES_EMPLOYEE');
  const [editActive, setEditActive] = useState<boolean>(true);

  // Queries
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesApi.getAllEmployees,
  });

  const { data: analytics } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: dashboardApi.getAnalytics,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => employeesApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['sales-agents-list'] });
      toast.success('Employee created successfully');
      setIsCreateOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
    },
    onError: (err: any) => {
      toast.error('Failed to create employee', err.response?.data?.message || err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      employeesApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['sales-agents-list'] });
      toast.success('Employee updated successfully');
      setEditTarget(null);
      if (activeEmployeeDrawer?.id === editTarget?.id) {
        setActiveEmployeeDrawer((prev) => (prev ? { ...prev, name: editName, email: editEmail, phone: editPhone, role: editRole, active: editActive } : null));
      }
    },
    onError: (err: any) => {
      toast.error('Failed to update employee', err.response?.data?.message || err.message);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, active }: { ids: number[]; active: boolean }) =>
      employeesApi.bulkUpdateStatus(ids, active),
    onSuccess: (count, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['sales-agents-list'] });
      toast.success(
        'Staff Status Updated',
        `Successfully ${variables.active ? 'activated' : 'deactivated'} ${count} employee account(s)`
      );
      setSelectedEmployeeIds([]);
    },
    onError: (err: any) => {
      toast.error('Bulk update failed', err.response?.data?.message || err.message);
    },
  });

  const handleOpenEdit = (emp: User) => {
    setEditTarget(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditPhone(emp.phone || '');
    setEditRole(emp.role);
    setEditActive(emp.active);
  };

  // Filter & search logic
  const filteredEmployees = (employees || []).filter((emp) => {
    if (roleFilter && emp.role !== roleFilter) return false;
    if (statusFilter && String(emp.active) !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        (emp.phone && emp.phone.includes(q))
      );
    }
    return true;
  });

  const handleExportCsv = (selectedOnly: boolean) => {
    const listToExport = selectedOnly
      ? filteredEmployees.filter((e) => selectedEmployeeIds.includes(e.id))
      : filteredEmployees;

    if (listToExport.length === 0) {
      toast.warning('No employees to export');
      return;
    }

    exportToCsv(
      selectedOnly ? 'selected-employees' : 'staff-roster',
      listToExport as any[],
      [
        { key: 'name', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'role', label: 'System Role' },
        { key: 'active', label: 'Active Status' },
        { key: 'createdAt', label: 'Joined Date' },
      ]
    );

    toast.info(`Exported ${listToExport.length} employee(s) to CSV`);
  };

  const activeFilters: ActiveFilter[] = [];
  if (roleFilter) {
    activeFilters.push({
      key: 'role',
      label: 'Role',
      value: roleFilter === 'ADMIN' ? 'Administrator' : 'Sales Employee',
    });
  }
  if (statusFilter) {
    activeFilters.push({
      key: 'status',
      label: 'Status',
      value: statusFilter === 'true' ? 'Active' : 'Inactive',
    });
  }
  if (search) {
    activeFilters.push({ key: 'search', label: 'Search', value: search });
  }

  const handleRemoveFilter = (key: string) => {
    if (key === 'role') setRoleFilter('');
    if (key === 'status') setStatusFilter('');
    if (key === 'search') setSearch('');
  };

  const handleClearAll = () => {
    setRoleFilter('');
    setStatusFilter('');
    setSearch('');
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={emp.name} size="sm" showStatus isOnline={emp.active} />
          <div>
            <span className="font-bold text-slate-900 block text-sm">{emp.name}</span>
            <span className="text-[11px] text-slate-500 block">{emp.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: (emp) => (
        <span className="text-xs text-slate-700 font-medium">{emp.phone || '—'}</span>
      ),
    },
    {
      key: 'role',
      header: 'System Role',
      render: (emp) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            emp.role === 'ADMIN'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          <Shield className="w-3 h-3 text-current" />
          <span>{emp.role === 'ADMIN' ? 'Company Admin' : 'Sales Representative'}</span>
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Account Status',
      render: (emp) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold ${
            emp.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${emp.active ? 'bg-emerald-500' : 'bg-slate-400'}`}
          />
          <span>{emp.active ? 'Active' : 'Deactivated'}</span>
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      render: (emp) => (
        <span className="text-xs text-slate-500">
          {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (emp) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setActiveEmployeeDrawer(emp)}
            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Inspect Employee"
            aria-label="Inspect employee"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenEdit(emp)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Employee"
            aria-label="Edit employee"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <PageHeader
        title="Sales Team & Employee Administration"
        description="Administer sales representatives, define enterprise roles, and oversee staff access permissions."
        breadcrumbs={[{ label: 'Employees' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={() => handleExportCsv(false)}
            >
              Export Staff (CSV)
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Add Staff Member
            </Button>
          </>
        }
      />

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setSearchParams({})}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'directory'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Directory ({employees?.length || 0})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'assignments' })}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'assignments'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Agent Workload & Performance</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'roles' })}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'roles'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role & Permission Matrix</span>
        </button>
      </div>

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <>
          <FilterToolbar
            activeFilters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAll}
            totalResults={filteredEmployees.length}
          >
            <SearchInput
              value={search}
              onChangeValue={setSearch}
              placeholder="Search by name, email, phone..."
              className="w-full"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Filter by Role"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Company Admin</option>
              <option value="SALES_EMPLOYEE">Sales Representative</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Filter by Status"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Deactivated</option>
            </select>
          </FilterToolbar>

          <DataTableToolbar
            selectedCount={selectedEmployeeIds.length}
            totalCount={filteredEmployees.length}
            onClearSelection={() => setSelectedEmployeeIds([])}
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleExportCsv(true)}
                >
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Power className="w-3.5 h-3.5 text-emerald-600" />}
                  onClick={() =>
                    bulkStatusMutation.mutate({
                      ids: selectedEmployeeIds.map(Number),
                      active: true,
                    })
                  }
                >
                  Activate Accounts
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<UserX className="w-3.5 h-3.5" />}
                  onClick={() =>
                    bulkStatusMutation.mutate({
                      ids: selectedEmployeeIds.map(Number),
                      active: false,
                    })
                  }
                >
                  Deactivate Accounts
                </Button>
              </>
            }
          />

          <DataTable
            columns={columns}
            data={filteredEmployees}
            isLoading={isLoading}
            emptyTitle="No employees found"
            emptyDescription="No employees match your search or filter query."
            selectable
            selectedIds={selectedEmployeeIds}
            onSelectionChange={setSelectedEmployeeIds}
            isRowSelectable={(emp) => emp.email !== 'admin@estatecrm.com'}
            onRowClick={(emp) => setActiveEmployeeDrawer(emp)}
            highlightRowId={activeEmployeeDrawer?.id}
            totalElements={filteredEmployees.length}
          />
        </>
      )}

      {/* Agent Workload & Performance Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Active Sales Agents</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {analytics?.employeePerformance?.length || 0}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Active Lead Pipeline</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {(analytics?.employeePerformance || []).reduce((s, e) => s + (e.assignedLeads || 0), 0)} Leads
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Team Closed Revenue</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                    (analytics?.employeePerformance || []).reduce((s, e) => s + (e.totalRevenue || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sales Representative Workload Roster</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Lead distribution, deal velocity, and closed volume per agent</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(analytics?.employeePerformance || []).map((perf, idx) => {
                const convRate = perf.assignedLeads > 0
                  ? ((perf.bookedCount / perf.assignedLeads) * 100).toFixed(1)
                  : '0.0';
                return (
                  <div key={perf.employeeId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                        #{idx + 1}
                      </div>
                      <UserAvatar name={perf.name} size="md" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{perf.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{perf.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Assigned Leads</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{perf.assignedLeads} Inquiries</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Closed Deals</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{perf.bookedCount} Bookings</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Conversion Rate</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{convRate}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Closed Volume</span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(perf.totalRevenue)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Link
                        to={`/leads?agent=${perf.employeeId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors"
                      >
                        Inspect Leads <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Role & Permissions Matrix Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Role-Based Access Control (RBAC) Architecture</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              EstateFlow enforces strict boundary permissions validated at the Spring Security JWT Filter layer and annotated across REST endpoints using <code>@PreAuthorize</code>.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-subtle">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Feature / Module Action</th>
                  <th className="py-3 px-4 text-center">Company Administrator (ADMIN)</th>
                  <th className="py-3 px-4 text-center">Sales Representative (SALES_EMPLOYEE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { module: 'Leads: View Assigned Pipeline', admin: true, sales: true },
                  { module: 'Leads: View All Organization Leads', admin: true, sales: false },
                  { module: 'Leads: Create & Edit Inquiries', admin: true, sales: true },
                  { module: 'Leads: Bulk Reassign to Other Agents', admin: true, sales: false },
                  { module: 'Leads: Hard Delete Inquiries', admin: true, sales: false },
                  { module: 'Inventory: Browse Units & Price Cards', admin: true, sales: true },
                  { module: 'Inventory: Create Unit & Pricing Overrides', admin: true, sales: false },
                  { module: 'Inventory: Bulk Status Overrides', admin: true, sales: false },
                  { module: 'Projects: View Architectural Specs & Towers', admin: true, sales: true },
                  { module: 'Projects: Create Master Projects & Towers', admin: true, sales: false },
                  { module: 'Reservations: Lock & Book Unit', admin: true, sales: true },
                  { module: 'Reservations: Cancel Confirmed Booking', admin: true, sales: false },
                  { module: 'Staff: View Employee Roster', admin: true, sales: true },
                  { module: 'Staff: Provision New Accounts & Passwords', admin: true, sales: false },
                  { module: 'Staff: Deactivate / Terminate Access', admin: true, sales: false },
                  { module: 'System: View Audit Logs & Security Trails', admin: true, sales: false },
                  { module: 'System: Database Migrations & API Config', admin: true, sales: false },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">{row.module}</td>
                    <td className="py-2.5 px-4 text-center">
                      {row.admin ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {row.sales ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-out Record Detail Inspection Drawer */}
      <RecordDetailDrawer
        isOpen={!!activeEmployeeDrawer}
        onClose={() => setActiveEmployeeDrawer(null)}
        title={activeEmployeeDrawer?.name || 'Employee Profile'}
        subtitle={
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{activeEmployeeDrawer?.email}</span>
            {activeEmployeeDrawer && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  activeEmployeeDrawer.active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {activeEmployeeDrawer.active ? 'Active' : 'Deactivated'}
              </span>
            )}
          </div>
        }
        footer={
          activeEmployeeDrawer && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveEmployeeDrawer(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => handleOpenEdit(activeEmployeeDrawer)}
              >
                Edit Details & Permissions
              </Button>
            </>
          )
        }
      >
        {activeEmployeeDrawer && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <UserAvatar name={activeEmployeeDrawer.name} size="lg" showStatus isOnline={activeEmployeeDrawer.active} />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{activeEmployeeDrawer.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeEmployeeDrawer.email}</p>
                <div className="mt-1">
                  <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {activeEmployeeDrawer.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Staff Credentials & Contact
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Official Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeEmployeeDrawer.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Phone Number</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeEmployeeDrawer.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">System Role</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{activeEmployeeDrawer.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Account Registered</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeEmployeeDrawer.createdAt
                      ? new Date(activeEmployeeDrawer.createdAt).toLocaleString()
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </RecordDetailDrawer>

      {/* Create Employee Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Staff Member"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !email.trim() || !password) {
              toast.error('Validation Error', 'Name, email, and password are required');
              return;
            }
            createMutation.mutate({
              name: name.trim(),
              email: email.trim(),
              password,
              phone: phone.trim() || undefined,
              role,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rachel Adams"
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Corporate Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rachel@estatecrm.com"
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role & Permissions <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="SALES_EMPLOYEE">Sales Representative</option>
              <option value="ADMIN">Company Administrator</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
            >
              Add Staff
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Staff Member"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editTarget) return;
            updateMutation.mutate({
              id: editTarget.id,
              data: {
                name: editName.trim(),
                email: editEmail.trim(),
                phone: editPhone.trim() || undefined,
                role: editRole,
                active: editActive,
              },
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as Role)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="SALES_EMPLOYEE">Sales Representative</option>
                <option value="ADMIN">Company Administrator</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Account Active & Authorized
              </span>
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5 ml-6">
              Deactivated users cannot log into the EstateFlow platform or accept leads.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
