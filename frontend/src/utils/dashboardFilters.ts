import { Lead, Booking, PropertyUnit, FollowUp, LeadStage, LeadSource } from '../types';

export type DatePreset =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'QTD'
  | 'YTD'
  | 'PREVIOUS_YEAR'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface DateFilterRange {
  preset: DatePreset;
  startDate: Date | null;
  endDate: Date | null;
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string;   // YYYY-MM-DD
  formattedLabel: string;
}

export interface DashboardFilterState {
  datePreset: DatePreset;
  customStartDate: string;
  customEndDate: string;
  projectId: string; // 'ALL' or string id
  agentId: string;   // 'ALL' or string id
}

/**
 * Helper to compute local midnight (00:00:00.000) for a given date.
 */
export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Helper to compute local end of day (23:59:59.999) for a given date.
 */
export const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Formats a Date object to local YYYY-MM-DD string for input[type="date"]
 */
export const formatDateToInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a Date object to readable human string, e.g. "Oct 29, 2026"
 */
export const formatHumanDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Calculates start and end Date boundaries for each supported preset.
 */
export const calculateDateBounds = (
  preset: DatePreset,
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date()
): { startDate: Date | null; endDate: Date | null; formattedLabel: string; isValid: boolean; errorMessage?: string } => {
  const now = referenceDate;
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (preset) {
    case 'TODAY':
      return {
        startDate: todayStart,
        endDate: todayEnd,
        formattedLabel: `${formatHumanDate(todayStart)} (Today)`,
        isValid: true,
      };

    case 'LAST_7_DAYS': {
      const past = new Date(todayStart);
      past.setDate(past.getDate() - 6);
      return {
        startDate: past,
        endDate: todayEnd,
        formattedLabel: `${formatHumanDate(past)} – ${formatHumanDate(todayEnd)} (Last 7 Days)`,
        isValid: true,
      };
    }

    case 'LAST_30_DAYS': {
      const past = new Date(todayStart);
      past.setDate(past.getDate() - 29);
      return {
        startDate: past,
        endDate: todayEnd,
        formattedLabel: `${formatHumanDate(past)} – ${formatHumanDate(todayEnd)} (Last 30 Days)`,
        isValid: true,
      };
    }

    case 'THIS_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return {
        startDate: start,
        endDate: todayEnd,
        formattedLabel: `${formatHumanDate(start)} – ${formatHumanDate(todayEnd)} (This Month)`,
        isValid: true,
      };
    }

    case 'LAST_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        formattedLabel: `${formatHumanDate(start)} – ${formatHumanDate(end)} (Last Month)`,
        isValid: true,
      };
    }

    case 'QTD': {
      // Current Quarter start month: Q1: 0 (Jan), Q2: 3 (Apr), Q3: 6 (Jul), Q4: 9 (Oct)
      const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), currentQuarterStartMonth, 1, 0, 0, 0, 0);
      const qNum = Math.floor(now.getMonth() / 3) + 1;
      return {
        startDate: start,
        endDate: todayEnd,
        formattedLabel: `${formatHumanDate(start)} – ${formatHumanDate(todayEnd)} (Q${qNum} to Date)`,
        isValid: true,
      };
    }

    case 'YTD': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return {
        startDate: start,
        endDate: todayEnd,
        formattedLabel: `${formatHumanDate(start)} – ${formatHumanDate(todayEnd)} (Year to Date)`,
        isValid: true,
      };
    }

    case 'PREVIOUS_YEAR': {
      const start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        formattedLabel: `${formatHumanDate(start)} – ${formatHumanDate(end)} (Previous Year ${now.getFullYear() - 1})`,
        isValid: true,
      };
    }

    case 'ALL_TIME':
      return {
        startDate: null,
        endDate: null,
        formattedLabel: 'All Recorded Time',
        isValid: true,
      };

    case 'CUSTOM': {
      if (!customStart || !customEnd) {
        return {
          startDate: null,
          endDate: null,
          formattedLabel: 'Select custom start and end dates',
          isValid: false,
          errorMessage: 'Both start and end dates are required for custom range.',
        };
      }

      const s = startOfDay(new Date(customStart + 'T00:00:00'));
      const e = endOfDay(new Date(customEnd + 'T23:59:59'));

      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return {
          startDate: null,
          endDate: null,
          formattedLabel: 'Invalid date selection',
          isValid: false,
          errorMessage: 'Invalid date format entered.',
        };
      }

      if (s > e) {
        return {
          startDate: s,
          endDate: e,
          formattedLabel: 'Invalid range: Start date cannot be after End date',
          isValid: false,
          errorMessage: 'Start date cannot be after end date.',
        };
      }

      return {
        startDate: s,
        endDate: e,
        formattedLabel: `${formatHumanDate(s)} – ${formatHumanDate(e)} (Custom Range)`,
        isValid: true,
      };
    }

    default:
      return {
        startDate: null,
        endDate: null,
        formattedLabel: 'All Time',
        isValid: true,
      };
  }
};

