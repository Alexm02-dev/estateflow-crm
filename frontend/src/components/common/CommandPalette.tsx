import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  Calendar,
  Building,
  Home,
  CheckCircle2,
  PlusCircle,
  FileText,
  Settings,
  Shield,
  ExternalLink,
  Moon,
  Sun,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Quick Actions' | 'Leads Filter' | 'System';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Quick Actions
      {
        id: 'new-lead',
        title: 'Create New Lead',
        subtitle: 'Capture and qualify a prospective buyer',
        category: 'Quick Actions',
        icon: PlusCircle,
        action: () => navigate('/leads/new'),
        keywords: ['lead', 'add', 'create', 'new', 'buyer'],
      },
      {
        id: 'new-booking',
        title: 'New Unit Reservation Wizard',
        subtitle: 'Reserve a property unit for a qualified buyer',
        category: 'Quick Actions',
        icon: CheckCircle2,
        action: () => navigate('/bookings/new'),
        keywords: ['book', 'reservation', 'unit', 'wizard', 'deal'],
      },

      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Dashboard Overview',
        subtitle: 'Pipeline KPIs, charts, and revenue metrics',
        category: 'Navigation',
        icon: LayoutDashboard,
        action: () => navigate('/'),
        keywords: ['home', 'kpi', 'metrics', 'stats', 'analytics'],
      },
      {
        id: 'nav-leads',
        title: 'Leads Management',
        subtitle: 'Pipeline table, stage filtering, and bulk operations',
        category: 'Navigation',
        icon: Users,
        action: () => navigate('/leads'),
        keywords: ['leads', 'contacts', 'customers', 'pipeline'],
      },
      {
        id: 'nav-follow-ups',
        title: 'Follow-ups & Reminders',
        subtitle: 'Scheduled appointments, calls, and overdue tasks',
        category: 'Navigation',
        icon: Calendar,
        action: () => navigate('/follow-ups'),
        keywords: ['tasks', 'reminders', 'schedule', 'appointments', 'calls'],
      },
      {
        id: 'nav-projects',
        title: 'Projects Directory',
        subtitle: 'Real estate developments, buildings, and master plans',
        category: 'Navigation',
        icon: Building,
        action: () => navigate('/projects'),
        keywords: ['projects', 'developments', 'buildings', 'properties'],
      },
      {
        id: 'nav-units',
        title: 'Units Inventory',
        subtitle: 'Available, reserved, and booked property listings',
        category: 'Navigation',
        icon: Home,
        action: () => navigate('/units'),
        keywords: ['inventory', 'apartments', 'units', 'stock'],
      },
      {
        id: 'nav-bookings',
        title: 'Bookings & Contracts',
        subtitle: 'Confirmed agreements, payment tokens, and settlements',
        category: 'Navigation',
        icon: CheckCircle2,
        action: () => navigate('/bookings'),
        keywords: ['transactions', 'deals', 'contracts', 'sales'],
      },

      // Quick Filters for Leads
      {
        id: 'filter-new',
        title: 'View New Inquiries',
        subtitle: 'Filter leads at Stage: NEW',
        category: 'Leads Filter',
        icon: Sparkles,
        action: () => navigate('/leads?stage=NEW'),
        keywords: ['uncontacted', 'recent', 'fresh'],
      },
      {
        id: 'filter-contacted',
        title: 'View Contacted Leads',
        subtitle: 'Filter leads at Stage: CONTACTED',
        category: 'Leads Filter',
        icon: Users,
        action: () => navigate('/leads?stage=CONTACTED'),
        keywords: ['contacted', 'engaged'],
      },
      {
        id: 'filter-site-visit',
        title: 'View Site Visits',
        subtitle: 'Filter leads at Stage: SITE_VISIT',
        category: 'Leads Filter',
        icon: Calendar,
        action: () => navigate('/leads?stage=SITE_VISIT'),
        keywords: ['tours', 'visit', 'showing'],
      },
      {
        id: 'filter-booked',
        title: 'View Converted / Booked Leads',
        subtitle: 'Filter leads at Stage: BOOKED',
        category: 'Leads Filter',
        icon: CheckCircle2,
        action: () => navigate('/leads?stage=BOOKED'),
        keywords: ['converted', 'won', 'success'],
      },

      // System Actions
      {
        id: 'toggle-theme',
        title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
        subtitle: `Currently using ${theme} appearance`,
        category: 'System',
        icon: theme === 'dark' ? Sun : Moon,
        action: toggleTheme,
        keywords: ['theme', 'dark', 'light', 'appearance', 'mode'],
      },
      {
        id: 'nav-settings',
        title: 'Account Settings',
        subtitle: 'Personal preferences and security options',
        category: 'System',
        icon: Settings,
        action: () => navigate('/settings'),
        keywords: ['profile', 'password', 'config'],
      },
      {
        id: 'swagger-docs',
        title: 'API Swagger Documentation',
        subtitle: 'Inspect live Spring Boot REST endpoints in new tab',
        category: 'System',
        icon: ExternalLink,
        action: () => window.open('http://localhost:8080/swagger-ui.html', '_blank'),
        keywords: ['api', 'swagger', 'docs', 'rest', 'backend'],
      },
    ];

    if (isAdmin) {
      list.push(
        {
          id: 'nav-employees',
          title: 'Staff & Employees',
          subtitle: 'Manage administrative and sales agent accounts',
          category: 'Navigation',
          icon: Shield,
          action: () => navigate('/employees'),
          keywords: ['team', 'staff', 'agents', 'users', 'admin'],
        },
        {
          id: 'nav-reports',
          title: 'Sales & Revenue Reports',
          subtitle: 'Financial realization and conversion velocity reports',
          category: 'Navigation',
          icon: FileText,
          action: () => navigate('/reports'),
          keywords: ['reports', 'analytics', 'revenue', 'performance'],
        }
      );
    }

    return list;
  }, [navigate, isAdmin, theme, toggleTheme]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();
    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(q);
      const matchKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard events inside command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in-0 duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search pages, or filter leads..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            aria-label="Search commands"
          />
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="overflow-y-auto p-2 space-y-1 max-h-[420px]"
          role="listbox"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No commands found matching "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for "lead", "booking", or "filter"</p>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer select-none transition-colors ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-900 dark:text-brand-100 ring-1 ring-brand-300 dark:ring-brand-700'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">
                        {cmd.title}
                      </p>
                      {cmd.subtitle && (
                        <p className="text-xs text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {cmd.category}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-2xs mr-1">↑↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-2xs mr-1">↵</kbd>
              Select
            </span>
          </div>
          <span>EstateFlow Productivity</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
