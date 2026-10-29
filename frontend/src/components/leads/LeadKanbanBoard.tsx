import React, { useState } from 'react';
import { Lead, LeadStage } from '../../types';
import {
  Phone,
  Mail,
  Building,
  DollarSign,
  User,
  GripVertical,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { LeadStatusBadge } from './LeadStatusBadge';

interface LeadKanbanBoardProps {
  leads: Lead[];
  onStageChange: (leadId: number, newStage: LeadStage) => void;
  onLeadClick: (lead: Lead) => void;
  isLoading?: boolean;
}

interface ColumnConfig {
  id: LeadStage;
  title: string;
  dotColor: string;
  headerBg: string;
  badgeBg: string;
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  {
    id: 'NEW',
    title: 'New Inquiries',
    dotColor: 'bg-blue-500',
    headerBg: 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  {
    id: 'CONTACTED',
    title: 'Contacted',
    dotColor: 'bg-indigo-500',
    headerBg: 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  },
  {
    id: 'INTERESTED',
    title: 'Interested',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  {
    id: 'SITE_VISIT',
    title: 'Site Visit',
    dotColor: 'bg-purple-500',
    headerBg: 'bg-purple-50/70 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  {
    id: 'NEGOTIATION',
    title: 'In Negotiation',
    dotColor: 'bg-orange-500',
    headerBg: 'bg-orange-50/70 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900',
    badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  {
    id: 'BOOKED',
    title: 'Converted / Booked',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  {
    id: 'LOST',
    title: 'Lost / Closed',
    dotColor: 'bg-rose-500',
    headerBg: 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  },
];

export const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({
  leads,
  onStageChange,
  onLeadClick,
  isLoading = false,
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<LeadStage | null>(null);

  const formatCurrency = (val: number | undefined) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLeadId(lead.id);
    e.dataTransfer.setData('text/plain', String(lead.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropColumn !== stage) {
      setActiveDropColumn(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stage: LeadStage) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (activeDropColumn === stage) {
      setActiveDropColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const leadIdStr = e.dataTransfer.getData('text/plain') || String(draggedLeadId);
    const leadId = Number(leadIdStr);

    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.stage !== targetStage) {
      onStageChange(leadId, targetStage);
    }
    setDraggedLeadId(null);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setActiveDropColumn(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col.id}
            className="w-72 md:w-auto bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse"
          >
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none scrollbar-thin">
      {KANBAN_COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => l.stage === col.id);
        const columnBudgetSum = columnLeads.reduce((acc, curr) => acc + (curr.budget || 0), 0);
        const isDropTarget = activeDropColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border transition-all duration-200 bg-slate-50/80 dark:bg-slate-900/60 ${
              isDropTarget
                ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-50/20 dark:bg-brand-950/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Column Header */}
            <div
              className={`p-3.5 rounded-t-2xl border-b flex flex-col gap-1 transition-colors ${col.headerBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 tracking-tight">
                    {col.title}
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}
                >
                  {columnLeads.length}
                </span>
              </div>

              {columnBudgetSum > 0 && (
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Total: {formatCurrency(columnBudgetSum)}
                </div>
              )}
            </div>

            {/* Droppable Card List */}
            <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[300px]">
              {columnLeads.length === 0 ? (
                <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-center p-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Drop leads here to advance to {col.title}
                  </p>
                </div>
              ) : (
                columnLeads.map((lead) => {
                  const isBeingDragged = draggedLeadId === lead.id;
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onLeadClick(lead)}
                      className={`group relative bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150 cursor-grab active:cursor-grabbing ${
                        isBeingDragged ? 'opacity-40 scale-95' : 'opacity-100'
                      }`}
                    >
                      {/* Card Header: Drag Handle & Name */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {lead.fullName}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            {lead.leadCode}
                          </span>
                        </div>
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Project & Budget */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1 text-xs">
                        {lead.interestedProjectName && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                            <Building className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{lead.interestedProjectName}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Budget
                          </span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                            {formatCurrency(lead.budget)}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer: Agent & Quick Actions */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                        {lead.assignedToName ? (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <UserAvatar name={lead.assignedToName} size="xs" />
                            <span className="truncate max-w-[90px] text-[10px] font-medium">
                              {lead.assignedToName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            Unassigned
                          </span>
                        )}

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            title={lead.phone}
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                              title={lead.email}
                            >
                              <Mail className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
