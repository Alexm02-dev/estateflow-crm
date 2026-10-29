import React from 'react';
import { LeadActivity, ActivityType } from '../../types';
import {
  Phone,
  Mail,
  FileText,
  Calendar,
  Building2,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';

interface ActivityTimelineProps {
  activities: LeadActivity[];
  isLoading?: boolean;
  emptyMessage?: string;
  maxItems?: number;
}

interface ActivityStyle {
  icon: React.ReactNode;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
  label: string;
}

const getActivityStyle = (type: ActivityType | string): ActivityStyle => {
  switch (type) {
    case 'CALL':
      return {
        icon: <Phone className="w-3.5 h-3.5" />,
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        badgeText: 'Phone Call',
        ringColor: 'bg-emerald-500',
        label: 'Call Logged',
      };
    case 'EMAIL':
      return {
        icon: <Mail className="w-3.5 h-3.5" />,
        badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
        badgeText: 'Email',
        ringColor: 'bg-sky-500',
        label: 'Email Sent / Received',
      };
    case 'NOTE':
      return {
        icon: <FileText className="w-3.5 h-3.5" />,
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
        badgeText: 'Internal Note',
        ringColor: 'bg-amber-500',
        label: 'Note Recorded',
      };
    case 'MEETING':
      return {
        icon: <Calendar className="w-3.5 h-3.5" />,
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300',
        badgeText: 'Meeting',
        ringColor: 'bg-purple-500',
        label: 'In-Person Meeting',
      };
    case 'SITE_VISIT':
      return {
        icon: <Building2 className="w-3.5 h-3.5" />,
        badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
        badgeText: 'Site Visit',
        ringColor: 'bg-indigo-500',
        label: 'Property Site Tour',
      };
    case 'STATUS_CHANGE':
      return {
        icon: <Sparkles className="w-3.5 h-3.5" />,
        badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300',
        badgeText: 'Stage Transition',
        ringColor: 'bg-orange-500',
        label: 'Funnel Stage Updated',
      };
    case 'ASSIGNMENT':
      return {
        icon: <UserCheck className="w-3.5 h-3.5" />,
        badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300',
        badgeText: 'Ownership',
        ringColor: 'bg-teal-500',
        label: 'Lead Reassigned',
      };
    case 'BOOKING':
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
        badgeText: 'Reservation',
        ringColor: 'bg-emerald-600',
        label: 'Unit Reserved / Booked',
      };
    default:
      return {
        icon: <Clock className="w-3.5 h-3.5" />,
        badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        badgeText: type,
        ringColor: 'bg-slate-400',
        label: type,
      };
  }
};

const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoString;
  }
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  isLoading = false,
  emptyMessage = 'No interactions recorded yet.',
  maxItems,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
        {emptyMessage}
      </div>
    );
  }

  const items = maxItems ? activities.slice(0, maxItems) : activities;

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {items.map((act) => {
        const style = getActivityStyle(act.type);
        return (
          <div key={act.id} className="relative group/timeline">
            {/* Timeline bullet dot */}
            <span
              className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ${style.ringColor} ring-4 ring-white dark:ring-slate-900 transition-transform group-hover/timeline:scale-125`}
            />

            <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${style.badgeBg}`}
                  >
                    {style.icon}
                    <span>{style.badgeText}</span>
                  </span>
                  {act.userName && (
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {act.userName}
                    </span>
                  )}
                </div>
                <span
                  className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap"
                  title={new Date(act.createdAt).toLocaleString()}
                >
                  {formatRelativeTime(act.createdAt)}
                </span>
              </div>

              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {act.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
