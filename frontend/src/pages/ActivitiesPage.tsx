import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leadsApi';
import { employeesApi } from '../api/employeesApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { LeadActivity, ActivityType } from '../types';
import {
  CalendarClock,
  Plus,
  Phone,
  Mail,
  Calendar,
  Building,
  CheckCircle2,
  FileText,
  Clock,
  User,
  Filter,
  Sparkles,
  ArrowRight,
  Search,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { UserAvatar } from '../components/common/UserAvatar';
import { SearchInput } from '../components/common/SearchInput';
import { Link } from 'react-router-dom';

interface EnrichedActivity extends LeadActivity {
  leadName?: string;
  leadCode?: string;
  leadPhone?: string;
}

export const ActivitiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('ALL');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form states
  const [targetLeadId, setTargetLeadId] = useState<string>('');
  const [activityType, setActivityType] = useState<ActivityType>('CALL');
  const [description, setDescription] = useState('');

  // 1. Fetch leads
  const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['leads-all-for-activities'],
    queryFn: () => leadsApi.getLeads({ size: 100 }),
  });

  // 2. Fetch sales employees
  const { data: salesAgents } = useQuery({
    queryKey: ['sales-agents-list'],
    queryFn: employeesApi.getSalesEmployees,
  });

  const leads = useMemo(() => leadsData?.content || [], [leadsData]);

  // 3. Fetch activities for all leads in parallel
  const { data: allActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['all-leads-aggregated-activities', leads.map((l) => l.id)],
    queryFn: async () => {
      if (leads.length === 0) return [];
      const promises = leads.map(async (lead) => {
        try {
          const acts = await leadsApi.getLeadActivities(lead.id);
          return acts.map((a) => ({
            ...a,
            leadName: lead.fullName,
            leadCode: lead.leadCode,
            leadPhone: lead.phone,
          }));
        } catch {
          return [];
        }
      });
      const results = await Promise.all(promises);
      const flattened = results.flat();
      return flattened.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: leads.length > 0,
  });

  // Create Activity Mutation
  const createMutation = useMutation({
    mutationFn: ({ leadId, type, description }: { leadId: number; type: string; description: string }) =>
      leadsApi.addLeadActivity(leadId, { type, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-leads-aggregated-activities'] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities'] });
      toast.success('Sales activity logged successfully');
      setIsLogModalOpen(false);
      setTargetLeadId('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error('Failed to log activity', err.response?.data?.message || err.message);
    },
  });

  const handleLogActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLeadId) {
      toast.error('Validation error', 'Please select a prospect lead');
      return;
    }
    if (!description.trim()) {
      toast.error('Validation error', 'Please enter activity notes/description');
      return;
    }
    createMutation.mutate({
      leadId: Number(targetLeadId),
      type: activityType,
      description: description.trim(),
    });
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    return allActivities.filter((act) => {
      if (selectedType !== 'ALL' && act.type !== selectedType) return false;
      if (selectedAgentId !== 'ALL' && String(act.userId) !== selectedAgentId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDesc = act.description?.toLowerCase().includes(q);
        const matchLead = act.leadName?.toLowerCase().includes(q);
        const matchCode = act.leadCode?.toLowerCase().includes(q);
        if (!matchDesc && !matchLead && !matchCode) return false;
      }
      return true;
    });
  }, [allActivities, selectedType, selectedAgentId, search]);

  const getActivityBadge = (type: ActivityType) => {
    switch (type) {
      case 'CALL':
        return {
          icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
          bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
        };
      case 'EMAIL':
        return {
          icon: <Mail className="w-3.5 h-3.5 text-indigo-500" />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
        };
      case 'MEETING':
        return {
          icon: <Calendar className="w-3.5 h-3.5 text-purple-500" />,
          bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
        };
      case 'SITE_VISIT':
        return {
          icon: <Building className="w-3.5 h-3.5 text-amber-500" />,
          bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
        };
      case 'BOOKING':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
        };
      default:
        return {
          icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
          bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
        };
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Sales & Customer Activities"
        description="Comprehensive audit trail of calls, site walkthroughs, negotiations, notes, and bookings across all pipeline leads."
        breadcrumbs={[{ label: 'Activities' }]}
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsLogModalOpen(true)}
          >
            Log Activity
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChangeValue={setSearch}
            placeholder="Search notes, lead name, code..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Filter activity type"
          >
            <option value="ALL">All Interaction Types</option>
            <option value="CALL">Phone Calls</option>
            <option value="MEETING">In-Person Meetings</option>
            <option value="SITE_VISIT">Site Visits</option>
            <option value="NOTE">Internal Notes</option>
            <option value="BOOKING">Bookings & Contracts</option>
            <option value="EMAIL">Email Communications</option>
          </select>

          {/* Agent Filter */}
          {salesAgents && salesAgents.length > 0 && (
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Filter by sales representative"
            >
              <option value="ALL">All Team Members</option>
              {salesAgents.map((ag) => (
                <option key={ag.id} value={String(ag.id)}>
                  {ag.name}
                </option>
              ))}
            </select>
          )}

          {(selectedType !== 'ALL' || selectedAgentId !== 'ALL' || search) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedType('ALL');
                setSelectedAgentId('ALL');
                setSearch('');
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Activity Timeline Feed */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Chronological Event Timeline</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {filteredActivities.length} total events
          </span>
        </div>

        {isActivitiesLoading || isLeadsLoading ? (
          <div className="space-y-4 py-8">
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No activities found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredActivities.map((act) => {
              const badge = getActivityBadge(act.type);
              return (
                <div key={act.id} className="relative group">
                  {/* Dot on timeline */}
                  <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-brand-500 ring-4 ring-white dark:ring-[#111827]" />

                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-500/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                        >
                          {badge.icon}
                          {act.type.replace('_', ' ')}
                        </span>
                        {act.leadName && (
                          <Link
                            to={`/leads/${act.leadId}`}
                            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            {act.leadName} ({act.leadCode})
                          </Link>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDate(act.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {act.description}
                    </p>

                    {act.leadPhone && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" /> Lead Contact: {act.leadPhone}
                        </span>
                        <Link
                          to={`/leads/${act.leadId}`}
                          className="text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 font-semibold text-[11px]"
                        >
                          View Lead Record <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Activity Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Sales Activity"
      >
        <form onSubmit={handleLogActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Prospect Lead *
            </label>
            <select
              value={targetLeadId}
              onChange={(e) => setTargetLeadId(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            >
              <option value="">-- Choose Lead --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName} ({l.leadCode}) • {l.stage}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Activity Type *
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="CALL">Phone Call</option>
              <option value="MEETING">In-Person Meeting</option>
              <option value="SITE_VISIT">Site Visit Walkthrough</option>
              <option value="NOTE">Internal Note / Briefing</option>
              <option value="EMAIL">Email Dispatch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Outcome Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Record details of conversation, customer requirements, or decisions..."
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-slate-400"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsLogModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createMutation.isPending}
            >
              Save Activity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
