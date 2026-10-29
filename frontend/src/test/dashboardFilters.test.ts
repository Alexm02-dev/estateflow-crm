import { describe, it, expect } from 'vitest';
import {
  calculateDateBounds,
  isDateInRange,
  computeDashboardData,
  startOfDay,
  endOfDay,
  DashboardFilterState,
} from '../utils/dashboardFilters';
import { Lead, Booking, PropertyUnit, FollowUp } from '../types';

describe('Dashboard Filters Utility Suite', () => {
  const refDate = new Date('2026-10-29T14:30:00Z');

  describe('calculateDateBounds', () => {
    it('calculates TODAY boundaries correctly', () => {
      const res = calculateDateBounds('TODAY', undefined, undefined, refDate);
      expect(res.isValid).toBe(true);
      expect(res.startDate).toBeDefined();
      expect(res.endDate).toBeDefined();
      expect(res.formattedLabel).toContain('Today');
      expect(res.startDate?.getHours()).toBe(0);
      expect(res.endDate?.getHours()).toBe(23);
    });

    it('calculates LAST_7_DAYS boundaries correctly', () => {
      const res = calculateDateBounds('LAST_7_DAYS', undefined, undefined, refDate);
      expect(res.isValid).toBe(true);
      expect(res.startDate).toBeDefined();
      expect(res.endDate).toBeDefined();
      const diffDays = Math.round(
        (res.endDate!.getTime() - res.startDate!.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(7);
    });

    it('calculates THIS_MONTH and LAST_MONTH boundaries', () => {
      const thisMonth = calculateDateBounds('THIS_MONTH', undefined, undefined, refDate);
      expect(thisMonth.isValid).toBe(true);
      expect(thisMonth.startDate?.getDate()).toBe(1);

      const lastMonth = calculateDateBounds('LAST_MONTH', undefined, undefined, refDate);
      expect(lastMonth.isValid).toBe(true);
      expect(lastMonth.startDate?.getMonth()).toBe((refDate.getMonth() - 1 + 12) % 12);
    });

    it('calculates QTD and YTD boundaries correctly', () => {
      const qtd = calculateDateBounds('QTD', undefined, undefined, refDate);
      expect(qtd.isValid).toBe(true);
      expect(qtd.formattedLabel).toContain('Q4');

      const ytd = calculateDateBounds('YTD', undefined, undefined, refDate);
      expect(ytd.isValid).toBe(true);
      expect(ytd.startDate?.getMonth()).toBe(0); // January
      expect(ytd.startDate?.getDate()).toBe(1);
    });

    it('validates CUSTOM date range correctly and rejects start > end', () => {
      const validCustom = calculateDateBounds('CUSTOM', '2026-06-01', '2026-06-30', refDate);
      expect(validCustom.isValid).toBe(true);
      expect(validCustom.startDate).toBeDefined();
      expect(validCustom.endDate).toBeDefined();

      const invalidCustom = calculateDateBounds('CUSTOM', '2026-08-01', '2026-06-01', refDate);
      expect(invalidCustom.isValid).toBe(false);
      expect(invalidCustom.errorMessage).toContain('cannot be after end date');
    });
  });

  describe('isDateInRange', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-12-31T23:59:59Z');

    it('returns true when date is within range', () => {
      expect(isDateInRange('2026-06-15T10:00:00Z', start, end)).toBe(true);
    });

    it('returns false when date is outside range', () => {
      expect(isDateInRange('2025-12-31T23:59:59Z', start, end)).toBe(false);
      expect(isDateInRange('2027-01-01T00:00:00Z', start, end)).toBe(false);
    });

    it('returns false for null or undefined date', () => {
      expect(isDateInRange(null, start, end)).toBe(false);
      expect(isDateInRange(undefined, start, end)).toBe(false);
    });

    it('handles null boundaries (ALL_TIME)', () => {
      expect(isDateInRange('2026-05-01T00:00:00Z', null, null)).toBe(true);
    });
  });

  describe('computeDashboardData', () => {
    const mockLeads: Lead[] = [
      {
        id: 1,
        leadCode: 'LD-1',
        fullName: 'Alice Walker',
        phone: '1234567890',
        leadSource: 'WEBSITE',
        interestedProjectId: 10,
        interestedProjectName: 'Skyline',
        budget: 650000,
        assignedToId: 101,
        stage: 'NEW',
        createdAt: '2026-10-15T10:00:00Z',
      },
      {
        id: 2,
        leadCode: 'LD-2',
        fullName: 'Bob Roberts',
        phone: '0987654321',
        leadSource: 'REFERRAL',
        interestedProjectId: 20,
        interestedProjectName: 'Oceanview',
        budget: 800000,
        assignedToId: 102,
        stage: 'CONTACTED',
        createdAt: '2026-10-20T11:00:00Z',
      },
      {
        id: 3,
        leadCode: 'LD-3',
        fullName: 'Charlie Davis',
        phone: '5551234567',
        leadSource: 'WEBSITE',
        interestedProjectId: 10,
        interestedProjectName: 'Skyline',
        budget: 1500000,
        assignedToId: 101,
        stage: 'BOOKED',
        createdAt: '2025-05-10T10:00:00Z', // Prior year
      },
    ];

    const mockBookings: Booking[] = [
      {
        id: 1,
        bookingReference: 'BK-1001',
        leadId: 3,
        unitId: 501,
        projectId: 10,
        projectName: 'Skyline',
        bookedById: 101,
        bookingDate: '2026-10-25T14:00:00Z',
        agreedPrice: 500000,
        bookingAmount: 50000,
        status: 'CONFIRMED',
        createdAt: '2026-10-25T14:00:00Z',
      },
    ];

    const mockUnits: PropertyUnit[] = [
      {
        id: 501,
        buildingId: 1,
        projectId: 10,
        projectName: 'Skyline',
        unitNumber: '101',
        unitType: 'TWO_BHK',
        floor: 1,
        areaSqft: 1200,
        price: 500000,
        status: 'BOOKED',
      },
      {
        id: 502,
        buildingId: 1,
        projectId: 10,
        projectName: 'Skyline',
        unitNumber: '102',
        unitType: 'THREE_BHK',
        floor: 1,
        areaSqft: 1500,
        price: 750000,
        status: 'AVAILABLE',
      },
      {
        id: 503,
        buildingId: 2,
        projectId: 20,
        projectName: 'Oceanview',
        unitNumber: '201',
        unitType: 'ONE_BHK',
        floor: 2,
        areaSqft: 800,
        price: 350000,
        status: 'AVAILABLE',
      },
    ];

    const mockFollowUps: FollowUp[] = [
      {
        id: 1,
        leadId: 1,
        assignedToId: 101,
        scheduledAt: '2026-10-20T09:00:00Z', // Overdue
        status: 'PENDING',
        createdAt: '2026-10-15T10:00:00Z',
      },
    ];

    const mockProjects = [
      { id: 10, name: 'Skyline Towers' },
      { id: 20, name: 'Oceanview Villas' },
    ];

    const mockAgents = [
      { id: 101, name: 'John Miller' },
      { id: 102, name: 'Sarah Connor' },
    ];

    it('computes YTD metrics accurately for all projects and agents', () => {
      const filters: DashboardFilterState = {
        datePreset: 'YTD',
        customStartDate: '',
        customEndDate: '',
        projectId: 'ALL',
        agentId: 'ALL',
      };
      const bounds = calculateDateBounds('YTD', undefined, undefined, refDate);

      const data = computeDashboardData(
        mockLeads,
        mockBookings,
        mockUnits,
        mockFollowUps,
        mockProjects,
        mockAgents,
        filters,
        bounds
      );

      // Leads 1 and 2 are in 2026 YTD; Lead 3 is in 2025 so excluded
      expect(data.totalLeads).toBe(2);
      expect(data.newLeads).toBe(1);
      expect(data.contactedLeads).toBe(1);
      expect(data.conversionsCount).toBe(1); // 1 confirmed booking in 2026
      expect(data.totalBookingRevenue).toBe(500000);
      expect(data.availableUnitsCount).toBe(2); // Units 502 and 503
      expect(data.overdueTasksCount).toBe(1);
    });

    it('filters accurately by project ID', () => {
      const filters: DashboardFilterState = {
        datePreset: 'ALL_TIME',
        customStartDate: '',
        customEndDate: '',
        projectId: '10',
        agentId: 'ALL',
      };
      const bounds = { startDate: null, endDate: null };

      const data = computeDashboardData(
        mockLeads,
        mockBookings,
        mockUnits,
        mockFollowUps,
        mockProjects,
        mockAgents,
        filters,
        bounds
      );

      expect(data.totalLeads).toBe(2); // Leads 1 and 3 belong to project 10
      expect(data.availableUnitsCount).toBe(1); // Unit 502 belongs to project 10
      expect(data.totalBookingRevenue).toBe(500000);
    });

    it('filters accurately by sales representative ID', () => {
      const filters: DashboardFilterState = {
        datePreset: 'ALL_TIME',
        customStartDate: '',
        customEndDate: '',
        projectId: 'ALL',
        agentId: '102', // Sarah Connor
      };
      const bounds = { startDate: null, endDate: null };

      const data = computeDashboardData(
        mockLeads,
        mockBookings,
        mockUnits,
        mockFollowUps,
        mockProjects,
        mockAgents,
        filters,
        bounds
      );

      expect(data.totalLeads).toBe(1); // Bob Roberts
      expect(data.conversionsCount).toBe(0);
      expect(data.totalBookingRevenue).toBe(0);
      expect(data.overdueTasksCount).toBe(0);
    });

    it('handles empty datasets cleanly without errors', () => {
      const filters: DashboardFilterState = {
        datePreset: 'ALL_TIME',
        customStartDate: '',
        customEndDate: '',
        projectId: '999',
        agentId: '999',
      };
      const bounds = { startDate: null, endDate: null };

      const data = computeDashboardData([], [], [], [], mockProjects, mockAgents, filters, bounds);

      expect(data.totalLeads).toBe(0);
      expect(data.totalBookingRevenue).toBe(0);
      expect(data.conversionRate).toBe(0);
      expect(data.sourceChartData).toEqual([]);
      expect(data.stageChartData.length).toBe(7);
      expect(data.stageChartData.every((s) => s.count === 0)).toBe(true);
      expect(data.conversionGauge.actualRate).toBe(0);
      expect(data.conversionGauge.targetRate).toBe(20);
      expect(data.inventoryStatusDonut.length).toBe(4);
      expect(data.budgetDistribution.length).toBe(5);
    });

    it('computes Phase 3 Advanced Real Estate Analytics accurately', () => {
      const filters: DashboardFilterState = {
        datePreset: 'ALL_TIME',
        customStartDate: '',
        customEndDate: '',
        projectId: 'ALL',
        agentId: 'ALL',
      };
      const bounds = { startDate: null, endDate: null };

      const data = computeDashboardData(
        mockLeads,
        mockBookings,
        mockUnits,
        mockFollowUps,
        mockProjects,
        mockAgents,
        filters,
        bounds
      );

      // 1. Sales Funnel & Drop-off
      expect(data.funnelStages.length).toBe(6);
      expect(data.funnelStages[0].stage).toBe('NEW');
      expect(data.funnelStages[0].count).toBe(1);
      expect(data.funnelStages[0].stageConversionPct).toBe(100);

      // 2. Conversion Gauge
      expect(data.conversionGauge.targetRate).toBe(20);
      expect(data.conversionGauge.numerator).toBe(1);
      expect(data.conversionGauge.denominator).toBe(3);
      expect(data.conversionGauge.actualRate).toBe(33); // 1 / 3 = 33%
      expect(data.conversionGauge.deltaVsTarget).toBe(13); // 33 - 20 = 13%

      // 3. Inventory Status Donut
      expect(data.inventoryStatusDonut.length).toBe(4);
      const availableStatus = data.inventoryStatusDonut.find((s) => s.status === 'AVAILABLE');
      expect(availableStatus?.count).toBe(2);
      expect(availableStatus?.percentage).toBe(67); // 2/3 = 67%

      // 4. Budget Distribution
      expect(data.budgetDistribution.length).toBe(5);
      const tier3 = data.budgetDistribution.find((b) => b.key === 'tier3'); // $500k-$1M
      expect(tier3?.count).toBe(2); // 500000 and 750000

      // 5. Follow-up Heatmap
      expect(data.followUpHeatmap.length).toBe(14);
      expect(data.followUpHeatmap.every((h) => h.total >= 0)).toBe(true);

      // 6. Agent Detailed Performance
      expect(data.agentDetailedPerformance.length).toBe(2);
      const agentJohn = data.agentDetailedPerformance.find((a) => a.id === 101);
      expect(agentJohn?.assignedLeads).toBe(2);
      expect(agentJohn?.conversions).toBe(1);
      expect(agentJohn?.revenue).toBe(500000);
      expect(agentJohn?.conversionRate).toBe(50);
    });
  });
});
