import React, { useState, useEffect, memo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CommandPalette } from '../common/CommandPalette';
import { useSidebar } from '../../context/SidebarContext';

/**
 * Dedicated Edge Activation Strip on Desktop:
 * Only rendered when sidebar is unpinned.
 * Consumes onPointerEnter/Leave from SidebarContext without causing
 * whole-page or AppLayout rerenders.
 */
const SidebarEdgeZone: React.FC = memo(() => {
  const { isPinned, onPointerEnter, onPointerLeave } = useSidebar();
  if (isPinned) return null;

  return (
    <div
      aria-hidden="true"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="fixed inset-y-0 left-0 w-3 z-50 hidden lg:block cursor-pointer bg-transparent hover:bg-brand-500/10 transition-colors"
      title="Hover to preview navigation sidebar"
    />
  );
});
SidebarEdgeZone.displayName = 'SidebarEdgeZone';

export const AppLayout: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const { toggleMenu, isPinned, isMobileOpen } = useSidebar();

  // Global Ctrl+K / Cmd+K listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic Page Titles based on route
  const getPageTitle = (pathname: string) => {
    if (pathname === '/') return 'Executive Dashboard & Overview';
    if (pathname.startsWith('/leads/new')) return 'Create New Lead';
    if (pathname.includes('/edit')) return 'Edit Lead Record';
    if (pathname.startsWith('/leads/')) return 'Lead Details & Activities';
    if (pathname.startsWith('/leads')) return 'Lead Management Pipeline';
    if (pathname.startsWith('/activities')) return 'Sales & Customer Activities';
    if (pathname.startsWith('/customers')) return 'Converted Customer Directory';
    if (pathname.startsWith('/notifications')) return 'Notifications & System Reminders';
    if (pathname.startsWith('/audit-logs')) return 'System Audit & Compliance Logs';
    if (pathname.startsWith('/follow-ups')) return 'Follow-ups & Schedules';
    if (pathname.startsWith('/projects/')) return 'Project Overview & Buildings';
    if (pathname.startsWith('/projects')) return 'Properties & Projects';
    if (pathname.startsWith('/units')) return 'Units Inventory Management';
    if (pathname.startsWith('/bookings/new')) return 'Unit Reservation Wizard';
    if (pathname.startsWith('/bookings/')) return 'Booking Contract Details';
    if (pathname.startsWith('/bookings')) return 'Bookings & Contracts';
    if (pathname.startsWith('/employees')) return 'Sales Team & Staff Admin';
    if (pathname.startsWith('/reports')) return 'Business Intelligence Reports';
    if (pathname.startsWith('/settings')) return 'Profile & Settings';
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col lg:flex-row text-slate-800 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      {/* Method B: Narrow Left-Edge Hover Detection Zone on Desktop (12px) */}
      <SidebarEdgeZone />

      {/* Sidebar Component: Desktop flex sibling, mobile off-canvas drawer */}
      <Sidebar />

      {/* Main Content Area: Flex container adapting automatically and smoothly to sidebar width */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen">
        <Navbar
          onToggleSidebar={toggleMenu}
          isSidebarOpen={isPinned || isMobileOpen}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          pageTitle={getPageTitle(location.pathname)}
        />

        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 max-w-full">
          <Outlet />
        </main>
      </div>

      {/* Quick Action Productivity Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
