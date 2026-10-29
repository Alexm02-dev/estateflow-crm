import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Menu,
  Bell,
  Shield,
  Search,
  Settings,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  Command,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { DropdownMenu } from '../common/DropdownMenu';
import { Tooltip } from '../common/Tooltip';

export interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
  onOpenCommandPalette?: () => void;
  pageTitle?: string;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = memo(({
  onToggleSidebar,
  isSidebarOpen,
  onOpenCommandPalette,
  pageTitle,
  className = '',
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const userMenuItems = [
    {
      label: (
        <div className="py-1">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
        </div>
      ),
      onClick: () => navigate('/settings'),
    },
    'separator' as const,
    {
      label: 'Account Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => navigate('/settings'),
    },
    {
      label: 'Swagger REST Docs',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => window.open('http://localhost:8080/swagger-ui.html', '_blank'),
    },
    'separator' as const,
    {
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => logout(),
    },
  ];

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-[#0B1220] border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors ${className}`}
    >
      {/* Left side: Method A Toggle Button & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Tooltip content="Toggle Navigation Sidebar (Menu Button)" position="bottom">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isSidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
        </Tooltip>

        {pageTitle && (
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight truncate">
              {pageTitle}
            </h1>
          </div>
        )}
      </div>

      {/* Right side: Global Search, Role Badge, Notifications, User Profile */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {/* Quick Command Palette / Search Shortcut */}
        <div
          className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer select-none"
          onClick={onOpenCommandPalette ? onOpenCommandPalette : () => navigate('/leads')}
          title="Open Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Search or press Ctrl+K...</span>
          <kbd className="ml-2 font-mono text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 shadow-2xs">
            Ctrl+K
          </kbd>
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <Tooltip content={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} position="bottom">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </Tooltip>

        {/* Role Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2.5 py-1 rounded-full text-xs font-semibold text-brand-700 dark:text-brand-300 shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
          <span>{isAdmin ? 'Admin' : 'Sales Representative'}</span>
        </div>

        {/* Live Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live API</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => navigate('/follow-ups')}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          title="Scheduled Reminders"
          aria-label="View scheduled reminders"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* User Dropdown Menu */}
        <DropdownMenu
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all focus:outline-none"
              aria-label="User profile options"
            >
              <UserAvatar name={user?.name || 'User'} size="sm" showStatus isOnline />
              <div className="hidden xl:block text-left pr-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight capitalize">
                  {user?.role?.toLowerCase().replace('_', ' ') || 'User'}
                </p>
              </div>
            </button>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  );
});
Navbar.displayName = 'Navbar';