/**
 * Checks if a timestamp falls within [startDate, endDate] inclusive.
 */
export const isDateInRange = (
  dateStr: string | null | undefined,
  startDate: Date | null,
  endDate: Date | null
): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  if (startDate && d < startDate) return false;
  if (endDate && d > endDate) return false;
  return true;
};

export interface FunnelStageData {
  stage: LeadStage;
  label: string;
  count: number;
  stageConversionPct: number;
  dropOffPct: number;
  cumulativeConversionPct: number;
  color: string;
  linkUrl: string;
}

export interface InventoryStatusData {
  status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'UNAVAILABLE';
  label: string;
  count: number;
  percentage: number;
  color: string;
  linkUrl: string;
}

export interface AgentDetailedPerformance {
  id: number;
  name: string;
  fullName: string;
  assignedLeads: number;
  qualifiedLeads: number;
  siteVisits: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export interface SourceAnalyticsDetailed {
  source: string;
  label: string;
  count: number;
  percentage: number;
  conversions: number;
  conversionRate: number;
  color: string;
  linkUrl: string;
}

export interface FollowUpDailyHeatmap {
  dateStr: string;
  dayLabel: string;
  shortDay: string;
  completed: number;
  pending: number;
  overdue: number;
  total: number;
  intensity: number;
  linkUrl: string;
}

export interface ConversionGaugeData {
  actualRate: number;
  targetRate: number;
  numerator: number;
  denominator: number;
  deltaVsTarget: number;
  accessibleSummary: string;
}

export interface BudgetDistributionData {
  key: string;
  rangeLabel: string;
  minBudget: number;
  maxBudget: number;
  count: number;
  percentage: number;
  linkUrl: string;
}

export interface ActivityTimelineItem {
  id: string;
  title: string;
  description: string;
  type: 'SITE_VISIT' | 'CALLBACK' | 'FOLLOW_UP' | 'MILESTONE' | 'NOTE' | 'BOOKING';
  timestamp: string;
  formattedTime: string;
  leadId?: number;
  leadName?: string;
  agentName?: string;
  status: string;
  linkUrl: string;
}

/**
 * Unified Filter Engine applying AND logic across:
 * - Date range
 * - Property development ID
 * - Sales representative ID
 */
export interface FilteredDashboardData {
  filteredLeads: Lead[];
  filteredBookings: Booking[];
  filteredUnits: PropertyUnit[];
  filteredFollowUps: FollowUp[];

  // Computed KPI Metrics
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  siteVisitsScheduled: number;
  negotiationLeads: number;
  conversionsCount: number;
  lostLeads: number;
  totalBookingRevenue: number;
  availableUnitsCount: number;
  overdueTasksCount: number;
  dueTodayTasksCount: number;
  conversionRate: number;

  // Comparison Metrics
  priorPeriodRevenue: number;
  priorPeriodBookings: number;
  revenueGrowthPct: number;

  // Chart datasets
  stageChartData: { stage: string; count: number }[];
  sourceChartData: { name: string; value: number }[];
  monthlyRevenueData: { month: string; count: number; revenue: number }[];
  projectAvailabilityData: {
    name: string;
    fullName: string;
    Available: number;
    Reserved: number;
    Booked: number;
  }[];
  followUpComplianceData: { name: string; value: number; color: string }[];
  agentPerformanceData: {
    name: string;
    fullName: string;
    Deals: number;
    Revenue: number;
    Leads: number;
  }[];

