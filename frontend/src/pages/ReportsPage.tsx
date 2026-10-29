import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projectsApi';
import { unitsApi } from '../api/unitsApi';
import { employeesApi } from '../api/employeesApi';
import { leadsApi } from '../api/leadsApi';
import { bookingsApi } from '../api/bookingsApi';
import { followUpsApi } from '../api/followUpsApi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Building,
  CheckCircle2,
  Clock,
  PieChart as PieIcon,
  ShieldCheck,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Target,
  ArrowDownRight,
  Layers,
  Award,
  CalendarClock,
  Home,
  CheckSquare,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { PageHeader } from '../components/common/PageHeader';
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
  Line,
} from 'recharts';
import {
  DatePreset,
  DashboardFilterState,
  calculateDateBounds,
  computeDashboardData,
  formatDateToInput,
} from '../utils/dashboardFilters';
import { exportToCsv } from '../utils/csvExport';

type AnalyticsTab =
  | 'funnel'
  | 'revenue'
  | 'inventory'
  | 'agents'
  | 'sources'
  | 'heatmap';

export const ReportsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // 1. Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('YTD');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return formatDateToInput(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() =>
    formatDateToInput(new Date())
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('funnel');

  // Date Boundaries Calculation
  const dateBounds = useMemo(() => {
    return calculateDateBounds(datePreset, customStartDate, customEndDate);
  }, [datePreset, customStartDate, customEndDate]);

  // Unified Filter State
  const filterState: DashboardFilterState = useMemo(
    () => ({
      datePreset,
      customStartDate,
      customEndDate,
      projectId: selectedProjectId,
      agentId: selectedAgentId,
    }),
    [datePreset, customStartDate, customEndDate, selectedProjectId, selectedAgentId]
  );

  // Theme Tokens (WCAG AA Compliance)
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

  // Queries
  const { data: leadsPage, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['reports-all-leads'],
    queryFn: () => leadsApi.getLeads({ size: 1000 }),
  });

  const { data: bookingsPage, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['reports-all-bookings'],
    queryFn: () => bookingsApi.getBookings({ size: 1000 }),
  });

  const { data: units = [], isLoading: isUnitsLoading } = useQuery({
    queryKey: ['reports-units'],
    queryFn: () => unitsApi.getUnits({}),
  });

  const { data: followUpsPage, isLoading: isFollowUpsLoading } = useQuery({
    queryKey: ['reports-all-followups'],
    queryFn: () => followUpsApi.getFollowUps({ size: 1000 }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['reports-projects'],
    queryFn: projectsApi.getProjects,
  });

  const { data: salesAgents = [] } = useQuery({
    queryKey: ['reports-sales-agents'],
    queryFn: employeesApi.getSalesEmployees,
  });

  const isLoading =
    isLeadsLoading || isBookingsLoading || isUnitsLoading || isFollowUpsLoading;

  // Reactive Analytics Engine
  const leads = useMemo(() => leadsPage?.content || [], [leadsPage]);
  const bookings = useMemo(() => bookingsPage?.content || [], [bookingsPage]);
  const followUps = useMemo(() => followUpsPage?.content || [], [followUpsPage]);

  const analytics = useMemo(() => {
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

  const handleExportCsv = () => {
    if (activeTab === 'funnel') {
      exportToCsv(
        'sales-funnel-report',
        analytics.funnelStages,
        [
          { key: 'label', label: 'Stage Name' },
          { key: 'count', label: 'Lead Count' },
          { key: 'stageConversionPct', label: 'Stage Conversion %' },
          { key: 'dropOffPct', label: 'Drop-off %' },
          { key: 'cumulativeConversionPct', label: 'Cumulative Win %' },
        ]
      );
    } else if (activeTab === 'revenue') {
      exportToCsv(
        'monthly-revenue-report',
        analytics.monthlyRevenueData,
        [
          { key: 'month', label: 'Month' },
          { key: 'count', label: 'Booked Agreements' },
          { key: 'revenue', label: 'Gross Revenue (USD)' },
        ]
      );
    } else if (activeTab === 'agents') {
      exportToCsv(
        'agent-performance-report',
        analytics.agentDetailedPerformance,
        [
          { key: 'fullName', label: 'Sales Representative' },
          { key: 'assignedLeads', label: 'Assigned Leads' },
          { key: 'qualifiedLeads', label: 'Qualified Interest' },
          { key: 'siteVisits', label: 'Site Visits Scheduled' },
          { key: 'conversions', label: 'Deals Closed' },
          { key: 'revenue', label: 'Total Revenue (USD)' },
          { key: 'conversionRate', label: 'Closing Rate %' },
        ]
      );
    } else if (activeTab === 'sources') {
      exportToCsv(
        'lead-sources-report',
        analytics.sourceAnalyticsDetailed,
        [
          { key: 'label', label: 'Marketing Channel' },
          { key: 'count', label: 'Lead Volume' },
          { key: 'percentage', label: 'Channel Share %' },
          { key: 'conversions', label: 'Confirmed Agreements' },
          { key: 'conversionRate', label: 'Conversion Rate %' },
        ]
      );
    } else {
      exportToCsv(
        'inventory-status-report',
        analytics.inventoryStatusDonut,
        [
          { key: 'label', label: 'Inventory Status' },
          { key: 'count', label: 'Unit Count' },
          { key: 'percentage', label: 'Portfolio Share %' },
        ]
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <PageHeader
        title="Business Intelligence & Analytics"
        description="Comprehensive audit of conversion velocity, pipeline efficiency, lead source efficacy, and gross settled property revenue."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print / Save PDF
            </Button>
          </div>
        }
      />

      {/* Global Filter Toolbar */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Analytics Filters & Scope</span>
            {isFilterActive && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                Active Filter
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Preset */}
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              aria-label="Date Range Preset"
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

            {/* Property Project */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium max-w-[200px] truncate"
              aria-label="Filter by project"
            >
              <option value="ALL">All Property Developments</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Sales Representative */}
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

        {/* Custom Date Pickers */}
        {datePreset === 'CUSTOM' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Custom Date Boundaries:
            </span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 font-mono text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 font-mono text-xs"
            />
          </div>
        )}

        {/* Active Scope Summary */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-400">Active Scope:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
            📅 {dateBounds.formattedLabel}
          </span>
        </div>
      </div>

      {/* High-Level Conversion KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Total Pipeline Inquiries
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {analytics.totalLeads}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Prospects active in this period
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Closing Efficiency Rate
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {analytics.conversionRate}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {analytics.conversionsCount} confirmed sales agreements
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Gross Settled Revenue
          </span>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">
            {formatCurrency(analytics.totalBookingRevenue)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {analytics.priorPeriodRevenue > 0
              ? `${analytics.revenueGrowthPct >= 0 ? '+' : ''}${analytics.revenueGrowthPct}% vs prior period`
              : 'Confirmed agreements in escrow'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Available Inventory
          </span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {analytics.availableUnitsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Uncontracted units ready for reservation
          </p>
        </div>
      </div>

      {/* Analytics Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-px">
        {[
          { key: 'funnel', label: '1. Sales Funnel & Conversion', icon: BarChart3 },
          { key: 'revenue', label: '2. Revenue & Transactions', icon: TrendingUp },
          { key: 'inventory', label: '3. Inventory Absorption', icon: Home },
          { key: 'agents', label: '4. Sales Representative Matrix', icon: Award },
          { key: 'sources', label: '5. Marketing Sources & Budgets', icon: PieIcon },
          { key: 'heatmap', label: '6. Activity Execution Heatmap', icon: CalendarClock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as AnalyticsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sales Funnel & Conversion */}
      {activeTab === 'funnel' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Pipeline Conversion Funnel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Prospect volume progression and drop-off across all 6 sequential sales stages
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart
                    data={analytics.stageChartData}
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
                    <Tooltip contentStyle={tooltipContentStyle} />
                    <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Benchmark Win Rate Gauge */}
            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Target Benchmark Gauge
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Closing win rate against standard developer target (20%)
                </p>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Actual Win Rate
                      </span>
                      <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                        {analytics.conversionGauge.actualRate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Closed Ratio
                      </span>
                      <p className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">
                        {analytics.conversionsCount} / {analytics.totalLeads} leads
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden relative">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (analytics.conversionGauge.actualRate / 30) * 100)}%`,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                      style={{ left: `${(20 / 30) * 100}%` }}
                      title="20% Target"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed italic border-t border-slate-100 dark:border-slate-800 pt-2">
                {analytics.conversionGauge.accessibleSummary}
              </p>
            </div>
          </div>

          {/* Interactive Funnel Table with Drop-off % */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Funnel Stage Progression & Conversion Efficiency
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Sales Stage</th>
                    <th className="px-4 py-3">Inquiry Count</th>
                    <th className="px-4 py-3">Stage Conversion %</th>
                    <th className="px-4 py-3">Drop-off Rate %</th>
                    <th className="px-4 py-3">Share of Pipeline</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analytics.funnelStages.map((st) => (
                    <tr
                      key={st.stage}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: st.color }}
                        />
                        {st.label}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">{st.count}</td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                        {st.stageConversionPct}%
                      </td>
                      <td className="px-4 py-3 text-rose-500 font-semibold font-mono">
                        {st.dropOffPct > 0 ? `-${st.dropOffPct}%` : '0%'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {st.cumulativeConversionPct}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(st.linkUrl)}
                        >
                          View Leads →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Revenue & Transactions */}
      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Monthly Gross Transaction Realization
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Contract value locked in escrow across confirmed reservations
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <AreaChart
                  data={analytics.monthlyRevenueData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevReport" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Total Revenue']}
                    contentStyle={tooltipContentStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevReport)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory Absorption */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Portfolio Status Allocation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Available, Reserved, Booked, and Unavailable unit allocation
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <PieChart>
                    <Pie
                      data={analytics.inventoryStatusDonut}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={3}
                      dataKey="count"
                      stroke={sliceStroke}
                      strokeWidth={2}
                    >
                      {analytics.inventoryStatusDonut.map((item, index) => (
                        <Cell key={`rep-unit-${index}`} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipContentStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Project-Wise Inventory Stack
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Availability comparison across master developments
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart
                    data={analytics.projectAvailabilityData}
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
                    <Bar dataKey="Available" fill="#3B82F6" stackId="a" />
                    <Bar dataKey="Reserved" fill="#F59E0B" stackId="a" />
                    <Bar dataKey="Booked" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Sales Representative Matrix */}
      {activeTab === 'agents' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Sales Representative Performance Matrix
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Representative</th>
                    <th className="px-4 py-3">Assigned Leads</th>
                    <th className="px-4 py-3">Qualified Leads</th>
                    <th className="px-4 py-3">Site Visits</th>
                    <th className="px-4 py-3">Deals Closed</th>
                    <th className="px-4 py-3">Closed Revenue</th>
                    <th className="px-4 py-3">Closing Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analytics.agentDetailedPerformance.map((ag) => (
                    <tr
                      key={ag.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {ag.fullName}
                      </td>
                      <td className="px-4 py-3 font-mono">{ag.assignedLeads}</td>
                      <td className="px-4 py-3 font-mono">{ag.qualifiedLeads}</td>
                      <td className="px-4 py-3 font-mono">{ag.siteVisits}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ag.conversions}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        {formatCurrency(ag.revenue)}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-brand-600 dark:text-brand-400">
                        {ag.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Marketing Sources & Budgets */}
      {activeTab === 'sources' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Marketing Channel Attribution
              </h2>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <PieChart>
                    <Pie
                      data={analytics.sourceAnalyticsDetailed}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={3}
                      dataKey="count"
                      stroke={sliceStroke}
                      strokeWidth={2}
                    >
                      {analytics.sourceAnalyticsDetailed.map((item, index) => (
                        <Cell key={`src-cell-${index}`} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipContentStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Lead Budget Distribution
              </h2>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart
                    data={analytics.budgetDistribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis
                      dataKey="rangeLabel"
                      tick={{ fontSize: 10, fill: axisTickColor }}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: axisTickColor }}
                      allowDecimals={false}
                    />
                    <Tooltip contentStyle={tooltipContentStyle} />
                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Activity Execution Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              14-Day Consultation Execution Heatmap
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-2 mt-4">
              {analytics.followUpHeatmap.map((day) => {
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
        </div>
      )}
    </div>
  );
};
