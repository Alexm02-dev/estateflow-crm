import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsPage } from '../pages/SettingsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { CustomersPage } from '../pages/CustomersPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Alex Morgan', email: 'admin@estatecrm.com', role: 'ADMIN' },
    isAdmin: true,
  }),
}));

// Mock ToastContext
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

// Mock APIs to prevent unhandled background HTTP connections during unit test teardown
vi.mock('../api/bookingsApi', () => ({
  bookingsApi: {
    getBookings: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
    getBookingStats: vi.fn().mockResolvedValue({ totalBookings: 0, totalRevenue: 0 }),
  },
}));

vi.mock('../api/leadsApi', () => ({
  leadsApi: {
    getLeads: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
    getOverdueFollowUps: vi.fn().mockResolvedValue([]),
    getRecentActivities: vi.fn().mockResolvedValue([]),
    getLeadSources: vi.fn().mockResolvedValue(['WEBSITE', 'REFERRAL']),
  },
}));

vi.mock('../api/projectsApi', () => ({
  projectsApi: {
    getProjects: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../api/employeesApi', () => ({
  employeesApi: {
    getAllEmployees: vi.fn().mockResolvedValue([]),
    getSalesEmployees: vi.fn().mockResolvedValue([]),
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

describe('Enterprise Pages & System Suite', () => {
  it('renders SettingsPage with tab switcher and live architecture specs', () => {
    render(<SettingsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Settings & System Administration')).toBeDefined();
    expect(screen.getByText('System Health & Config')).toBeDefined();
    expect(screen.getByText('API & Integrations')).toBeDefined();
    expect(screen.getByText('Concurrency Architecture')).toBeDefined();
  });

  it('renders NotificationsPage with notification feeds and statistics', () => {
    render(<NotificationsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Notifications & System Alerts')).toBeDefined();
    expect(screen.getByText(/All Notifications/)).toBeDefined();
    expect(screen.getByText(/Overdue Tasks/)).toBeDefined();
  });

  it('renders CustomersPage with booked buyers directory and metrics', () => {
    render(<CustomersPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Converted Customer Accounts')).toBeDefined();
    expect(screen.getByText('Export CSV')).toBeDefined();
  });

  it('renders AuditLogsPage with system trails and search input', () => {
    render(<AuditLogsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('System Audit & Security Logs')).toBeDefined();
    expect(screen.getByText('Export Log CSV')).toBeDefined();
  });
});
