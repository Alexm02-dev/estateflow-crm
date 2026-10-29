import React, { useRef, useState, memo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Building2,
  Home,
  CheckCircle2,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  PlusCircle,
  Building,
  Pin,
  PinOff,
  X,
  Activity,
  History,
  DollarSign,
  Briefcase,
  Clock,
  Shield,
  ShieldCheck,
  Bell,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  Calendar,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { SidebarItem } from './SidebarItem';
import { Tooltip } from '../common/Tooltip';

export interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isHoverExpanded?: boolean;
  onHoverSidebar?: (hovering: boolean) => void;
}

interface NavGroup {
  group: string;
  items: {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
    badge?: React.ReactNode;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile: propIsOpenMobile,
  onCloseMobile: propOnCloseMobile,
  isPinned: propIsPinned,
  onTogglePin: propOnTogglePin,
  isHoverExpanded: propIsHoverExpanded,
  onHoverSidebar: propOnHoverSidebar,
}) => {
  const sidebarContext = useSidebar();
  const { user, isAdmin, logout } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);

  // Accordion state to collapse/expand sections when sidebar is open
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Allow props to override context if explicitly provided
  const isPinned = propIsPinned !== undefined ? propIsPinned : sidebarContext.isPinned;
  const isHoverExpanded =
    propIsHoverExpanded !== undefined ? propIsHoverExpanded : sidebarContext.isHoverExpanded;
  const isOpenMobile =
    propIsOpenMobile !== undefined ? propIsOpenMobile : sidebarContext.isMobileOpen;
  const onTogglePin = propOnTogglePin || sidebarContext.togglePin;
  const onCloseMobile = propOnCloseMobile || sidebarContext.closeMobile;

  // Optimized pointer event handlers
  const handlePointerEnter = () => {
    if (propOnHoverSidebar) {
      propOnHoverSidebar(true);
    } else {
      sidebarContext.onPointerEnter();
    }
  };

  const handlePointerLeave = () => {
    if (propOnHoverSidebar) {
      propOnHoverSidebar(false);
    } else {
      sidebarContext.onPointerLeave();
    }
  };

  // Comprehensive 7-Group Navigation Structure
  const navGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
        { name: 'Analytics & Reports', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      group: 'Sales & Leads',
      items: [
        { name: 'All Leads', path: '/leads', icon: Users, exact: true },
        { name: 'My Leads', path: '/leads?view=my', icon: UserCheck },
        { name: 'Lead Pipeline', path: '/leads?view=kanban', icon: Layers },
        { name: 'Follow-ups', path: '/follow-ups', icon: CalendarClock },
        { name: 'Site Visits', path: '/leads?stage=SITE_VISIT', icon: Calendar },
        { name: 'Sales Activities', path: '/activities', icon: Activity },
      ],
    },
    {
      group: 'Properties & Inventory',
      items: [
        { name: 'Projects', path: '/projects', icon: Building2, exact: true },
        { name: 'Buildings & Floors', path: '/projects?tab=buildings', icon: Building },
        { name: 'Units Inventory', path: '/units', icon: Home, exact: true },
        { name: 'Unit Availability', path: '/units?status=AVAILABLE', icon: CheckCircle2 },
      ],
    },
    {
      group: 'Reservations & Deals',
      items: [
        { name: 'New Reservation', path: '/bookings/new', icon: PlusCircle },
        { name: 'All Reservations', path: '/bookings', icon: CheckCircle2, exact: true },
        { name: 'Booking History', path: '/bookings?status=COMPLETED', icon: History },
        { name: 'Payments & Deposits', path: '/bookings?tab=payments', icon: DollarSign },
      ],
    },
    {
      group: 'Customers',
      items: [
        { name: 'Customers', path: '/customers', icon: Briefcase },
        { name: 'Customer Activity', path: '/activities?type=MEETING', icon: Clock },
      ],
    },
    {
      group: 'Team Management',
      items: [
        ...(isAdmin ? [{ name: 'Staff & Agents', path: '/employees', icon: Users, exact: true }] : []),
        ...(isAdmin ? [{ name: 'Assignments', path: '/employees?tab=assignments', icon: SlidersHorizontal }] : []),
        ...(isAdmin ? [{ name: 'Roles & Access', path: '/employees?tab=roles', icon: Shield }] : []),
      ],
    },
    {
      group: 'Administration',
      items: [
        { name: 'Notifications', path: '/notifications', icon: Bell },
        ...(isAdmin ? [{ name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck }] : []),
        { name: 'Settings', path: '/settings', icon: Settings, exact: true },
        { name: 'Profile & Preferences', path: '/settings?tab=profile', icon: UserIcon },
      ],
    },
  ];

  // Effective visual expansion state: expanded if pinned, or if mouse hover expanded, or if mobile open
  const isExpanded = isPinned || isHoverExpanded;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity duration-200 ease-out motion-reduce:transition-none"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container: flex sibling on desktop, off-canvas on mobile */}
      <aside
        ref={sidebarRef}
        aria-label="Application navigation"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className={`z-40 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800/90 shadow-md transition-[width,transform] duration-200 ease-out motion-reduce:transition-none overflow-x-hidden fixed inset-y-0 left-0 w-72 lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 [will-change:width] ${
          // Mobile state: off-canvas drawer
          isOpenMobile ? 'translate-x-0 z-50' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop state: collapsed (w-20 = 80px) vs expanded (w-64 = 256px)
          isExpanded ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        {/* Top Header: Logo, Title, and Pin / Close toggles */}
        <div className="flex items-center justify-between px-3.5 h-16 border-b border-slate-800/90 flex-shrink-0 select-none overflow-hidden">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Building className="w-5 h-5" />
            </div>
            {(isExpanded || isOpenMobile) && (
              <div className="min-w-0 transition-opacity duration-150">
                <span className="text-base font-bold tracking-tight text-white block truncate">
                  EstateFlow
                </span>
                <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider block">
                  CRM Cloud
                </span>
              </div>
            )}
          </div>

          {/* Desktop Pin/Lock Toggle Button */}
          {(isExpanded || isOpenMobile) && (
            <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
              <Tooltip
                content={isPinned ? 'Unpin sidebar (hover-to-expand)' : 'Pin sidebar open'}
                position="bottom"
                delayMs={120}
              >
                <button
                  type="button"
                  onClick={onTogglePin}
                  className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-brand-400 ${
                    isPinned
                      ? 'text-brand-400 bg-brand-950/80 hover:text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                  aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                  aria-pressed={isPinned}
                >
                  {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
              </Tooltip>
            </div>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden focus:outline-none"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Group Items */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => {
            if (group.items.length === 0) return null;
            const isGroupCollapsed = collapsedGroups[group.group];

            return (
              <div key={group.group} className="space-y-1">
                {isExpanded || isOpenMobile ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 select-none transition-colors group"
                    aria-expanded={!isGroupCollapsed}
                  >
                    <span>{group.group}</span>
                    <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                      {isGroupCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                ) : (
                  <div className="my-2 border-t border-slate-800/80 mx-2" />
                )}

                {/* Group items (collapsible when expanded, always visible in compact icon mode) */}
                {(!isGroupCollapsed || (!isExpanded && !isOpenMobile)) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <SidebarItem
                        key={item.path}
                        name={item.name}
                        path={item.path}
                        icon={item.icon}
                        exact={item.exact}
                        isCollapsed={!isExpanded && !isOpenMobile}
                        isMobile={isOpenMobile}
                        badge={item.badge}
                        onClick={onCloseMobile}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer: User profile & quick sign out */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex-shrink-0">
          <div
            className={`flex items-center gap-2.5 ${
              !isExpanded && !isOpenMobile ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar name={user?.name || 'User'} size="sm" showStatus isOnline />
              {(isExpanded || isOpenMobile) && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-brand-300 font-medium truncate capitalize">
                    {user?.role?.toLowerCase().replace('_', ' ') || 'User'}
                  </p>
                </div>
              )}
            </div>

            {(isExpanded || isOpenMobile) && (
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/70 transition-colors focus:outline-none"
                title="Sign out of CRM"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
