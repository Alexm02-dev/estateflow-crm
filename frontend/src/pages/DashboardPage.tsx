import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { projectsApi } from '../api/projectsApi';
import { unitsApi } from '../api/unitsApi';
import { employeesApi } from '../api/employeesApi';
import { leadsApi } from '../api/leadsApi';
import { bookingsApi } from '../api/bookingsApi';
import { followUpsApi } from '../api/followUpsApi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Home,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Filter,
  BarChart3,
  Layers,
  Award,
  CalendarClock,
  Phone,
  Briefcase,
  RotateCcw,
  AlertTriangle,
  PieChart as PieIcon,
  X,
  Target,
  Activity,
  ArrowDownRight,
  CheckSquare,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  DatePreset,
  DashboardFilterState,
  calculateDateBounds,
  computeDashboardData,
  formatDateToInput,
} from '../utils/dashboardFilters';

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // 1. Dashboard Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('YTD');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return formatDateToInput(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => formatDateToInput(new Date()));
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('ALL');

  // Compute Active Date Boundaries & Validation
  const dateBounds = useMemo(() => {
    return calculateDateBounds(datePreset, customStartDate, customEndDate);
  }, [datePreset, customStartDate, customEndDate]);

  // Unified Filter State Object
  const filterState: DashboardFilterState = useMemo(() => ({
    datePreset,
    customStartDate,
    customEndDate,
    projectId: selectedProjectId,
    agentId: selectedAgentId,
  }), [datePreset, customStartDate, customEndDate, selectedProjectId, selectedAgentId]);

  // Chart Theme Tokens (WCAG AA Contrast)
  const gridStroke = isDark ? '#334155' : '#E2E8F0';
  const axisTickColor = isDark ? '#94A3B8' : '#475569';
  const sliceStroke = isDark ? '#111827' : '#FFFFFF';

  const tooltipContentStyle = {
    backgroundColor: isDark ? '#0F172A' : '#1E293B',
    borderColor: isDark ? '#334155' : '#475569',
    color: '#F8FAFC',
    borderRadius: '10px',
    fontSize: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  };

  // High-contrast color palette for categories
  const sourceColors = [
    '#4F46E5', // Indigo
    '#0EA5E9', // Sky blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#64748B', // Slate
  ];

  // 2. Data Queries
  const {
    data: leadsPage,
    isLoading: isLeadsLoading,
    error: leadsError,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ['dashboard-all-leads'],
    queryFn: () => leadsApi.getLeads({ size: 1000 }),
  });

  const {
    data: bookingsPage,
    isLoading: isBookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['dashboard-all-bookings'],
    queryFn: () => bookingsApi.getBookings({ size: 1000 }),
  });

  const {
    data: units = [],
    isLoading: isUnitsLoading,
    error: unitsError,
    refetch: refetchUnits,
  } = useQuery({
    queryKey: ['dashboard-units-availability'],
    queryFn: () => unitsApi.getUnits({}),
  });

  const {
    data: followUpsPage,
    isLoading: isFollowUpsLoading,
    error: followUpsError,
    refetch: refetchFollowUps,
  } = useQuery({
    queryKey: ['dashboard-all-followups'],
    queryFn: () => followUpsApi.getFollowUps({ size: 1000 }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['dashboard-projects-filter'],
    queryFn: projectsApi.getProjects,
  });

  const { data: salesAgents = [] } = useQuery({
    queryKey: ['dashboard-sales-agents'],
    queryFn: employeesApi.getSalesEmployees,
  });

  const isLoading = isLeadsLoading || isBookingsLoading || isUnitsLoading || isFollowUpsLoading;
  const isError = leadsError || bookingsError || unitsError || followUpsError;

  // 3. Reactive Computation via Synchronized Filter Engine
  const leads = useMemo(() => leadsPage?.content || [], [leadsPage]);
  const bookings = useMemo(() => bookingsPage?.content || [], [bookingsPage]);
  const followUps = useMemo(() => followUpsPage?.content || [], [followUpsPage]);

  const dashboardData = useMemo(() => {
    return computeDashboardData(
      leads,
      bookings,
      units,
      followUps,
      projects,
      salesAgents,
      filterState,
      dateBounds
    );
  }, [leads, bookings, units, followUps, projects, salesAgents, filterState, dateBounds]);

  const handleResetFilters = () => {
    setDatePreset('YTD');
    setSelectedProjectId('ALL');
    setSelectedAgentId('ALL');
  };

  const isFilterActive =
    datePreset !== 'YTD' || selectedProjectId !== 'ALL' || selectedAgentId !== 'ALL';

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (isError) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-subtle text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Failed to load live dashboard metrics
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
          Please verify that the Spring Boot backend service is running on port 8080.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            refetchLeads();
            refetchBookings();
            refetchUnits();
            refetchFollowUps();
          }}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  // Selected project name for display
  const selectedProjectName =
    selectedProjectId === 'ALL'
      ? 'All Property Developments'
      : projects.find((p) => String(p.id) === selectedProjectId)?.name || 'Selected Project';

  // Selected agent name for display
  const selectedAgentName =
    selectedAgentId === 'ALL'
      ? 'All Sales Representatives'
      : salesAgents.find((a) => String(a.id) === selectedAgentId)?.name || 'Selected Agent';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <PageHeader
        title="Executive Dashboard"
        description="Real-time pipeline metrics, inventory status, conversion velocity, and sales revenue realization."
        breadcrumbs={[]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={() => navigate('/leads/new')}>
              + Create Lead
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate('/bookings/new')}>
              + New Reservation
            </Button>
          </div>
        }
      />

      {/* Global Filter Toolbar */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Dashboard Scopes & Filters</span>
            {isFilterActive && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                Filtered Scope
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Date Range Dropdown */}
            <div className="relative">
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                aria-label="Select date range filter"
              >
                <option value="TODAY">Today</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="QTD">Quarter to Date</option>
                <option value="YTD">Year to Date (YTD)</option>
                <option value="PREVIOUS_YEAR">Previous Year</option>
                <option value="ALL_TIME">All Time</option>
                <option value="CUSTOM">Custom Date Range...</option>
              </select>
            </div>

            {/* 2. Property Development Filter Dropdown */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium max-w-[200px] truncate"
              aria-label="Filter by property development"
            >
              <option value="ALL">All Property Developments</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* 3. Sales Representative Filter Dropdown */}
            {isAdmin ? (
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium max-w-[200px] truncate"
                aria-label="Filter by sales representative"
              >
                <option value="ALL">All Sales Representatives</option>
                {salesAgents.map((ag) => (
                  <option key={ag.id} value={String(ag.id)}>
                    {ag.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                Agent: {user?.name}
              </span>
            )}

            {/* Reset Filters Action Button */}
            {isFilterActive && (
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={handleResetFilters}
                className="text-rose-600 dark:text-rose-400 hover:border-rose-300"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Custom Date Range Picker Row (Only visible when CUSTOM is chosen) */}
        {datePreset === 'CUSTOM' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-start-date" className="text-slate-500">From:</label>
              <input
                id="custom-start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-end-date" className="text-slate-500">To:</label>
              <input
                id="custom-end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>
            {!dateBounds.isValid && (
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>{dateBounds.errorMessage || 'Invalid date range'}</span>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Scope Summary Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-400 dark:text-slate-500">Active Scope:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
            📅 {dateBounds.formattedLabel}
          </span>
          {selectedProjectId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-800 text-[11px]">
              🏢 {selectedProjectName}
              <button
                type="button"
                onClick={() => setSelectedProjectId('ALL')}
                className="hover:text-brand-900 dark:hover:text-white"
                title="Clear project filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedAgentId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 text-[11px]">
              👤 {selectedAgentName}
              <button
                type="button"
                onClick={() => setSelectedAgentId('ALL')}
                className="hover:text-purple-900 dark:hover:text-white"
                title="Clear agent filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* 1. Primary Interactive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Leads"
              value={dashboardData.totalLeads}
              subtitle="View filtered pipeline"
              icon={Users}
              variant="indigo"
              onClick={() => navigate('/leads')}
            />
            <StatCard
              title="New Inquiries"
              value={dashboardData.newLeads}
              subtitle="Filter Stage: New"
              icon={Clock}
              variant="blue"
              onClick={() => navigate('/leads?stage=NEW')}
            />
            <StatCard
              title="Contacted"
              value={dashboardData.contactedLeads}
              subtitle="Filter Stage: Contacted"
              icon={Phone}
              variant="amber"
              onClick={() => navigate('/leads?stage=CONTACTED')}
            />
            <StatCard
              title="Site Visits"
              value={dashboardData.siteVisitsScheduled}
              subtitle="Filter Stage: Site Visit"
              icon={Calendar}
              variant="purple"
              onClick={() => navigate('/leads?stage=SITE_VISIT')}
            />
            <StatCard
              title="Conversions"
              value={dashboardData.conversionsCount}
              subtitle="Confirmed agreements"
              icon={CheckCircle2}
              variant="emerald"
              onClick={() => navigate('/bookings')}
            />
            <StatCard
              title="Overdue Tasks"
              value={dashboardData.overdueTasksCount}
              subtitle="Needs immediate action"
              icon={AlertCircle}
              variant={dashboardData.overdueTasksCount > 0 ? 'rose' : 'slate'}
              onClick={() => navigate('/follow-ups')}
            />
          </>
        )}
      </div>

      {/* 2. Secondary Financial & Realization Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Booked Revenue"
          value={formatCurrency(dashboardData.totalBookingRevenue)}
          subtitle={
            dashboardData.priorPeriodRevenue > 0
              ? `${dashboardData.revenueGrowthPct >= 0 ? '+' : ''}${dashboardData.revenueGrowthPct}% vs prior period (${dashboardData.conversionsCount} deals)`
              : `${dashboardData.conversionsCount} confirmed agreements in scope`
          }
          icon={DollarSign}
          variant="emerald"
          onClick={() => navigate('/bookings')}
        />
        <StatCard
          title="Available Inventory"
          value={dashboardData.availableUnitsCount}
          subtitle={
            selectedProjectId !== 'ALL'
              ? `In ${selectedProjectName}`
              : `${dashboardData.inventoryStatusDonut[0]?.percentage || 0}% of total property portfolio`
          }
          icon={Home}
          variant="blue"
          onClick={() =>
            navigate(
              selectedProjectId !== 'ALL'
                ? `/units?status=AVAILABLE&projectId=${selectedProjectId}`
                : '/units?status=AVAILABLE'
            )
          }
        />
        <StatCard
          title="Follow-ups Due Today"
          value={dashboardData.dueTodayTasksCount}
          subtitle={`${dashboardData.overdueTasksCount} overdue reminders in scope`}
          icon={CalendarClock}
          variant="amber"
          onClick={() => navigate('/follow-ups')}
        />
      </div>

      {/* 3. Conversion Funnel Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-none">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Contacted
          </span>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {dashboardData.contactedLeads}
          </p>
        </div>
        <div className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-none">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Site Visits
          </span>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">
            {dashboardData.siteVisitsScheduled}
          </p>
        </div>
        <div className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-none">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Negotiation
          </span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {dashboardData.negotiationLeads}
          </p>
        </div>
        <div className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-none">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Booked Deals
          </span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {dashboardData.conversionsCount}
          </p>
        </div>
        <div className="p-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Lost / Inactive
          </span>
          <p className="text-xl font-bold text-slate-500 dark:text-slate-400 mt-1">
            {dashboardData.lostLeads}
          </p>
        </div>
      </div>

      {/* 4. Row 1 Charts: Funnel Stage + Source Acquisition Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Funnel Stage Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Leads by Sales Funnel Stage
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Prospect distribution across all 7 pipeline stages ({dashboardData.totalLeads} total in scope)
                </p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart
                  data={dashboardData.stageChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 11, fill: axisTickColor }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: axisTickColor }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(val: any) => [`${val} prospects`, 'Volume']}
                  />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Funnel Conversion & Drop-off Flow */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
              {dashboardData.funnelStages.map((st, idx) => (
                <button
                  key={st.stage}
                  type="button"
                  onClick={() => navigate(st.linkUrl)}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 hover:bg-brand-50 dark:hover:bg-brand-950/60 border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 text-left transition-all group"
                  title={`Filter leads by stage: ${st.label}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      {st.label}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 font-mono">
                      {st.count}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {st.stageConversionPct}% conv
                    </span>
                  </div>
                  {idx > 0 && st.dropOffPct > 0 && (
                    <div className="flex items-center gap-0.5 text-[9px] text-rose-500 font-medium mt-0.5">
                      <ArrowDownRight className="w-2.5 h-2.5" />
                      <span>{st.dropOffPct}% drop-off</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Lead Acquisition by Source (Pie Chart with Readability Audit) */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Lead Acquisition Channels
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Campaign & attribution share ({dashboardData.totalLeads} total leads)
            </p>

            {dashboardData.sourceChartData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <PieChart>
                    <Pie
                      data={dashboardData.sourceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      stroke={sliceStroke}
                      strokeWidth={2}
                    >
                      {dashboardData.sourceChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={sourceColors[index % sourceColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0];
                          const total = dashboardData.sourceChartData.reduce(
                            (acc, curr) => acc + curr.value,
                            0
                          );
                          const pct =
                            total > 0
                              ? ((Number(item.value) / total) * 100).toFixed(1)
                              : '0';
                          return (
                            <div className="bg-slate-900 dark:bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: item.payload?.fill || item.color,
                                  }}
                                />
                                <span className="font-bold text-white">{item.name}</span>
                              </div>
                              <div className="text-slate-300 flex justify-between gap-4">
                                <span>Acquisitions:</span>
                                <span className="font-mono font-bold text-white">
                                  {item.value}
                                </span>
                              </div>
                              <div className="text-slate-300 flex justify-between gap-4">
                                <span>Share:</span>
                                <span className="font-mono font-bold text-brand-400">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                <PieIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No lead acquisitions in this scope
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Try adjusting the date range or project filter.
                </p>
              </div>
            )}
          </div>

          {/* Theme-Aware Readable Legend with Percentages */}
          {dashboardData.sourceChartData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              {dashboardData.sourceChartData.map((item, idx) => {
                const total = dashboardData.sourceChartData.reduce(
                  (acc, curr) => acc + curr.value,
                  0
                );
                const pct =
                  total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-1 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: sourceColors[idx % sourceColors.length],
                        }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 flex-shrink-0">
                      {item.value}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Row 2 Charts: Monthly Revenue + Project-wise Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Monthly Gross Revenue Realization */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Monthly Revenue & Settlement Velocity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total agreed contract value in escrow / confirmed agreements
                </p>
              </div>
            </div>

            {dashboardData.monthlyRevenueData.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <AreaChart
                    data={dashboardData.monthlyRevenueData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisTickColor }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: axisTickColor }}
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Gross Revenue']}
                      contentStyle={tooltipContentStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6">
                <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No booked revenue recorded in this period
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Confirm agreements in the Reservation Wizard to populate revenue velocity.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Project-Wise Unit Status Breakdown */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Project-Wise Unit Status Breakdown
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inventory allocation across master developments
                </p>
              </div>
            </div>

            {dashboardData.projectAvailabilityData.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart
                    data={dashboardData.projectAvailabilityData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisTickColor }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: axisTickColor }}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipContentStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Available" fill="#3B82F6" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Reserved" fill="#F59E0B" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Booked" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6">
                <Building className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No property units match this project selection
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase 3 Advanced Real Estate Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Conversion Benchmark Gauge */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Pipeline Win Rate vs. Target
              </h2>
              {(() => {
                const isTargetMet = dashboardData.conversionGauge.actualRate >= dashboardData.conversionGauge.targetRate;
                return (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isTargetMet
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    }`}
                  >
                    {isTargetMet ? 'Target Achieved' : `${dashboardData.conversionGauge.deltaVsTarget}% vs Target`}
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Realized conversions against enterprise 20% benchmark
            </p>

            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {dashboardData.conversionGauge.actualRate}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                  ({dashboardData.conversionGauge.numerator} / {dashboardData.conversionGauge.denominator} prospects)
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Target: {dashboardData.conversionGauge.targetRate}%
              </span>
            </div>

            {/* Gauge meter progress bar */}
            <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  dashboardData.conversionGauge.actualRate >= dashboardData.conversionGauge.targetRate
                    ? 'bg-emerald-500'
                    : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(100, (dashboardData.conversionGauge.actualRate / 30) * 100)}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                style={{ left: `${(20 / 30) * 100}%` }}
                title="20% Benchmark Target"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Benchmark target: 20.0%</span>
            <Link to="/leads?stage=BOOKED" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              View Booked Deals &rarr;
            </Link>
          </div>
        </div>

        {/* Card 2: Prospect Budget Distribution */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Prospect Budget Distribution
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Prospect purchasing power across 5 value brackets
            </p>

            <div className="space-y-2">
              {dashboardData.budgetDistribution.map((bracket) => (
                <button
                  key={bracket.key}
                  type="button"
                  onClick={() => navigate(bracket.linkUrl)}
                  className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {bracket.rangeLabel}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100">
                      {bracket.count} ({bracket.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full transition-all duration-500 group-hover:bg-brand-600"
                      style={{ width: `${bracket.percentage}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
            <Link to="/leads" className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Filter Leads by Price &rarr;
            </Link>
          </div>
        </div>

        {/* Card 3: Inventory Absorption Status */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Inventory Absorption Status
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Unit allocation and commitment ratio
            </p>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={dashboardData.inventoryStatusDonut}
                    cx="50%"
                    cy="50%"
                    outerRadius={56}
                    innerRadius={36}
                    paddingAngle={3}
                    dataKey="count"
                    stroke={sliceStroke}
                    strokeWidth={2}
                  >
                    {dashboardData.inventoryStatusDonut.map((item, index) => (
                      <Cell key={`inv-donut-${index}`} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipContentStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {dashboardData.inventoryStatusDonut.map((item) => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => navigate(`/properties?status=${item.status}`)}
                  className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
            <Link to="/properties" className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Manage Inventory &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Row 3 Charts: Follow-Up Compliance + Agent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 5: Follow-Up & Task Compliance (Pie Chart with Readability Audit) */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Follow-up & Task Compliance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Task execution vs. overdue reminders
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={dashboardData.followUpComplianceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    stroke={sliceStroke}
                    strokeWidth={2}
                  >
                    {dashboardData.followUpComplianceData.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        const total = dashboardData.followUpComplianceData.reduce(
                          (acc, curr) => acc + curr.value,
                          0
                        );
                        const pct =
                          total > 0
                            ? ((Number(item.value) / total) * 100).toFixed(1)
                            : '0';
                        return (
                          <div className="bg-slate-900 dark:bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: item.payload?.color || item.color,
                                }}
                              />
                              <span className="font-bold text-white">{item.name}</span>
                            </div>
                            <div className="text-slate-300 flex justify-between gap-4">
                              <span>Tasks:</span>
                              <span className="font-mono font-bold text-white">
                                {item.value}
                              </span>
                            </div>
                            <div className="text-slate-300 flex justify-between gap-4">
                              <span>Ratio:</span>
                              <span className="font-mono font-bold text-purple-400">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* High-Contrast Legend */}
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {dashboardData.followUpComplianceData.map((item) => (
                <div key={item.name} className="text-center p-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full mb-1"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Pipeline Win Rate:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {dashboardData.conversionRate}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, dashboardData.conversionRate * 3)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chart 6: Sales Representative Leaderboard */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Sales Team Performance & Closed Volume
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Agreements secured and transaction volume by representative
                </p>
              </div>
              {isAdmin && (
                <Link
                  to="/employees"
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Manage Staff
                </Link>
              )}
            </div>

            {dashboardData.agentPerformanceData.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart
                    layout="vertical"
                    data={dashboardData.agentPerformanceData}
                    margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: axisTickColor }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: axisTickColor }}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === 'Revenue' ? formatCurrency(Number(val)) : `${val} agreements`,
                        name === 'Revenue' ? 'Volume' : 'Closed Deals',
                      ]}
                      contentStyle={tooltipContentStyle}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                    <Bar dataKey="Deals" fill="#6366F1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6">
                <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No sales representatives match this filter
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Follow-Up Execution Heatmap (14-Day Velocity) */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              14-Day Consultation & Follow-Up Execution Heatmap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily customer engagement intensity, completed tasks and overdue alert monitoring
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Intensity:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" title="0 tasks" />
              <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/60" title="1-2 tasks" />
              <span className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-800" title="3-4 tasks" />
              <span className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-600" title="5-6 tasks" />
              <span className="w-3 h-3 rounded bg-emerald-600 dark:bg-emerald-500" title="7+ tasks" />
            </div>
            <Link
              to="/follow-ups"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              All Tasks
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-2">
          {dashboardData.followUpHeatmap.map((day) => {
            const intensityBg =
              day.intensity === 0
                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                : day.intensity === 1
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                : day.intensity === 2
                ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : day.intensity === 3
                ? 'bg-emerald-200 dark:bg-emerald-800/60 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                : 'bg-emerald-300 dark:bg-emerald-700/80 border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-white font-bold';

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => navigate(day.linkUrl)}
                className={`p-2.5 rounded-lg border text-left transition-all hover:scale-105 hover:shadow-xs group flex flex-col justify-between ${intensityBg}`}
                title={`${day.dayLabel}: ${day.completed} completed, ${day.pending} pending (${day.overdue} overdue)`}
              >
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    {day.shortDay}
                  </span>
                  <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {day.dayLabel}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                    {day.total}
                  </span>
                  {day.overdue > 0 ? (
                    <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">
                      {day.overdue} due
                    </span>
                  ) : day.completed > 0 ? (
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {day.completed}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. Feeds: Recent Leads + Interactive Activity & Milestone Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads Feed */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Recently Acquired Leads
            </h2>
            <Link
              to="/leads"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-x-auto">
            {dashboardData.recentLeads.length > 0 ? (
              dashboardData.recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/leads/${lead.id}`}
                      className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 block truncate"
                    >
                      {lead.fullName}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {lead.leadCode} • {lead.phone}{' '}
                      {lead.interestedProjectName && `• ${lead.interestedProjectName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={lead.stage} />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No leads recorded in this filter scope.
              </p>
            )}
          </div>
        </div>

        {/* Interactive Activity & Milestone Timeline Feed */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Activity Feed & Transaction Milestones
            </h2>
            <Link
              to="/activities"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
            >
              Full Feed <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-x-auto">
            {dashboardData.activityTimelineItems.length > 0 ? (
              dashboardData.activityTimelineItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  onClick={() => navigate(item.linkUrl)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          item.type === 'BOOKING'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : item.type === 'SITE_VISIT'
                            ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        }`}
                      >
                        {item.type}
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {item.title}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.description} {item.agentName && `• Rep: ${item.agentName}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-mono font-semibold text-brand-600 dark:text-brand-400 block">
                      {item.formattedTime}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'OVERDUE'
                          ? 'text-rose-500'
                          : item.status === 'COMPLETED' || item.status === 'CONFIRMED'
                          ? 'text-emerald-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No recent activity recorded in this filter scope.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
