import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../pages/DashboardPage';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Alex Morgan', email: 'admin@estatecrm.com', role: 'ADMIN' },
    isAdmin: true,
  }),
}));

// Mock ThemeContext
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

// Mock APIs
vi.mock('../api/leadsApi', () => ({
  leadsApi: {
    getLeads: vi.fn().mockResolvedValue({
      content: [
        {
          id: 1,
          leadCode: 'LD-1',
          fullName: 'Alice Walker',
          phone: '1234567890',
          leadSource: 'WEBSITE',
          interestedProjectId: 10,
          interestedProjectName: 'Skyline Towers',
          assignedToId: 101,
          stage: 'NEW',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          leadCode: 'LD-2',
          fullName: 'Bob Roberts',
          phone: '0987654321',
          leadSource: 'REFERRAL',
          interestedProjectId: 20,
          interestedProjectName: 'Oceanview Villas',
          assignedToId: 102,
          stage: 'CONTACTED',
          createdAt: new Date().toISOString(),
        },
      ],
      totalElements: 2,
    }),
  },
}));

vi.mock('../api/bookingsApi', () => ({
  bookingsApi: {
    getBookings: vi.fn().mockResolvedValue({
      content: [
        {
          id: 1,
          bookingReference: 'BK-1001',
          leadId: 1,
          unitId: 501,
          projectId: 10,
          projectName: 'Skyline Towers',
          bookedById: 101,
          bookingDate: new Date().toISOString(),
          agreedPrice: 750000,
          bookingAmount: 75000,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
      ],
      totalElements: 1,
    }),
  },
}));

vi.mock('../api/unitsApi', () => ({
  unitsApi: {
    getUnits: vi.fn().mockResolvedValue([
      {
        id: 501,
        buildingId: 1,
        projectId: 10,
        projectName: 'Skyline Towers',
        unitNumber: '101',
        unitType: 'TWO_BHK',
        floor: 1,
        areaSqft: 1200,
        price: 750000,
        status: 'AVAILABLE',
      },
      {
        id: 502,
        buildingId: 2,
        projectId: 20,
        projectName: 'Oceanview Villas',
        unitNumber: '201',
        unitType: 'THREE_BHK',
        floor: 2,
        areaSqft: 1800,
        price: 1200000,
        status: 'AVAILABLE',
      },
    ]),
  },
}));

vi.mock('../api/followUpsApi', () => ({
  followUpsApi: {
    getFollowUps: vi.fn().mockResolvedValue({
      content: [
        {
          id: 1,
          leadId: 1,
          leadName: 'Alice Walker',
          assignedToId: 101,
          scheduledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (overdue)
          status: 'PENDING',
          notes: 'Schedule VIP showroom tour',
          createdAt: new Date().toISOString(),
        },
      ],
      totalElements: 1,
    }),
  },
}));

vi.mock('../api/projectsApi', () => ({
  projectsApi: {
    getProjects: vi.fn().mockResolvedValue([
      { id: 10, name: 'Skyline Towers' },
      { id: 20, name: 'Oceanview Villas' },
    ]),
  },
}));

vi.mock('../api/employeesApi', () => ({
  employeesApi: {
    getSalesEmployees: vi.fn().mockResolvedValue([
      { id: 101, name: 'John Miller', role: 'SALES_EMPLOYEE', active: true },
      { id: 102, name: 'Sarah Connor', role: 'SALES_EMPLOYEE', active: true },
    ]),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('DashboardPage Component & Filter Integration', () => {
  it('renders executive dashboard with functional filter controls', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Executive Dashboard')).toBeDefined();
    expect(screen.getByLabelText('Select date range filter')).toBeDefined();
    expect(screen.getByLabelText('Filter by property development')).toBeDefined();
    expect(screen.getByLabelText('Filter by sales representative')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Skyline Towers')).toBeDefined();
      expect(screen.getByText('Oceanview Villas')).toBeDefined();
    });
  });

  it('updates dashboard metrics when selecting a project filter', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total Leads')).toBeDefined();
    });

    const projectSelect = screen.getByLabelText('Filter by property development');
    fireEvent.change(projectSelect, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByText('🏢 Skyline Towers')).toBeDefined();
    });
  });

  it('reveals custom date inputs when CUSTOM preset is selected', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    const dateSelect = screen.getByLabelText('Select date range filter');
    fireEvent.change(dateSelect, { target: { value: 'CUSTOM' } });

    await waitFor(() => {
      expect(screen.getByLabelText('From:')).toBeDefined();
      expect(screen.getByLabelText('To:')).toBeDefined();
    });
  });

  it('resets all filters when clicking Reset Filters button', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    const projectSelect = screen.getByLabelText('Filter by property development');
    fireEvent.change(projectSelect, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByText('Reset Filters')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Reset Filters'));

    await waitFor(() => {
      expect(screen.queryByText('Reset Filters')).toBeNull();
    });
  });

  it('renders Phase 3 analytics cards: Gauge, Budget Distribution, Inventory Donut, and Heatmap', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Pipeline Win Rate vs. Target')).toBeDefined();
      expect(screen.getByText('Prospect Budget Distribution')).toBeDefined();
      expect(screen.getByText('Inventory Absorption Status')).toBeDefined();
      expect(screen.getByText('14-Day Consultation & Follow-Up Execution Heatmap')).toBeDefined();
      expect(screen.getByText('Activity Feed & Transaction Milestones')).toBeDefined();
    }, { timeout: 4000 });
  });
});