  // Advanced Real Estate Analytics (Phase 3)
  funnelStages: FunnelStageData[];
  inventoryStatusDonut: InventoryStatusData[];
  agentDetailedPerformance: AgentDetailedPerformance[];
  sourceAnalyticsDetailed: SourceAnalyticsDetailed[];
  followUpHeatmap: FollowUpDailyHeatmap[];
  conversionGauge: ConversionGaugeData;
  budgetDistribution: BudgetDistributionData[];
  activityTimelineItems: ActivityTimelineItem[];

  // Feeds
  recentLeads: Lead[];
  upcomingConsultations: FollowUp[];
}

export const computeDashboardData = (
  leads: Lead[],
  bookings: Booking[],
  units: PropertyUnit[],
  followUps: FollowUp[],
  projects: { id: number; name: string }[],
  salesAgents: { id: number; name: string }[],
  filters: DashboardFilterState,
  dateBounds: { startDate: Date | null; endDate: Date | null }
): FilteredDashboardData => {
  const { startDate, endDate } = dateBounds;
  const { projectId, agentId } = filters;
  const now = new Date();

  // Create lookup maps for relationships
  const leadProjectMap = new Map<number, number>();
  leads.forEach((l) => {
    if (l.interestedProjectId) leadProjectMap.set(l.id, l.interestedProjectId);
  });

  // 1. Filter Leads
  const filteredLeads = leads.filter((lead) => {
    // Date filter on lead creation
    if (!isDateInRange(lead.createdAt, startDate, endDate)) return false;

    // Project filter
    if (projectId !== 'ALL' && String(lead.interestedProjectId) !== projectId) return false;

    // Agent filter
    if (agentId !== 'ALL' && String(lead.assignedToId) !== agentId) return false;

    return true;
  });

  // 2. Filter Bookings (Confirmed agreements)
  const filteredBookings = bookings.filter((b) => {
    if (b.status !== 'CONFIRMED') return false;

    // Date filter on booking date
    if (!isDateInRange(b.bookingDate, startDate, endDate)) return false;

    // Project filter
    if (projectId !== 'ALL' && String(b.projectId) !== projectId) return false;

    // Agent filter
    if (agentId !== 'ALL' && String(b.bookedById) !== agentId) return false;

    return true;
  });

  // 3. Filter Units
  const filteredUnits = units.filter((unit) => {
    if (projectId !== 'ALL' && String(unit.projectId) !== projectId) return false;
    return true;
  });

  // 4. Filter Follow-Ups
  const filteredFollowUps = followUps.filter((fu) => {
    // Agent filter
    if (agentId !== 'ALL' && String(fu.assignedToId) !== agentId) return false;

    // Project filter (via associated lead)
    if (projectId !== 'ALL') {
      const associatedProjectId = leadProjectMap.get(fu.leadId);
      if (associatedProjectId && String(associatedProjectId) !== projectId) return false;
    }

    return true;
  });

  // KPI Calculations
  const totalLeads = filteredLeads.length;
  const newLeads = filteredLeads.filter((l) => l.stage === 'NEW').length;
  const contactedLeads = filteredLeads.filter((l) => l.stage === 'CONTACTED').length;
  const siteVisitsScheduled = filteredLeads.filter((l) => l.stage === 'SITE_VISIT').length;
  const negotiationLeads = filteredLeads.filter((l) => l.stage === 'NEGOTIATION').length;
  const lostLeads = filteredLeads.filter((l) => l.stage === 'LOST').length;

  // Conversions: Count of confirmed bookings within scope
  const conversionsCount = filteredBookings.length;
  const totalBookingRevenue = filteredBookings.reduce((sum, b) => sum + (b.agreedPrice || 0), 0);
  const availableUnitsCount = filteredUnits.filter((u) => u.status === 'AVAILABLE').length;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const overdueTasksCount = filteredFollowUps.filter(
    (fu) => fu.status === 'PENDING' && new Date(fu.scheduledAt) < now
  ).length;

  const dueTodayTasksCount = filteredFollowUps.filter(
    (fu) => fu.status === 'PENDING' && new Date(fu.scheduledAt) >= todayStart && new Date(fu.scheduledAt) <= todayEnd
  ).length;

  const conversionRate = totalLeads > 0 ? Math.round((conversionsCount / totalLeads) * 100) : 0;

  // Chart 1: Funnel Stage Distribution
  const stageOrder: LeadStage[] = ['NEW', 'CONTACTED', 'SITE_VISIT', 'INTERESTED', 'NEGOTIATION', 'BOOKED', 'LOST'];
  const stageCounts: Record<string, number> = {};
  stageOrder.forEach((st) => {
    stageCounts[st] = 0;
  });
  filteredLeads.forEach((l) => {
    if (stageCounts[l.stage] !== undefined) {
      stageCounts[l.stage]++;
    }
  });
  const stageChartData = stageOrder.map((st) => ({
    stage: st.replace('_', ' '),
    count: stageCounts[st] || 0,
  }));

  // Chart 2: Leads by Source
  const sourceCounts: Record<string, number> = {};
  filteredLeads.forEach((l) => {
    const src = l.leadSource || 'OTHER';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sourceChartData = Object.entries(sourceCounts)
    .filter(([_, count]) => count > 0)
    .map(([source, count]) => ({
      name: source.replace('_', ' '),
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  // Chart 3: Monthly Revenue & Settlement Velocity
  const monthlyMap: Record<string, { count: number; revenue: number }> = {};
  filteredBookings.forEach((b) => {
    const d = new Date(b.bookingDate);
    const monthKey = d.toLocaleString('en-US', { month: 'short' });
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { count: 0, revenue: 0 };
    }
    monthlyMap[monthKey].count += 1;
    monthlyMap[monthKey].revenue += b.agreedPrice || 0;
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenueData: { month: string; count: number; revenue: number }[] = [];
  monthNames.forEach((m) => {
    if (monthlyMap[m]) {
      monthlyRevenueData.push({
        month: m,
        count: monthlyMap[m].count,
        revenue: monthlyMap[m].revenue,
      });
    }
  });

  // Chart 4: Project-wise Unit Status Breakdown
  const relevantProjects =
    projectId === 'ALL'
      ? projects
      : projects.filter((p) => String(p.id) === projectId);

  const projectAvailabilityData = relevantProjects.map((prj) => {
    const prjUnits = filteredUnits.filter(
      (u) =>
        u.projectId === prj.id ||
        u.projectName?.toLowerCase() === prj.name.toLowerCase() ||
        u.buildingName?.toLowerCase().includes(prj.name.toLowerCase())
    );
    const available = prjUnits.filter((u) => u.status === 'AVAILABLE').length;
    const reserved = prjUnits.filter((u) => u.status === 'RESERVED').length;
    const booked = prjUnits.filter((u) => u.status === 'BOOKED').length;
    return {
      name: prj.name.split(' ')[0],
      fullName: prj.name,
      Available: available,
      Reserved: reserved,
      Booked: booked,
    };
  });

  // Chart 5: Follow-Up Compliance
  const completedTasks = filteredFollowUps.filter((fu) => fu.status === 'COMPLETED').length;
  const followUpComplianceData = [
    { name: 'Completed Tasks', value: completedTasks, color: '#10B981' },
    { name: 'Due Today', value: dueTodayTasksCount, color: '#F59E0B' },
    { name: 'Overdue Reminders', value: overdueTasksCount, color: '#EF4444' },
  ];

  // Chart 6: Sales Representative Leaderboard
  const relevantAgents =
    agentId === 'ALL'
      ? salesAgents
      : salesAgents.filter((a) => String(a.id) === agentId);

  const agentPerformanceData = relevantAgents.map((ag) => {
    const agBookings = filteredBookings.filter((b) => b.bookedById === ag.id);
    const agLeads = filteredLeads.filter((l) => l.assignedToId === ag.id);
    const rev = agBookings.reduce((sum, b) => sum + (b.agreedPrice || 0), 0);
    return {
      name: ag.name.split(' ')[0],
      fullName: ag.name,
      Deals: agBookings.length,
      Revenue: rev,
      Leads: agLeads.length,
    };
  });

  // Feeds
  const recentLeads = [...filteredLeads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingConsultations = [...filteredFollowUps]
    .filter((fu) => fu.status === 'PENDING')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  // Prior period calculation
  let priorPeriodBookings = 0;
  let priorPeriodRevenue = 0;
  if (startDate && endDate) {
    const durationMs = endDate.getTime() - startDate.getTime();
    const priorStart = new Date(startDate.getTime() - durationMs);
    const priorEnd = new Date(startDate.getTime());
    const priorBookingsList = bookings.filter((b) => {
      if (b.status !== 'CONFIRMED') return false;
      if (!isDateInRange(b.bookingDate, priorStart, priorEnd)) return false;
      if (projectId !== 'ALL' && String(b.projectId) !== projectId) return false;
      if (agentId !== 'ALL' && String(b.bookedById) !== agentId) return false;
      return true;
    });
    priorPeriodBookings = priorBookingsList.length;
    priorPeriodRevenue = priorBookingsList.reduce((sum, b) => sum + (b.agreedPrice || 0), 0);
  }
  const revenueGrowthPct =
    priorPeriodRevenue > 0
      ? Math.round(((totalBookingRevenue - priorPeriodRevenue) / priorPeriodRevenue) * 100)
      : totalBookingRevenue > 0
      ? 100
      : 0;

  // Advanced Real Estate Analytics (Phase 3)
  // 1. Sales Funnel with Drop-off & Stage Conversion
  const funnelDefinitions: { stage: LeadStage; label: string; color: string }[] = [
    { stage: 'NEW', label: 'New Inquiries', color: '#6366F1' },
    { stage: 'CONTACTED', label: 'Contacted', color: '#3B82F6' },
    { stage: 'INTERESTED', label: 'Qualified Interest', color: '#06B6D4' },
    { stage: 'SITE_VISIT', label: 'Site Visits', color: '#8B5CF6' },
    { stage: 'NEGOTIATION', label: 'Negotiation', color: '#F59E0B' },
    { stage: 'BOOKED', label: 'Booked Deals', color: '#10B981' },
  ];

  let prevFunnelCount = totalLeads;
  const funnelStages: FunnelStageData[] = funnelDefinitions.map((def, idx) => {
    const count = filteredLeads.filter((l) => l.stage === def.stage).length;
    const stageConversionPct =
      idx === 0
        ? 100
        : prevFunnelCount > 0
        ? Math.min(100, Math.round((count / prevFunnelCount) * 100))
        : 0;
    const dropOffPct = idx === 0 ? 0 : Math.max(0, 100 - stageConversionPct);
    const cumulativeConversionPct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    if (count > 0) prevFunnelCount = count;
    return {
      stage: def.stage,
      label: def.label,
      count,
      stageConversionPct,
      dropOffPct,
      cumulativeConversionPct,
      color: def.color,
      linkUrl: `/leads?stage=${def.stage}`,
    };
  });

  // 2. Property Inventory Donut
  const totalUnitsInScope = filteredUnits.length || 1;
  const availableCount = filteredUnits.filter((u) => u.status === 'AVAILABLE').length;
  const reservedCount = filteredUnits.filter((u) => u.status === 'RESERVED').length;
  const bookedCount = filteredUnits.filter((u) => u.status === 'BOOKED').length;
  const unavailableCount = filteredUnits.filter((u) => u.status === 'UNAVAILABLE').length;

  const inventoryStatusDonut: InventoryStatusData[] = [
    {
      status: 'AVAILABLE',
      label: 'Available for Sale',
      count: availableCount,
      percentage: Math.round((availableCount / totalUnitsInScope) * 100),
      color: '#3B82F6',
      linkUrl: '/units?status=AVAILABLE',
    },
    {
      status: 'RESERVED',
      label: 'Under Token Hold',
      count: reservedCount,
      percentage: Math.round((reservedCount / totalUnitsInScope) * 100),
      color: '#F59E0B',
      linkUrl: '/units?status=RESERVED',
    },
    {
      status: 'BOOKED',
      label: 'Legally Contracted',
      count: bookedCount,
      percentage: Math.round((bookedCount / totalUnitsInScope) * 100),
      color: '#10B981',
      linkUrl: '/units?status=BOOKED',
    },
    {
      status: 'UNAVAILABLE',
      label: 'Maintenance / Hold',
      count: unavailableCount,
      percentage: Math.round((unavailableCount / totalUnitsInScope) * 100),
      color: '#64748B',
      linkUrl: '/units?status=UNAVAILABLE',
    },
  ];

  // 3. Detailed Agent Performance
  const agentDetailedPerformance: AgentDetailedPerformance[] = relevantAgents.map((ag) => {
    const agBookings = filteredBookings.filter((b) => b.bookedById === ag.id);
    const agLeads = filteredLeads.filter((l) => l.assignedToId === ag.id);
    const qualified = agLeads.filter((l) =>
      ['INTERESTED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKED'].includes(l.stage)
    ).length;
    const visits = agLeads.filter((l) => l.stage === 'SITE_VISIT').length;
    const rev = agBookings.reduce((sum, b) => sum + (b.agreedPrice || 0), 0);
    const cRate = agLeads.length > 0 ? Math.round((agBookings.length / agLeads.length) * 100) : 0;
    return {
      id: ag.id,
      name: ag.name.split(' ')[0],
      fullName: ag.name,
      assignedLeads: agLeads.length,
      qualifiedLeads: qualified,
      siteVisits: visits,
      conversions: agBookings.length,
      revenue: rev,
      conversionRate: cRate,
    };
  });

  // 4. Detailed Lead Source Analytics
  const sourcePalette: Record<string, string> = {
    WEBSITE: '#4F46E5',
    REFERRAL: '#10B981',
    WALK_IN: '#0EA5E9',
    SOCIAL_MEDIA: '#EC4899',
    CALL_IN: '#F59E0B',
    CAMPAIGN: '#8B5CF6',
    BROKER: '#06B6D4',
    OTHER: '#64748B',
  };

  const sourceAnalyticsDetailed: SourceAnalyticsDetailed[] = Object.keys(sourcePalette)
    .map((src) => {
      const srcLeads = filteredLeads.filter((l) => (l.leadSource || 'OTHER') === src);
      const bookedDeals = srcLeads.filter((l) => l.stage === 'BOOKED').length;
      const pct = totalLeads > 0 ? Math.round((srcLeads.length / totalLeads) * 100) : 0;
      const cRate = srcLeads.length > 0 ? Math.round((bookedDeals / srcLeads.length) * 100) : 0;
      return {
        source: src,
        label: src.replace('_', ' '),
        count: srcLeads.length,
        percentage: pct,
        conversions: bookedDeals,
        conversionRate: cRate,
        color: sourcePalette[src],
        linkUrl: `/leads?source=${src}`,
      };
    })
    .filter((s) => s.count > 0 || totalLeads === 0);

  // 5. Follow-Up Daily Heatmap
  const followUpHeatmap: FollowUpDailyHeatmap[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dStr = formatDateToInput(day);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const dayTasks = filteredFollowUps.filter((fu) => {
      const t = new Date(fu.scheduledAt);
      return t >= dayStart && t <= dayEnd;
    });

    const completed = dayTasks.filter((t) => t.status === 'COMPLETED').length;
    const pending = dayTasks.filter((t) => t.status === 'PENDING').length;
    const overdue = dayTasks.filter((t) => t.status === 'PENDING' && new Date(t.scheduledAt) < now).length;
    const total = dayTasks.length;
    const intensity = total === 0 ? 0 : total <= 2 ? 1 : total <= 4 ? 2 : total <= 6 ? 3 : 4;

    followUpHeatmap.push({
      dateStr: dStr,
      dayLabel: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      shortDay: day.toLocaleDateString('en-US', { weekday: 'short' }),
      completed,
      pending,
      overdue,
      total,
      intensity,
      linkUrl: `/follow-ups?date=${dStr}`,
    });
  }

  // 6. Conversion Gauge
  const targetRate = 20;
  const conversionGauge: ConversionGaugeData = {
    actualRate: conversionRate,
    targetRate,
    numerator: conversionsCount,
    denominator: totalLeads,
    deltaVsTarget: conversionRate - targetRate,
    accessibleSummary: `${conversionRate}% conversion rate (${conversionsCount} booked deals out of ${totalLeads} total leads), benchmarked against a target of ${targetRate}%.`,
  };

  // 7. Budget Distribution
  const brackets = [
    { key: 'tier1', rangeLabel: '< $250k', minBudget: 0, maxBudget: 250000 },
    { key: 'tier2', rangeLabel: '$250k - $500k', minBudget: 250000, maxBudget: 500000 },
    { key: 'tier3', rangeLabel: '$500k - $1M', minBudget: 500000, maxBudget: 1000000 },
    { key: 'tier4', rangeLabel: '$1M - $2M', minBudget: 1000000, maxBudget: 2000000 },
    { key: 'tier5', rangeLabel: '> $2M', minBudget: 2000000, maxBudget: 100000000 },
  ];

  const budgetDistribution: BudgetDistributionData[] = brackets.map((b) => {
    const matchCount = filteredLeads.filter((l) => {
      const bVal = l.budget || 0;
      return bVal >= b.minBudget && bVal < b.maxBudget;
    }).length;
    const pct = totalLeads > 0 ? Math.round((matchCount / totalLeads) * 100) : 0;
    return {
      key: b.key,
      rangeLabel: b.rangeLabel,
      minBudget: b.minBudget,
      maxBudget: b.maxBudget,
      count: matchCount,
      percentage: pct,
      linkUrl: `/leads?budgetMin=${b.minBudget}&budgetMax=${b.maxBudget === 100000000 ? '' : b.maxBudget}`,
    };
  });

  // 8. Activity Timeline Items
  const activityTimelineItems: ActivityTimelineItem[] = [];

  filteredFollowUps.slice(0, 8).forEach((fu) => {
    const isOverdue = fu.status === 'PENDING' && new Date(fu.scheduledAt) < now;
    const type: 'SITE_VISIT' | 'CALLBACK' | 'FOLLOW_UP' =
      fu.notes?.toLowerCase().includes('site visit') || fu.notes?.toLowerCase().includes('viewing')
        ? 'SITE_VISIT'
        : fu.notes?.toLowerCase().includes('call')
        ? 'CALLBACK'
        : 'FOLLOW_UP';

    activityTimelineItems.push({
      id: `fu-${fu.id}`,
      title: fu.leadName || `Lead Inquiry #${fu.leadId}`,
      description: fu.notes || 'Consultation follow-up',
      type,
      timestamp: fu.scheduledAt,
      formattedTime: new Date(fu.scheduledAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      leadId: fu.leadId,
      leadName: fu.leadName,
      agentName: fu.assignedToName,
      status: fu.status === 'COMPLETED' ? 'COMPLETED' : isOverdue ? 'OVERDUE' : 'SCHEDULED',
      linkUrl: fu.leadId ? `/leads/${fu.leadId}` : '/follow-ups',
    });
  });

  filteredBookings.slice(0, 5).forEach((b) => {
    activityTimelineItems.push({
      id: `bk-${b.id}`,
      title: `Unit ${b.unitNumber || ''} Reserved - ${b.customerName || 'Buyer'}`,
      description: `Agreement registered for $${(b.agreedPrice || 0).toLocaleString()} under ${b.bookingReference}`,
      type: 'BOOKING',
      timestamp: b.bookingDate,
      formattedTime: new Date(b.bookingDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      leadId: b.leadId,
      leadName: b.customerName,
      agentName: b.bookedByName,
      status: 'CONFIRMED',
      linkUrl: `/bookings`,
    });
  });

  activityTimelineItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    filteredLeads,
    filteredBookings,
    filteredUnits,
    filteredFollowUps,
    totalLeads,
    newLeads,
    contactedLeads,
    siteVisitsScheduled,
    negotiationLeads,
    conversionsCount,
    lostLeads,
    totalBookingRevenue,
    availableUnitsCount,
    overdueTasksCount,
    dueTodayTasksCount,
    conversionRate,
    priorPeriodRevenue,
    priorPeriodBookings,
    revenueGrowthPct,
    stageChartData,
    sourceChartData,
    monthlyRevenueData,
    projectAvailabilityData,
    followUpComplianceData,
    agentPerformanceData,
    funnelStages,
    inventoryStatusDonut,
    agentDetailedPerformance,
    sourceAnalyticsDetailed,
    followUpHeatmap,
    conversionGauge,
    budgetDistribution,
    activityTimelineItems,
    recentLeads,
    upcomingConsultations,
  };
};
