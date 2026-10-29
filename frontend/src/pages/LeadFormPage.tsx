import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leadsApi';
import { projectsApi } from '../api/projectsApi';
import { employeesApi } from '../api/employeesApi';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

const leadSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().trim().min(5, 'Phone number must be at least 5 digits').max(20),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  leadSource: z.enum(['WEBSITE', 'REFERRAL', 'WALK_IN', 'SOCIAL_MEDIA', 'CALL_IN', 'CAMPAIGN', 'BROKER', 'OTHER']),
  interestedProjectId: z.string().optional(),
  budget: z.coerce.number().min(0, 'Budget must be a positive number').optional(),
  assignedToId: z.string().optional(),
  stage: z.enum(['NEW', 'CONTACTED', 'SITE_VISIT', 'INTERESTED', 'NEGOTIATION', 'LOST']).optional(),
  nextFollowUpDate: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export const LeadFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const leadId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      leadSource: 'WEBSITE',
      stage: 'NEW',
    },
  });

  // Queries
  const { data: lead, isLoading: isLeadLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadsApi.getLeadById(leadId),
    enabled: isEditing && !isNaN(leadId),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: projectsApi.getProjects,
  });

  const { data: salesAgents } = useQuery({
    queryKey: ['sales-agents-list'],
    queryFn: employeesApi.getSalesEmployees,
    enabled: isAdmin,
  });

  useEffect(() => {
    if (lead) {
      reset({
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email || '',
        leadSource: lead.leadSource,
        interestedProjectId: lead.interestedProjectId ? String(lead.interestedProjectId) : '',
        budget: lead.budget || 0,
        assignedToId: lead.assignedToId ? String(lead.assignedToId) : '',
        stage: (lead.stage === 'BOOKED' ? 'NEGOTIATION' : lead.stage) as any,
        nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.substring(0, 16) : '',
        notes: lead.notes || '',
      });
    }
  }, [lead, reset]);

  // Submit mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => leadsApi.createLead(data),
    onSuccess: (newLead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      navigate(`/leads/${newLead.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => leadsApi.updateLead(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      navigate(`/leads/${leadId}`);
    },
  });

  const onSubmit = (values: LeadFormValues) => {
    const payload: any = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      leadSource: values.leadSource,
      interestedProjectId: values.interestedProjectId ? Number(values.interestedProjectId) : undefined,
      budget: values.budget !== undefined && values.budget > 0 ? values.budget : undefined,
      assignedToId: values.assignedToId ? Number(values.assignedToId) : undefined,
      stage: values.stage || 'NEW',
      nextFollowUpDate: values.nextFollowUpDate ? values.nextFollowUpDate + ':00' : undefined,
      notes: values.notes,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const submitError = (createMutation.error as any)?.response?.data?.message ||
                      (updateMutation.error as any)?.response?.data?.message;

  if (isEditing && isLeadLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      <Breadcrumbs
        items={[
          { label: 'Leads', path: '/leads' },
          { label: isEditing ? (lead?.fullName || 'Edit') : 'Create Lead' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={isEditing ? `/leads/${leadId}` : '/leads'}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {isEditing ? `Edit Lead: ${lead?.fullName}` : 'Create New Lead Inquiry'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isEditing ? 'Update buyer preferences, budget, or assignment' : 'Enter lead contact information and requirements'}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Contact Profile */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Personal & Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('fullName')}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {errors.fullName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="e.g. +1 555-0192"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="e.g. eleanor@example.com"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Acquisition Source <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('leadSource')}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="WEBSITE">Official Website</option>
                  <option value="REFERRAL">Client Referral</option>
                  <option value="WALK_IN">Sales Gallery Walk-in</option>
                  <option value="SOCIAL_MEDIA">Social Media Campaign</option>
                  <option value="CALL_IN">Inbound Call</option>
                  <option value="CAMPAIGN">Direct Campaign</option>
                  <option value="BROKER">Channel Broker / Partner</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.leadSource && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.leadSource.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Property Interest & Budget */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Interest, Pipeline & Qualification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interested Development Project
                </label>
                <select
                  {...register('interestedProjectId')}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">-- Any / Undecided Project --</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Budget (USD)
                </label>
                <input
                  type="number"
                  step="1000"
                  {...register('budget')}
                  placeholder="e.g. 750000"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {errors.budget && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.budget.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sales Funnel Stage
                </label>
                <select
                  {...register('stage')}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="NEW">New Inquiry</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="SITE_VISIT">Site Visit Scheduled</option>
                  <option value="INTERESTED">Interested / Shortlisted</option>
                  <option value="NEGOTIATION">Under Negotiation</option>
                  <option value="LOST">Lost Deal</option>
                </select>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Note: "Booked" status can only be achieved via the authoritative Unit Booking workflow.
                </span>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign to Sales Representative
                  </label>
                  <select
                    {...register('assignedToId')}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {salesAgents?.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Next Follow-up Reminder
                </label>
                <input
                  type="datetime-local"
                  {...register('nextFollowUpDate')}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Internal Observations & Discussion Notes
            </label>
            <textarea
              rows={4}
              {...register('notes')}
              placeholder="e.g. Client seeks top-floor view, pre-approved loan with Bank of America, requested floor plans..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link to={isEditing ? `/leads/${leadId}` : '/leads'}>
              <Button variant="secondary" size="md" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
              icon={<Save className="w-4 h-4" />}
            >
              {isEditing ? 'Save Changes' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
