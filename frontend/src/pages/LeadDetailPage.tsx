import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leadsApi';
import { followUpsApi } from '../api/followUpsApi';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Building2,
  DollarSign,
  User,
  Plus,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  AlertCircle,
  Key,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Skeleton } from '../components/common/SkeletonLoader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { ActivityTimeline } from '../components/leads/ActivityTimeline';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const leadId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteType, setNoteType] = useState('NOTE');
  const [noteText, setNoteText] = useState('');

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [completeTargetId, setCompleteTargetId] = useState<number | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Queries
  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadsApi.getLeadById(leadId),
    enabled: !isNaN(leadId),
  });

  const { data: activities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: () => leadsApi.getLeadActivities(leadId),
    enabled: !isNaN(leadId),
  });

  const { data: followUps } = useQuery({
    queryKey: ['lead-followups', leadId],
    queryFn: () => followUpsApi.getFollowUpsForLead(leadId),
    enabled: !isNaN(leadId),
  });

  // Mutations
  const addActivityMutation = useMutation({
    mutationFn: (data: { type: string; description: string }) =>
      leadsApi.addLeadActivity(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
      setIsNoteModalOpen(false);
      setNoteText('');
    },
  });

  const scheduleFollowUpMutation = useMutation({
    mutationFn: (data: { leadId: number; scheduledAt: string; notes?: string }) =>
      followUpsApi.createFollowUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-followups', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
      setIsFollowUpModalOpen(false);
      setFollowUpDate('');
      setFollowUpNotes('');
    },
  });

  const completeFollowUpMutation = useMutation({
    mutationFn: ({ fId, notes }: { fId: number; notes: string }) =>
      followUpsApi.completeFollowUp(fId, { completionNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-followups', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
      setCompleteTargetId(null);
      setCompletionNotes('');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Lead record could not be loaded</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">You may not have authorization to view this customer inquiry.</p>
        <Link to="/leads">
          <Button variant="secondary" size="sm">Back to Leads</Button>
        </Link>
      </div>
    );
  }

  const formatCurrency = (val: number | undefined) => {
    if (!val) return 'Not Specified';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <Breadcrumbs
        items={[
          { label: 'Leads', path: '/leads' },
          { label: lead.fullName },
        ]}
      />

      {/* Back Button and Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/leads"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {lead.fullName}
              </h1>
              <StatusBadge status={lead.stage} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{lead.leadCode}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<MessageSquare className="w-4 h-4" />}
            onClick={() => setIsNoteModalOpen(true)}
          >
            Add Note
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<Calendar className="w-4 h-4" />}
            onClick={() => setIsFollowUpModalOpen(true)}
          >
            Schedule Follow-up
          </Button>

          {lead.stage !== 'BOOKED' && lead.stage !== 'LOST' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Key className="w-4 h-4" />}
              onClick={() => navigate(`/bookings/new?leadId=${lead.id}`)}
            >
              Book Property Unit
            </Button>
          )}

          <Link to={`/leads/${lead.id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Details Overview + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Information Cards */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Customer Contact Profile
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Phone Number</span>
                  <a href={`tel:${lead.phone}`} className="font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-600">
                    {lead.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Email Address</span>
                  <a href={`mailto:${lead.email}`} className="font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-600 truncate max-w-[200px] block">
                    {lead.email || 'None on file'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Interested Project</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {lead.interestedProjectName || 'Open to recommendations'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-850">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Estimated Budget</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(lead.budget)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-850">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Assigned Sales Agent</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {lead.assignedToName || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {lead.notes && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">General Notes</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>

          {/* Follow-ups Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Scheduled Follow-ups
              </h2>
              <button
                onClick={() => setIsFollowUpModalOpen(true)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
              >
                + Schedule
              </button>
            </div>

            {followUps && followUps.length > 0 ? (
              <div className="space-y-2">
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(fu.scheduledAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <StatusBadge status={fu.status} />
                    </div>
                    {fu.notes && <p className="text-slate-600 dark:text-slate-300">{fu.notes}</p>}
                    {fu.status === 'PENDING' && (
                      <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCompleteTargetId(fu.id)}
                        >
                          Mark Completed
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No follow-ups recorded.</p>
            )}
          </div>
        </div>

        {/* Right Column: Comprehensive Activity Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Interaction & Activity Timeline</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chronological history of interactions, notes, and milestones</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsNoteModalOpen(true)}>
              + Log Interaction
            </Button>
          </div>

          <div className="mt-6">
            {isActivitiesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !activities || activities.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No interactions recorded yet"
                description="Keep your team in sync by logging phone calls, emails, site visits, and negotiation discussions."
                actionLabel="Add First Note"
                onAction={() => setIsNoteModalOpen(true)}
              />
            ) : (
              <ActivityTimeline
                activities={activities}
                isLoading={isActivitiesLoading}
                emptyMessage="No interactions recorded yet."
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Activity Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Record Activity / Add Note"
        description={`Log an interaction for ${lead.fullName}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (noteText.trim()) {
              addActivityMutation.mutate({ type: noteType, description: noteText.trim() });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Activity Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="NOTE">General Note</option>
              <option value="CALL">Phone Call</option>
              <option value="EMAIL">Email Sent/Received</option>
              <option value="MEETING">In-Person Meeting</option>
              <option value="SITE_VISIT">Property Site Visit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Summary</label>
            <textarea
              required
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter interaction details, buyer feedback, or discussion summary..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={addActivityMutation.isPending}>
              Save Interaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Schedule Follow-up"
        description={`Set a reminder to contact ${lead.fullName}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (followUpDate) {
              scheduleFollowUpMutation.mutate({
                leadId,
                scheduledAt: followUpDate,
                notes: followUpNotes.trim(),
              });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              required
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Action Items / Reminder Notes</label>
            <textarea
              rows={3}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="e.g. Call to review revised mortgage pre-approval documents..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={scheduleFollowUpMutation.isPending}>
              Schedule Reminder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Follow-up Modal */}
      <Modal
        isOpen={completeTargetId !== null}
        onClose={() => setCompleteTargetId(null)}
        title="Complete Follow-up Task"
        description="Record outcome and notes for this client consultation"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (completeTargetId) {
              completeFollowUpMutation.mutate({
                fId: completeTargetId,
                notes: completionNotes.trim() || 'Completed as scheduled.',
              });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Completion Outcome / Notes
            </label>
            <textarea
              required
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g. Discussed 2 BHK unit specifications. Client confirmed site visit for Saturday..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCompleteTargetId(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={completeFollowUpMutation.isPending}>
              Mark Completed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
