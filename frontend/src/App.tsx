import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { LeadFormPage } from './pages/LeadFormPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { UnitsInventoryPage } from './pages/UnitsInventoryPage';
import { BookingsPage } from './pages/BookingsPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { NewBookingPage } from './pages/NewBookingPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { CustomersPage } from './pages/CustomersPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <BrowserRouter>
              <SidebarProvider>
                <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Authenticated Application Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard */}
                <Route index element={<DashboardPage />} />

                {/* Leads */}
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/new" element={<LeadFormPage />} />
                <Route path="leads/:id" element={<LeadDetailPage />} />
                <Route path="leads/:id/edit" element={<LeadFormPage />} />

                {/* Follow-ups */}
                <Route path="follow-ups" element={<FollowUpsPage />} />

                {/* Projects & Properties */}
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />

                {/* Units & Inventory */}
                <Route path="units" element={<UnitsInventoryPage />} />

                {/* Bookings */}
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/new" element={<NewBookingPage />} />
                <Route path="bookings/:id" element={<BookingDetailPage />} />

                {/* Employees (Admin Only) */}
                <Route
                  path="employees"
                  element={
                    <ProtectedRoute requireAdmin>
                      <EmployeesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Reports & Analytics */}
                <Route path="reports" element={<ReportsPage />} />

                {/* Activities Feed */}
                <Route path="activities" element={<ActivitiesPage />} />

                {/* Customers */}
                <Route path="customers" element={<CustomersPage />} />

                {/* Notifications */}
                <Route path="notifications" element={<NotificationsPage />} />

                {/* Audit Logs */}
                <Route path="audit-logs" element={<AuditLogsPage />} />

                {/* Profile & Settings */}
                <Route path="settings" element={<SettingsPage />} />

                {/* Unauthorized Page */}
                <Route path="unauthorized" element={<UnauthorizedPage />} />
              </Route>

              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SidebarProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};
export default App;
