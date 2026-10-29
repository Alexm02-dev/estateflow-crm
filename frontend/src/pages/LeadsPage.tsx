import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { leadsApi } from '../api/leadsApi';
import { projectsApi } from '../api/projectsApi';
import { employeesApi } from '../api/employeesApi';
import { followUpsApi } from '../api/followUpsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lead, LeadStage, LeadSource } from '../types';
import {
  Users,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Building,
  UserCheck,
  Download,
  ExternalLink,
  DollarSign,
  ArrowRight,
  Clock,
  Briefcase,
  AlertCircle,
  Columns,
  Layers,
  MessageSquare,
  CalendarPlus,
  FileText,
  Check,
  Sparkles,
  SlidersHorizontal,
  Smartphone,
  Laptop,
  X,
  LayoutList,
  Kanban,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/common/SearchInput';
import { StatusBadge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { PageHeader } from '../components/common/PageHeader';
import { FilterToolbar, ActiveFilter } from '../components/common/FilterToolbar';
import { DataTable, Column, TableDensity } from '../components/common/DataTable';
import { DataTableToolbar } from '../components/common/DataTableToolbar';
import { RecordDetailDrawer } from '../components/common/RecordDetailDrawer';
import { UserAvatar } from '../components/common/UserAvatar';
import { LeadDetailsPopover } from '../components/leads/LeadDetailsPopover';
import { LeadStatusBadge } from '../components/leads/LeadStatusBadge';
import { LeadCheckbox } from '../components/leads/LeadCheckbox';
import { LeadKanbanBoard } from '../components/leads/LeadKanbanBoard';
import { ActivityTimeline } from '../components/leads/ActivityTimeline';
import { exportToCsv } from '../utils/csvExport';

type SavedViewKey = 'all' | 'my' | 'new' | 'site_visit' | 'converted' | 'high_budget';

export const DEFAULT_VISIBLE_COLUMNS = [
  'fullName',
  'contact',
  'project',
  'assignedTo',
  'stage',
  'actions',
];

export const ALL_TOGGLEABLE_COLUMNS = [
  { key: 'fullName', label: 'Lead Name & ID', locked: true, description: 'Required' },
  { key: 'contact', label: 'Contact Info' },
  { key: 'project', label: 'Project & Budget' },
  { key: 'leadSource', label: 'Source Channel' },
  { key: 'assignedTo', label: 'Assigned Agent' },
  { key: 'stage', label: 'Stage Status' },
  { key: 'nextFollowUpDate', label: 'Follow-up Date' },
];

export const LeadsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Initialize filters from search parameters
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '');

  // Debounce search by 250ms for query fetching to avoid network hammering
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);
  const [selectedStage, setSelectedStage] = useState<string>(() => searchParams.get('stage') || '');
  const [selectedSource, setSelectedSource] = useState<string>(() => searchParams.get('source') || '');
  const [selectedProject, setSelectedProject] = useState<string>(() => searchParams.get('project') || '');
  const [selectedAgent, setSelectedAgent] = useState<string>(() => searchParams.get('agent') || '');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Saved View state
  const [savedView, setSavedView] = useState<SavedViewKey>(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam === 'NEW') return 'new';
    if (stageParam === 'SITE_VISIT') return 'site_visit';
    if (stageParam === 'BOOKED') return 'converted';
    return 'all';
  });

  // Table Density & Column Visibility state
  const [density, setDensity] = useState<TableDensity>(() => {
    return (localStorage.getItem('estate_leads_density') as TableDensity) || 'normal';
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('estate_leads_columns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.includes('fullName')) parsed.unshift('fullName');
          if (!parsed.includes('actions')) parsed.push('actions');
          return parsed;
        }
      } catch {
        // ignore fallback
      }
    }
    return DEFAULT_VISIBLE_COLUMNS;
  });

  // Close column dropdown on outside click, touch, or escape
  useEffect(() => {
    if (!showColumnDropdown) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target as Node)) {
        setShowColumnDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowColumnDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showColumnDropdown]);

  // Table vs Kanban View Mode
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(() => {
    return (localStorage.getItem('estate_leads_view_mode') as 'table' | 'kanban') || 'table';
  });

  // Mobile stacked view vs desktop table toggle
  const [isMobileCardView, setIsMobileCardView] = useState(false);

  // Multi-row Selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<(number | string)[]>([]);

  // Modals & Drawer State
  const [activeLeadDrawer, setActiveLeadDrawer] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkStageModal, setShowBulkStageModal] = useState(false);
  const [targetAssigneeId, setTargetAssigneeId] = useState<number | ''>('');
  const [targetStage, setTargetStage] = useState<string>('CONTACTED');

  // Drawer Action States (Add Note & Schedule Follow-up)
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Persist Column and Density selections
  const handleDensityChange = (newDensity: TableDensity) => {
    setDensity(newDensity);
    localStorage.setItem('estate_leads_density', newDensity);
  };

  const toggleColumnVisibility = (key: string) => {
    if (key === 'fullName' || key === 'actions') return; // Primary identifiers are locked
    setVisibleColumns((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem('estate_leads_columns', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectAllColumns = () => {
    const allKeys = ['fullName', 'contact', 'project', 'leadSource', 'assignedTo', 'stage', 'nextFollowUpDate', 'actions'];
    setVisibleColumns(allKeys);
    localStorage.setItem('estate_leads_columns', JSON.stringify(allKeys));
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    localStorage.setItem('estate_leads_columns', JSON.stringify(DEFAULT_VISIBLE_COLUMNS));
  };

  const handleViewModeChange = (mode: 'table' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('estate_leads_view_mode', mode);
    if (mode === 'kanban' && pageSize < 50) {
      setPageSize(50);
    }
  };

  // Synchronize state when URL Search Params change
  useEffect(() => {
    const viewParam = searchParams.get('view');
    const stageParam = searchParams.get('stage') || '';
    const agentParam = searchParams.get('agent') || '';
    const sourceParam = searchParams.get('source') || '';
    const projectParam = searchParams.get('project') || searchParams.get('projectId') || '';

    if (viewParam === 'kanban') {
      setViewMode('kanban');
      if (pageSize < 50) setPageSize(50);
    } else if (viewParam === 'my' && user?.id) {
      setSelectedAgent(String(user.id));
      setSavedView('my');
      setViewMode('table');
    } else if (!viewParam && !stageParam && !agentParam && !sourceParam && !projectParam && searchParams.size === 0) {
      setSelectedStage('');
      setSelectedAgent('');
      setSelectedSource('');
      setSelectedProject('');
      setSavedView('all');
    }

    if (stageParam !== selectedStage) {
      setSelectedStage(stageParam);
      if (stageParam === 'NEW') setSavedView('new');
      else if (stageParam === 'SITE_VISIT') setSavedView('site_visit');
      else if (stageParam === 'BOOKED') setSavedView('converted');
    }

    if (sourceParam !== selectedSource) {
      setSelectedSource(sourceParam);
    }

    if (projectParam !== selectedProject) {
      setSelectedProject(projectParam);
    }
  }, [searchParams, user]);

  // Query Leads
  const { data: leadsData, isLoading, error } = useQuery({
    queryKey: [
      'leads',
      { search: debouncedSearch, selectedStage, selectedSource, selectedProject, selectedAgent, page, pageSize, sortField, sortDir },
    ],
    queryFn: () =>
      leadsApi.getLeads({
        search: debouncedSearch || undefined,
        stage: selectedStage || undefined,
        source: selectedSource || undefined,
        projectId: selectedProject ? Number(selectedProject) : undefined,
        assignedToId: selectedAgent ? Number(selectedAgent) : undefined,
        page,
        size: pageSize,
        sortBy: sortField,
        sortDir,
      }),
  });

  // Query Projects & Agents
  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: projectsApi.getProjects,
  });

  const { data: salesAgents } = useQuery({
    queryKey: ['sales-agents-list'],
    queryFn: employeesApi.getSalesEmployees,
  });

  // Query activities for currently inspected lead in drawer
  const { data: drawerActivities, refetch: refetchActivities } = useQuery({
    queryKey: ['lead-activities', activeLeadDrawer?.id],
    queryFn: () => leadsApi.getLeadActivities(activeLeadDrawer!.id),
    enabled: !!activeLeadDrawer?.id,
  });

  // Mutations
  const singleDeleteMutation = useMutation({
    mutationFn: (id: number) => leadsApi.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Lead deleted successfully');
      setDeleteTarget(null);
      if (activeLeadDrawer?.id === deleteTarget?.id) {
        setActiveLeadDrawer(null);
      }
    },
    onError: (err: any) => {
      toast.error('Failed to delete lead', err.response?.data?.message || err.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => leadsApi.bulkDelete(ids),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success(`Bulk Delete Completed`, `Successfully removed ${count} lead(s)`);
      setSelectedLeadIds([]);
      setShowBulkDeleteConfirm(false);
    },
    onError: (err: any) => {
      toast.error('Bulk delete failed', err.response?.data?.message || err.message);
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: ({ ids, agentId }: { ids: number[]; agentId: number }) =>
      leadsApi.bulkAssign(ids, agentId),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Bulk Assignment Complete`, `Assigned ${count} lead(s) to sales agent`);
      setSelectedLeadIds([]);
      setShowBulkAssignModal(false);
    },
    onError: (err: any) => {
      toast.error('Bulk assignment failed', err.response?.data?.message || err.message);
    },
  });

  const bulkStageMutation = useMutation({
    mutationFn: ({ ids, stage }: { ids: number[]; stage: string }) =>
      leadsApi.bulkStage(ids, stage),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success(`Bulk Stage Update`, `Updated funnel stage for ${count} lead(s)`);
      setSelectedLeadIds([]);
      setShowBulkStageModal(false);
    },
    onError: (err: any) => {
      toast.error('Bulk stage update failed', err.response?.data?.message || err.message);
    },
  });

  // Action: Add Note to inspected lead
  const addNoteMutation = useMutation({
    mutationFn: ({ leadId, text }: { leadId: number; text: string }) =>
      leadsApi.addLeadActivity(leadId, { type: 'NOTE', description: text }),
    onSuccess: () => {
      refetchActivities();
      setNoteText('');
      setIsAddingNote(false);
      toast.success('Activity Logged', 'Note added to lead timeline');
    },
    onError: (err: any) => {
      toast.error('Failed to log note', err.response?.data?.message || err.message);
    },
  });

  // Action: Schedule Follow-up for inspected lead
  const scheduleFollowUpMutation = useMutation({
    mutationFn: ({
      leadId,
      assignedToId,
      scheduledAt,
      notes,
    }: {
      leadId: number;
      assignedToId?: number;
      scheduledAt: string;
      notes?: string;
    }) =>
      followUpsApi.createFollowUp({
        leadId,
        assignedToId,
        scheduledAt,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      setIsSchedulingFollowUp(false);
      setFollowUpDate('');
      setFollowUpNotes('');
      toast.success('Follow-up Scheduled', 'Reminder added to agent calendar');
    },
    onError: (err: any) => {
      toast.error('Failed to schedule follow-up', err.response?.data?.message || err.message);
    },
  });

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  // CSV Export
  const handleExportCsv = (selectedOnly: boolean) => {
    const listToExport = selectedOnly
      ? (leadsData?.content || []).filter((l) => selectedLeadIds.includes(l.id))
      : leadsData?.content || [];

    if (listToExport.length === 0) {
      toast.warning('No Leads to Export', 'Select leads or view populated page first.');
      return;
    }

    exportToCsv(
      `leads_export_${new Date().toISOString().slice(0, 10)}.csv`,
      listToExport,
      [
        { key: 'leadCode', label: 'Lead Code' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'stage', label: 'Stage' },
        { key: 'leadSource', label: 'Source' },
        { key: 'budget', label: 'Budget (USD)' },
        { key: 'interestedProjectName', label: 'Interested Project' },
        { key: 'assignedToName', label: 'Assigned Agent' },
        { key: 'nextFollowUpDate', label: 'Next Follow-up' },
        { key: 'createdAt', label: 'Created At' },
      ]
    );

    toast.info(`Exported ${listToExport.length} lead(s) to CSV`);
  };

  // Saved Views Handler
  const handleSelectSavedView = (view: SavedViewKey) => {
    setSavedView(view);
    setPage(0);

    if (view === 'all') {
      setSelectedStage('');
      setSelectedAgent('');
      setSearch('');
      setDebouncedSearch('');
      setSearchParams({});
    } else if (view === 'my') {
      if (user?.id) {
        setSelectedAgent(String(user.id));
        setSelectedStage('');
        setSearchParams({ agent: String(user.id) });
      }
    } else if (view === 'new') {
      setSelectedStage('NEW');
      setSelectedAgent('');
      setSearchParams({ stage: 'NEW' });
    } else if (view === 'site_visit') {
      setSelectedStage('SITE_VISIT');
      setSelectedAgent('');
      setSearchParams({ stage: 'SITE_VISIT' });
    } else if (view === 'converted') {
      setSelectedStage('BOOKED');
      setSelectedAgent('');
      setSearchParams({ stage: 'BOOKED' });
    } else if (view === 'high_budget') {
      setSortField('budget');
      setSortDir('desc');
      setSelectedStage('');
      setSelectedAgent('');
    }
  };

  // Active filter chips calculation
  const activeFilters: ActiveFilter[] = [];
  if (selectedStage) {
    activeFilters.push({ key: 'stage', label: 'Stage', value: selectedStage });
  }
  if (selectedSource) {
    activeFilters.push({ key: 'source', label: 'Source', value: selectedSource });
  }
  if (selectedProject) {
    const proj = projects?.find((p) => p.id === Number(selectedProject));
    activeFilters.push({ key: 'project', label: 'Project', value: proj?.name || selectedProject });
  }
  if (selectedAgent) {
    const agent = salesAgents?.find((a) => a.id === Number(selectedAgent));
    activeFilters.push({ key: 'agent', label: 'Agent', value: agent?.name || selectedAgent });
  }
  if (search) {
    activeFilters.push({ key: 'search', label: 'Search', value: search });
  }

  const handleRemoveFilter = (key: string) => {
    if (key === 'stage') {
      setSelectedStage('');
      setSearchParams((prev) => {
        prev.delete('stage');
        return prev;
      });
    }
    if (key === 'source') setSelectedSource('');
    if (key === 'project') setSelectedProject('');
    if (key === 'agent') {
      setSelectedAgent('');
      setSearchParams((prev) => {
        prev.delete('agent');
        return prev;
      });
    }
    if (key === 'search') {
      setSearch('');
      setDebouncedSearch('');
      setSearchParams((prev) => {
        prev.delete('search');
        return prev;
      });
    }
    setPage(0);
  };

  const handleClearAllFilters = () => {
    setSelectedStage('');
    setSelectedSource('');
    setSelectedProject('');
    setSelectedAgent('');
    setSearch('');
    setDebouncedSearch('');
    setSavedView('all');
    setSearchParams({});
    setPage(0);
  };

  const formatCurrency = (val: number | undefined) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Master Column Definitions
  const masterColumns: Column<Lead>[] = [
    {
      key: 'fullName',
      header: 'Lead Name & ID',
      sortable: true,
      className: 'min-w-[110px] max-w-[155px]',
      headerClassName: 'min-w-[110px] max-w-[155px]',
      render: (lead) => (
        <LeadDetailsPopover lead={lead} onViewDetails={() => setActiveLeadDrawer(lead)}>
          <div className="cursor-pointer group/name min-w-0 max-w-[145px]">
            <span
              className="font-bold text-slate-900 dark:text-slate-100 group-hover/name:text-brand-600 dark:group-hover/name:text-brand-400 block text-sm group-hover/name:underline transition-colors truncate"
              title={lead.fullName}
            >
              {lead.fullName}
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              {lead.leadCode}
            </span>
          </div>
        </LeadDetailsPopover>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      className: 'min-w-[100px] max-w-[145px]',
      headerClassName: 'min-w-[100px] max-w-[145px]',
      render: (lead) => (
        <div className="space-y-0.5 text-xs min-w-0 max-w-[135px]">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
            <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <a href={`tel:${lead.phone}`} className="hover:underline hover:text-brand-600 dark:hover:text-brand-400 truncate block max-w-[120px]" title={lead.phone}>
              {lead.phone}
            </a>
          </div>
          {lead.email && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <a href={`mailto:${lead.email}`} className="truncate block max-w-[120px] hover:underline hover:text-brand-600 dark:hover:text-brand-400" title={lead.email}>
                {lead.email}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project & Budget',
      sortable: true,
      className: 'min-w-[95px] max-w-[135px]',
      headerClassName: 'min-w-[95px] max-w-[135px]',
      render: (lead) => (
        <div className="min-w-0 max-w-[125px]">
          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <span className="truncate block" title={lead.interestedProjectName || 'Unspecified Project'}>
              {lead.interestedProjectName || 'Unspecified Project'}
            </span>
          </div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 truncate block">
            {formatCurrency(lead.budget)}
          </div>
        </div>
      ),
    },
    {
      key: 'leadSource',
      header: 'Source',
      className: 'min-w-[95px] whitespace-nowrap',
      headerClassName: 'min-w-[95px] whitespace-nowrap',
      render: (lead) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {lead.leadSource}
        </span>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned Agent',
      className: 'min-w-[100px] max-w-[140px]',
      headerClassName: 'min-w-[100px] max-w-[140px]',
      render: (lead) =>
        lead.assignedToName ? (
          <div className="flex items-center gap-1.5 min-w-0 max-w-[130px]">
            <UserAvatar name={lead.assignedToName} size="xs" />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate block" title={lead.assignedToName}>
              {lead.assignedToName}
            </span>
          </div>
        ) : (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded whitespace-nowrap">
            Unassigned
          </span>
        ),
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      className: 'min-w-[80px] whitespace-nowrap',
      headerClassName: 'min-w-[80px] whitespace-nowrap',
      render: (lead) => <LeadStatusBadge status={lead.stage} />,
    },
    {
      key: 'nextFollowUpDate',
      header: 'Next Follow-up',
      sortable: true,
      className: 'min-w-[110px] whitespace-nowrap',
      headerClassName: 'min-w-[110px] whitespace-nowrap',
      render: (lead) =>
        lead.nextFollowUpDate ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <span>{new Date(lead.nextFollowUpDate).toLocaleDateString()}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">None scheduled</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-16 text-right',
      className: 'w-16 text-right shrink-0',
      render: (lead) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setActiveLeadDrawer(lead)}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Inspect Lead Details"
            aria-label="Inspect lead details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/leads/${lead.id}/edit`)}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Edit Lead"
            aria-label="Edit lead"
          >
            <Edit className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setDeleteTarget(lead)}
              disabled={lead.stage === 'BOOKED'}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={lead.stage === 'BOOKED' ? 'Booked leads cannot be deleted' : 'Delete Lead'}
              aria-label="Delete lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Filter columns based on user column visibility preference
  const visibleTableColumns = useMemo(() => {
    return masterColumns.filter((col) => visibleColumns.includes(col.key) || col.key === 'actions');
  }, [visibleColumns]);

  return (
    <div className="space-y-5 min-w-0 w-full animate-in fade-in duration-150">
      {/* Page Header with Action Buttons */}
      <PageHeader
        title="Leads Management"
        description="Capture, qualify, assign, and track prospective property buyers through your sales funnel."
        breadcrumbs={[{ label: 'Leads' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={() => handleExportCsv(false)}
            >
              Export (CSV)
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/leads/new')}
            >
              Create Lead
            </Button>
          </>
        }
      />

      {/* Saved Views Tabs & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs min-w-0 w-full">
        {/* Saved View Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none min-w-0 flex-1">
          <button
            type="button"
            onClick={() => handleSelectSavedView('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              savedView === 'all' && !selectedStage && !selectedAgent
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            All Leads {leadsData?.totalElements ? `(${leadsData.totalElements})` : ''}
          </button>

          <button
            type="button"
            onClick={() => handleSelectSavedView('my')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              savedView === 'my'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            My Leads
          </button>

          <button
            type="button"
            onClick={() => handleSelectSavedView('new')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              savedView === 'new'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            New Inquiries
          </button>

          <button
            type="button"
            onClick={() => handleSelectSavedView('site_visit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              savedView === 'site_visit'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Site Visits
          </button>

          <button
            type="button"
            onClick={() => handleSelectSavedView('converted')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              savedView === 'converted'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Converted
          </button>

          <button
            type="button"
            onClick={() => handleSelectSavedView('high_budget')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              savedView === 'high_budget'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            High Budget
          </button>
        </div>

        {/* Table / Kanban View Mode Controls */}
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end shrink-0">
          {/* View Mode Segmented Switch */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('kanban')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Pipeline board"
              aria-label="Pipeline board"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
          </div>

          {viewMode === 'table' && (
            <>
              {/* Mobile vs Table View Toggle */}
              <div className="inline-flex md:hidden items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsMobileCardView(false)}
                  className={`p-1.5 rounded-md text-xs font-medium ${
                    !isMobileCardView ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                  }`}
                  title="Table view"
                  aria-label="Table view"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileCardView(true)}
                  className={`p-1.5 rounded-md text-xs font-medium ${
                    isMobileCardView ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                  }`}
                  title="Card view"
                  aria-label="Card view"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Table Density Selector */}
              <div className="hidden lg:inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => handleDensityChange('compact')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                    density === 'compact' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => handleDensityChange('normal')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                    density === 'normal' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleDensityChange('comfortable')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                    density === 'comfortable' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Comfortable
                </button>
              </div>

              {/* Column Visibility Toggle Dropdown */}
              <div className="relative" ref={columnDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowColumnDropdown((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    showColumnDropdown
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  aria-label="Toggle visible columns"
                  aria-expanded={showColumnDropdown}
                  aria-haspopup="true"
                >
                  <Columns className="w-3.5 h-3.5 text-slate-400" />
                  <span>Columns</span>
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {visibleTableColumns.filter((c) => c.key !== 'actions').length}/7
                  </span>
                </button>

                {showColumnDropdown && (
                  <div
                    className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 z-30 space-y-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-label="Column Visibility Manager"
                  >
                    <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                        Toggle Columns
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {visibleTableColumns.filter((c) => c.key !== 'actions').length} active
                      </span>
                    </div>

                    <div className="space-y-0.5 py-1 max-h-64 overflow-y-auto">
                      {ALL_TOGGLEABLE_COLUMNS.map((col) => {
                        const isVisible = visibleColumns.includes(col.key);
                        return (
                          <label
                            key={col.key}
                            className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg transition-colors select-none ${
                              col.locked
                                ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={col.locked ? true : isVisible}
                                disabled={col.locked}
                                onChange={() => toggleColumnVisibility(col.key)}
                                className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5 disabled:opacity-50"
                              />
                              <span
                                className={
                                  col.locked
                                    ? 'font-medium text-slate-500 dark:text-slate-400'
                                    : 'font-medium'
                                }
                              >
                                {col.label}
                              </span>
                            </div>
                            {col.locked && (
                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                                Locked
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 px-1">
                      <button
                        type="button"
                        onClick={handleSelectAllColumns}
                        className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Show All
                      </button>
                      <button
                        type="button"
                        onClick={handleResetColumns}
                        className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
                      >
                        Reset Default
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
        totalResults={leadsData?.totalElements}
      >
        <SearchInput
          value={search}
          onChangeValue={(val) => {
            setSearch(val);
            if (!val) setDebouncedSearch('');
            setPage(0);
          }}
          placeholder="Search name, email, phone, code..."
          className="w-full sm:w-64 lg:w-72 shrink-0"
        />

        <select
          value={selectedStage}
          onChange={(e) => {
            setSelectedStage(e.target.value);
            setPage(0);
          }}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Filter by Stage"
        >
          <option value="">All Stages</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="SITE_VISIT">Site Visit</option>
          <option value="INTERESTED">Interested</option>
          <option value="NEGOTIATION">Negotiation</option>
          <option value="BOOKED">Converted / Booked</option>
          <option value="LOST">Lost</option>
        </select>

        <select
          value={selectedSource}
          onChange={(e) => {
            setSelectedSource(e.target.value);
            setPage(0);
          }}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Filter by Source"
        >
          <option value="">All Sources</option>
          <option value="WEBSITE">Website</option>
          <option value="REFERRAL">Referral</option>
          <option value="WALK_IN">Walk In</option>
          <option value="SOCIAL_MEDIA">Social Media</option>
          <option value="CALL_IN">Phone Call</option>
          <option value="CAMPAIGN">Campaign</option>
        </select>

        {projects && (
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setPage(0);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Filter by Project"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {isAdmin && salesAgents && (
          <select
            value={selectedAgent}
            onChange={(e) => {
              setSelectedAgent(e.target.value);
              setPage(0);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            aria-label="Filter by Agent"
          >
            <option value="">All Agents</option>
            {salesAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </FilterToolbar>

      {/* Bulk Action Toolbar */}
      {viewMode === 'table' && (
        <DataTableToolbar
          selectedCount={selectedLeadIds.length}
          totalCount={leadsData?.content?.length}
          onClearSelection={() => setSelectedLeadIds([])}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleExportCsv(true)}
              >
                Export Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={<Briefcase className="w-3.5 h-3.5" />}
                onClick={() => setShowBulkStageModal(true)}
              >
                Change Stage
              </Button>

              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  onClick={() => setShowBulkAssignModal(true)}
                >
                  Assign Agent
                </Button>
              )}

              {isAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  Delete Selected
                </Button>
              )}
            </>
          }
        />
      )}

      {/* Main View: Kanban Pipeline vs Mobile Cards vs Enterprise Data Table */}
      {viewMode === 'kanban' ? (
        <LeadKanbanBoard
          leads={leadsData?.content || []}
          onStageChange={(id, newStage) => bulkStageMutation.mutate({ ids: [id], stage: newStage })}
          onLeadClick={(lead) => setActiveLeadDrawer(lead)}
          isLoading={isLoading}
        />
      ) : isMobileCardView ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse h-28" />
              ))}
            </div>
          ) : leadsData?.content?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400">
              No leads match your current criteria.
            </div>
          ) : (
            leadsData?.content?.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              return (
                <div
                  key={lead.id}
                  onClick={() => setActiveLeadDrawer(lead)}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-4 space-y-3 transition-all cursor-pointer ${
                    isSelected ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40 dark:bg-brand-950/40' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => e.stopPropagation()}>
                        <LeadCheckbox
                          checked={isSelected}
                          onChange={() =>
                            setSelectedLeadIds((prev) =>
                              prev.includes(lead.id) ? prev.filter((id) => id !== lead.id) : [...prev, lead.id]
                            )
                          }
                          label={`Select ${lead.fullName}`}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{lead.fullName}</h4>
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{lead.leadCode}</span>
                      </div>
                    </div>
                    <LeadStatusBadge status={lead.stage} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-medium"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{lead.phone}</span>
                    </a>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-right">
                      {formatCurrency(lead.budget)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Desktop/Tablet Interactive Data Table with Sticky Header & Density */
        <DataTable
          columns={visibleTableColumns}
          data={leadsData?.content || []}
          isLoading={isLoading}
          emptyTitle="No leads found"
          emptyDescription={
            search || selectedStage || selectedSource
              ? 'No leads match your active filters. Try clearing some filters.'
              : 'Get started by creating your first buyer inquiry.'
          }
          emptyActionLabel="Create First Lead"
          onEmptyAction={() => navigate('/leads/new')}
          selectable
          selectedIds={selectedLeadIds}
          onSelectionChange={setSelectedLeadIds}
          isRowSelectable={(lead) => lead.stage !== 'BOOKED' || !isAdmin}
          density={density}
          stickyHeader
          sortField={sortField}
          sortDirection={sortDir}
          onSort={handleSort}
          onRowClick={(lead) => setActiveLeadDrawer(lead)}
          highlightRowId={activeLeadDrawer?.id}
          page={page}
          pageSize={pageSize}
          totalPages={leadsData?.totalPages || 1}
          totalElements={leadsData?.totalElements || 0}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
        />
      )}

      {/* Right-Side Lead Inspection Drawer */}
      <RecordDetailDrawer
        isOpen={!!activeLeadDrawer}
        onClose={() => {
          setActiveLeadDrawer(null);
          setIsAddingNote(false);
          setIsSchedulingFollowUp(false);
        }}
        title={activeLeadDrawer?.fullName || 'Lead Details'}
        subtitle={
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-slate-500">{activeLeadDrawer?.leadCode}</span>
            {activeLeadDrawer && <LeadStatusBadge status={activeLeadDrawer.stage} size="sm" />}
          </div>
        }
        footer={
          activeLeadDrawer && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveLeadDrawer(null);
                  setIsAddingNote(false);
                  setIsSchedulingFollowUp(false);
                }}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit className="w-3.5 h-3.5" />}
                  onClick={() => navigate(`/leads/${activeLeadDrawer.id}/edit`)}
                >
                  Edit Record
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() => navigate(`/leads/${activeLeadDrawer.id}`)}
                >
                  Full Page
                </Button>
              </div>
            </div>
          )
        }
      >
        {activeLeadDrawer && (
          <div className="space-y-5 text-sm">
            {/* Quick Actions Action Bar */}
            <div className="grid grid-cols-4 gap-2 pb-3 border-b border-slate-100">
              <a
                href={`tel:${activeLeadDrawer.phone}`}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                title="Direct Phone Call"
              >
                <Phone className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-[11px] font-semibold">Call</span>
              </a>

              {activeLeadDrawer.email ? (
                <a
                  href={`mailto:${activeLeadDrawer.email}`}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4 text-brand-600 mb-1" />
                  <span className="text-[11px] font-semibold">Email</span>
                </a>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 text-slate-300 opacity-60">
                  <Mail className="w-4 h-4 mb-1" />
                  <span className="text-[11px]">Email</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsAddingNote((prev) => !prev)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                  isAddingNote
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
                title="Add Internal Note"
              >
                <MessageSquare className="w-4 h-4 text-amber-600 mb-1" />
                <span className="text-[11px] font-semibold">Add Note</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSchedulingFollowUp((prev) => !prev)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                  isSchedulingFollowUp
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
                title="Schedule Follow-up"
              >
                <CalendarPlus className="w-4 h-4 text-purple-600 mb-1" />
                <span className="text-[11px] font-semibold">Schedule</span>
              </button>
            </div>

            {/* Inline Note Composer */}
            {isAddingNote && (
              <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    New Activity Note
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="text-amber-500 hover:text-amber-800 dark:hover:text-amber-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record call summary, client feedback, or buyer requirement..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/80 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingNote(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!noteText.trim() || addNoteMutation.isPending}
                    isLoading={addNoteMutation.isPending}
                    onClick={() =>
                      addNoteMutation.mutate({
                        leadId: activeLeadDrawer.id,
                        text: noteText.trim(),
                      })
                    }
                  >
                    Save Note
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Follow-up Scheduler Form */}
            {isSchedulingFollowUp && (
              <div className="bg-purple-50/70 dark:bg-purple-950/40 p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/60 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarPlus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Schedule Follow-up Task
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSchedulingFollowUp(false)}
                    className="text-purple-500 hover:text-purple-800 dark:hover:text-purple-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-purple-900 dark:text-purple-300 block mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-purple-200 dark:border-purple-900/80 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-purple-900 dark:text-purple-300 block mb-1">
                    Task Notes
                  </label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="e.g. Discuss revised quote, site visit follow-up..."
                    rows={2}
                    className="w-full text-xs p-2 rounded-lg border border-purple-200 dark:border-purple-900/80 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSchedulingFollowUp(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!followUpDate || scheduleFollowUpMutation.isPending}
                    isLoading={scheduleFollowUpMutation.isPending}
                    onClick={() =>
                      scheduleFollowUpMutation.mutate({
                        leadId: activeLeadDrawer.id,
                        assignedToId: activeLeadDrawer.assignedToId,
                        scheduledAt: new Date(followUpDate).toISOString(),
                        notes: followUpNotes.trim(),
                      })
                    }
                  >
                    Schedule Task
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Budget
                </span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  {formatCurrency(activeLeadDrawer.budget)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Source
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {activeLeadDrawer.leadSource}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Contact Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Phone
                  </span>
                  <a
                    href={`tel:${activeLeadDrawer.phone}`}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {activeLeadDrawer.phone}
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Email
                  </span>
                  <a
                    href={`mailto:${activeLeadDrawer.email}`}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline truncate max-w-[200px]"
                  >
                    {activeLeadDrawer.email || '—'}
                  </a>
                </div>
              </div>
            </div>

            {/* Assignment & Project */}
            <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Project & Ownership
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Interested Project</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeLeadDrawer.interestedProjectName || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Assigned Agent</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeLeadDrawer.assignedToName || 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Next Scheduled Follow-up</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeLeadDrawer.nextFollowUpDate
                      ? new Date(activeLeadDrawer.nextFollowUpDate).toLocaleString()
                      : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {activeLeadDrawer.notes && (
              <div className="space-y-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Lead Notes
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {activeLeadDrawer.notes}
                </p>
              </div>
            )}

            {/* Activity History Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recent Activity ({drawerActivities?.length || 0})
                </h3>
                <Link
                  to={`/leads/${activeLeadDrawer.id}`}
                  className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1"
                >
                  View full history <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="max-h-64 overflow-y-auto pr-1">
                <ActivityTimeline
                  activities={drawerActivities || []}
                  maxItems={5}
                  emptyMessage="No activities recorded yet."
                />
              </div>
            </div>

            {/* Destructive Delete Action with Guard */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  disabled={activeLeadDrawer.stage === 'BOOKED'}
                  onClick={() => setDeleteTarget(activeLeadDrawer)}
                >
                  Delete Lead
                </Button>
              </div>
            )}
          </div>
        )}
      </RecordDetailDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Lead"
        message={`Are you sure you want to delete "${deleteTarget?.fullName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={singleDeleteMutation.isPending}
        onConfirm={() => deleteTarget && singleDeleteMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Bulk Delete Leads"
        message={`Are you sure you want to delete ${selectedLeadIds.length} lead(s)? Unbooked records will be permanently removed.`}
        confirmLabel={`Delete ${selectedLeadIds.length} Leads`}
        variant="danger"
        isLoading={bulkDeleteMutation.isPending}
        onConfirm={() => bulkDeleteMutation.mutate(selectedLeadIds.map(Number))}
        onClose={() => setShowBulkDeleteConfirm(false)}
      />

      {/* Bulk Assign Modal */}
      <Modal
        isOpen={showBulkAssignModal}
        onClose={() => setShowBulkAssignModal(false)}
        title="Assign Agent to Selected Leads"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select a sales agent to assign to the {selectedLeadIds.length} selected lead(s).
          </p>
          <select
            value={targetAssigneeId}
            onChange={(e) => setTargetAssigneeId(Number(e.target.value))}
            className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select Agent...</option>
            {salesAgents?.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.email})
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkAssignModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!targetAssigneeId || bulkAssignMutation.isPending}
              isLoading={bulkAssignMutation.isPending}
              onClick={() =>
                bulkAssignMutation.mutate({
                  ids: selectedLeadIds.map(Number),
                  agentId: Number(targetAssigneeId),
                })
              }
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Stage Modal */}
      <Modal
        isOpen={showBulkStageModal}
        onClose={() => setShowBulkStageModal(false)}
        title="Update Stage for Selected Leads"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose a funnel stage to apply to the {selectedLeadIds.length} selected lead(s).
          </p>
          <select
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value)}
            className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="SITE_VISIT">Site Visit</option>
            <option value="INTERESTED">Interested</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="BOOKED">Converted / Booked</option>
            <option value="LOST">Lost</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkStageModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={bulkStageMutation.isPending}
              isLoading={bulkStageMutation.isPending}
              onClick={() =>
                bulkStageMutation.mutate({
                  ids: selectedLeadIds.map(Number),
                  stage: targetStage,
                })
              }
            >
              Update Stage
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
