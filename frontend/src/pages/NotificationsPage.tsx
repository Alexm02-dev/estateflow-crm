import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUpsApi } from '../api/followUpsApi';
import { leadsApi } from '../api/leadsApi';
import { bookingsApi } from '../api/bookingsApi';
import { useToast } from '../context/ToastContext';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  Building,
  ArrowRight,
  ShieldCheck,
  Check,
  Phone,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Link, useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  type: 'OVERDUE' | 'DUE_TODAY' | 'NEW_LEAD' | 'BOOKING';
  title: string;
  description: string;
  timestamp: string;
  linkText?: string;
  linkUrl?: string;
  actionText?: string;
  actionCallback?: () => void;
  followUpId?: number;
}

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'LEADS' | 'BOOKINGS'>('ALL');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // 1. Fetch overdue follow-ups
  const { data: followUpsData, isLoading: isFollowUpsLoading } = useQuery({
    queryKey: ['notifications-followups'],
    queryFn: () => followUpsApi.getFollowUps({ size: 50 }),
  });

  // 2. Fetch new leads
  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['notifications-leads'],
    queryFn: () => leadsApi.getLeads({ size: 20, stage: 'NEW' }),
  });

  // 3. Fetch recent bookings
  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['notifications-bookings'],
    queryFn: () => bookingsApi.getBookings({ size: 10 }),
  });

  // Complete follow-up mutation
  const completeMutation = useMutation({
    mutationFn: (id: number) =>
      followUpsApi.completeFollowUp(id, { completionNotes: 'Resolved from Notifications Center' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Task marked completed');
    },
  });

  // Aggregate notification items
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // Overdue & Today's Follow-ups
    const followUps = followUpsData?.content || [];
    const now = new Date().getTime();

    followUps.forEach((fu) => {
      if (fu.status === 'COMPLETED') return;
      const scheduledTime = new Date(fu.scheduledAt).getTime();
      const isOverdue = scheduledTime < now;
      const isToday = !isOverdue && scheduledTime - now < 86400000;

      if (isOverdue) {
        list.push({
          id: `fu-${fu.id}`,
          type: 'OVERDUE',
          title: `Overdue Task: ${fu.leadName}`,
          description: fu.notes || 'Immediate follow-up required for client inquiry.',
          timestamp: fu.scheduledAt,
          linkText: 'Open Lead',
          linkUrl: `/leads/${fu.leadId}`,
          actionText: 'Mark Complete',
          followUpId: fu.id,
          actionCallback: () => completeMutation.mutate(fu.id),
        });
      } else if (isToday) {
        list.push({
          id: `fu-${fu.id}`,
          type: 'DUE_TODAY',
          title: `Follow-up Due Today: ${fu.leadName}`,
          description: fu.notes || 'Scheduled appointment or consultation call today.',
          timestamp: fu.scheduledAt,
          linkText: 'Open Lead',
          linkUrl: `/leads/${fu.leadId}`,
          actionText: 'Mark Complete',
          followUpId: fu.id,
          actionCallback: () => completeMutation.mutate(fu.id),
        });
      }
    });

    // Recent Bookings
    const bookings = bookingsData?.content || [];
    bookings.forEach((b) => {
      list.push({
        id: `bk-${b.id}`,
        type: 'BOOKING',
        title: `Confirmed Reservation: ${b.bookingReference}`,
        description: `Unit ${b.unitNumber} (${b.projectName}) reserved by ${b.customerName || 'Buyer'}. Token deposit of $${b.bookingAmount.toLocaleString()} recorded.`,
        timestamp: b.bookingDate,
        linkText: 'View Agreement',
        linkUrl: `/bookings/${b.id}`,
      });
    });

    // New Leads
    const leads = leadsData?.content || [];
    leads.forEach((l) => {
      list.push({
        id: `ld-${l.id}`,
        type: 'NEW_LEAD',
        title: `New Inquiry Ingested: ${l.fullName}`,
        description: `Source: ${l.leadSource} • Budget: $${(l.budget || 0).toLocaleString()} • Phone: ${l.phone}`,
        timestamp: l.createdAt,
        linkText: 'Review Prospect',
        linkUrl: `/leads/${l.id}`,
      });
    });

    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [followUpsData, bookingsData, leadsData, completeMutation]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (dismissedIds.includes(n.id)) return false;
      if (filterType === 'OVERDUE' && n.type !== 'OVERDUE') return false;
      if (filterType === 'TODAY' && n.type !== 'DUE_TODAY') return false;
      if (filterType === 'LEADS' && n.type !== 'NEW_LEAD') return false;
      if (filterType === 'BOOKINGS' && n.type !== 'BOOKING') return false;
      return true;
    });
  }, [notifications, dismissedIds, filterType]);

  const formatRelativeTime = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(Math.abs(diff) / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);

      if (diff > 0) {
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
      } else {
        if (mins < 60) return `in ${mins}m`;
        if (hours < 24) return `in ${hours}h`;
        return `in ${days}d`;
      }
    } catch {
      return iso;
    }
  };

  const getStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'OVERDUE':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
          cardBg: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60',
          badgeText: 'Overdue Alert',
          badgeColor: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60',
        };
      case 'DUE_TODAY':
        return {
          icon: <Clock className="w-4 h-4 text-amber-500" />,
          cardBg: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60',
          badgeText: 'Due Today',
          badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60',
        };
      case 'BOOKING':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
          cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60',
          badgeText: 'Contract Confirmed',
          badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60',
        };
      default:
        return {
          icon: <Users className="w-4 h-4 text-blue-500" />,
          cardBg: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60',
          badgeText: 'New Lead',
          badgeColor: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60',
        };
    }
  };

  const handleDismissAll = () => {
    setDismissedIds(notifications.map((n) => n.id));
    toast.info('Notifications dismissed');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Notifications & System Alerts"
        description="High-priority reminders, scheduled appointments, overdue follow-ups, and transaction updates requiring your attention."
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          filteredNotifications.length > 0 ? (
            <Button
              variant="outline"
              size="md"
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={handleDismissAll}
            >
              Clear All Visible
            </Button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'ALL'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('OVERDUE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'OVERDUE'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Overdue Tasks ({notifications.filter((n) => n.type === 'OVERDUE').length})
        </button>
        <button
          onClick={() => setFilterType('TODAY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'TODAY'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Due Today ({notifications.filter((n) => n.type === 'DUE_TODAY').length})
        </button>
        <button
          onClick={() => setFilterType('BOOKINGS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'BOOKINGS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Confirmed Bookings ({notifications.filter((n) => n.type === 'BOOKING').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isFollowUpsLoading || isLeadsLoading || isBookingsLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-white dark:bg-slate-900 rounded-xl animate-pulse" />
            <div className="h-20 bg-white dark:bg-slate-900 rounded-xl animate-pulse" />
            <div className="h-20 bg-white dark:bg-slate-900 rounded-xl animate-pulse" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">All caught up!</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no pending alerts or overdue tasks matching the selected filter.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const style = getStyle(item.type);
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border ${style.cardBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 p-2 rounded-lg bg-white dark:bg-slate-900 shadow-2xs flex-shrink-0">
                    {style.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${style.badgeColor}`}>
                        {style.badgeText}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  {item.actionText && item.actionCallback && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={item.actionCallback}
                    >
                      {item.actionText}
                    </Button>
                  )}
                  {item.linkText && item.linkUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(item.linkUrl!)}
                    >
                      {item.linkText}
                    </Button>
                  )}
                  <button
                    onClick={() => setDismissedIds((prev) => [...prev, item.id])}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                    title="Dismiss notification"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
