import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Lead } from '../../types';
import {
  User,
  Mail,
  Phone,
  Building,
  UserCheck,
  Calendar,
  X,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LeadStatusBadge } from './LeadStatusBadge';
import { UserAvatar } from '../common/UserAvatar';

interface LeadDetailsPopoverProps {
  lead: Lead;
  children: ReactNode;
  className?: string;
  onViewDetails?: () => void;
  preferredPosition?: 'top' | 'bottom';
}

interface PositionCoords {
  top: number;
  left: number;
  arrowLeft: number;
  placement: 'top' | 'bottom';
  maxHeight: number;
  width: number;
}

export const LeadDetailsPopover: React.FC<LeadDetailsPopoverProps> = ({
  lead,
  children,
  className = '',
  onViewDetails,
  preferredPosition = 'top',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<PositionCoords | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Position calculation logic with viewport edge awareness
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const EDGE_PADDING = 14;
    const ARROW_HEIGHT = 8;
    const CARD_WIDTH = Math.min(340, viewportWidth - EDGE_PADDING * 2);

    // Measure existing popover height or estimate ~310px
    const cardHeight = popoverRef.current
      ? popoverRef.current.offsetHeight
      : 300;

    const spaceAbove = triggerRect.top - EDGE_PADDING;
    const spaceBelow = viewportHeight - triggerRect.bottom - EDGE_PADDING;

    let placement: 'top' | 'bottom' = preferredPosition;

    if (preferredPosition === 'top') {
      if (spaceAbove < cardHeight + ARROW_HEIGHT + 4 && spaceBelow > spaceAbove) {
        placement = 'bottom';
      }
    } else {
      if (spaceBelow < cardHeight + ARROW_HEIGHT + 4 && spaceAbove > spaceBelow) {
        placement = 'top';
      }
    }

    // Available height constrained within viewport
    const availableHeight = placement === 'top'
      ? Math.max(180, spaceAbove - ARROW_HEIGHT - 6)
      : Math.max(180, spaceBelow - ARROW_HEIGHT - 6);
    const maxHeight = Math.min(availableHeight, 460);

    // Horizontal placement centered on trigger, clamped to viewport
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const idealLeft = triggerCenterX - CARD_WIDTH / 2;
    const clampedLeft = Math.max(
      EDGE_PADDING,
      Math.min(idealLeft, viewportWidth - CARD_WIDTH - EDGE_PADDING)
    );

    // Calculate Arrow position relative to the popover card
    const idealArrowLeft = triggerCenterX - clampedLeft;
    // Keep arrow inside rounded corners of card (16px from each border)
    const arrowLeft = Math.max(20, Math.min(idealArrowLeft, CARD_WIDTH - 20));

    // Vertical top coordinate
    const top =
      placement === 'top'
        ? triggerRect.top - (popoverRef.current ? popoverRef.current.offsetHeight : cardHeight) - ARROW_HEIGHT
        : triggerRect.bottom + ARROW_HEIGHT;

    setCoords({
      top,
      left: clampedLeft,
      arrowLeft,
      placement,
      maxHeight,
      width: CARD_WIDTH,
    });
  }, [preferredPosition]);

  // Recalculate once popover is mounted to measure exact height
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      // Second tick to adjust after DOM node has exact dimensions
      const rAf = requestAnimationFrame(() => {
        calculatePosition();
      });
      return () => cancelAnimationFrame(rAf);
    }
  }, [isOpen, calculatePosition]);

  // Handle window resize, scroll, and layout changes
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      // If trigger is scrolled completely out of viewport, dismiss
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }
      calculatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    // Observe body resize so sidebar expand/collapse updates popover coordinates
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(() => {
        handleScrollOrResize();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isOpen, calculatePosition]);

  // Keyboard navigation and outside click dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openTimerRef.current) clearTimeout(openTimerRef.current);
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Hover triggers with grace periods (180ms open, 220ms close)
  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!isOpen && !openTimerRef.current) {
      openTimerRef.current = setTimeout(() => {
        setIsOpen(true);
        openTimerRef.current = null;
      }, 180);
    }
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (!closeTimerRef.current) {
      closeTimerRef.current = setTimeout(() => {
        setIsOpen(false);
        closeTimerRef.current = null;
      }, 220);
    }
  };

  const handlePopoverMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    if (!closeTimerRef.current) {
      closeTimerRef.current = setTimeout(() => {
        setIsOpen(false);
        closeTimerRef.current = null;
      }, 200);
    }
  };

  // Touch tap toggle
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      calculatePosition();
      setIsOpen(true);
    }
  };

  const copyEmailToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.email) return;
    navigator.clipboard.writeText(lead.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1800);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Anchor Trigger */}
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        onClick={handleToggleClick}
      >
        {children}
      </div>

      {/* Portal Popover Attached to document.body */}
      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={`Lead details for ${lead.fullName}`}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 9999,
            }}
            className="flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-800 text-left transition-all duration-150 ease-out animate-in fade-in-0 zoom-in-95 select-text"
          >
            {/* V-Shaped Pointer Arrow with Dark Theme Alignment */}
            {coords.placement === 'top' ? (
              // Downward-pointing arrow when popover is ABOVE trigger
              <svg
                width="16"
                height="8"
                viewBox="0 0 16 8"
                className="absolute -bottom-2 pointer-events-none filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.06)]"
                style={{ left: `${coords.arrowLeft}px`, transform: 'translateX(-50%)' }}
                aria-hidden="true"
              >
                <path
                  d="M0 0 L8 8 L16 0"
                  className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <path d="M1 0 L15 0" className="stroke-white dark:stroke-slate-900" strokeWidth="2.5" />
              </svg>
            ) : (
              // Upward-pointing arrow when popover is BELOW trigger
              <svg
                width="16"
                height="8"
                viewBox="0 0 16 8"
                className="absolute -top-2 pointer-events-none filter drop-shadow-[0_-1px_2px_rgba(0,0,0,0.04)]"
                style={{ left: `${coords.arrowLeft}px`, transform: 'translateX(-50%)' }}
                aria-hidden="true"
              >
                <path
                  d="M0 8 L8 0 L16 8"
                  className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <path d="M1 8 L15 8" className="stroke-white dark:stroke-slate-900" strokeWidth="2.5" />
              </svg>
            )}

            {/* Header: Identity & Stage Pill */}
            <div className="flex items-start justify-between gap-3 p-3.5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 rounded-t-xl">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {lead.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                    {lead.fullName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {lead.leadCode}
                    </span>
                    <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded">
                      {lead.leadSource}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <LeadStatusBadge status={lead.stage} size="sm" />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close popover"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body: Rich, Non-Duplicated Metadata */}
            <div className="p-3.5 space-y-3 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 max-h-[340px]">
              {/* Full Contact Direct Actions */}
              <div className="space-y-1.5 bg-slate-50/80 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Contact Information
                </div>

                {/* Full Email with Copy & Mailto */}
                {lead.email ? (
                  <div className="flex items-center justify-between gap-2 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                      <a
                        href={`mailto:${lead.email}`}
                        className="truncate text-brand-700 dark:text-brand-400 hover:underline font-medium"
                        title={lead.email}
                      >
                        {lead.email}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={copyEmailToClipboard}
                      className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                      title="Copy full email"
                    >
                      {copiedEmail ? (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 italic">
                    <Mail className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    <span>No email registered</span>
                  </div>
                )}

                {/* Full Phone with Tel */}
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <a
                    href={`tel:${lead.phone}`}
                    className="font-medium hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline"
                  >
                    {lead.phone}
                  </a>
                </div>
              </div>

              {/* Assigned Representative Details */}
              <div className="flex items-center justify-between text-xs py-1 px-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  Assigned Agent:
                </span>
                {lead.assignedToName ? (
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <UserAvatar name={lead.assignedToName} size="xs" />
                    <span className="truncate max-w-[140px]">{lead.assignedToName}</span>
                  </div>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded text-[11px]">
                    Unassigned
                  </span>
                )}
              </div>

              {/* Internal Notes / Captured Inquiries (Not visible in main table) */}
              {lead.notes && (
                <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 p-2.5 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    <FileText className="w-3 h-3 text-amber-600" />
                    Internal Notes & Remarks
                  </div>
                  <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed italic line-clamp-3">
                    "{lead.notes}"
                  </p>
                </div>
              )}

              {/* Next Scheduled Follow-up */}
              {lead.nextFollowUpDate && (
                <div className="flex items-center justify-between text-[11px] bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-800/60 px-2.5 py-1.5 rounded-md">
                  <span className="text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    Next Follow-up:
                  </span>
                  <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                    {formatDate(lead.nextFollowUpDate)}
                  </span>
                </div>
              )}

              {/* Audit Timestamps */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Captured Date:
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {formatDate(lead.createdAt)}
                    {lead.createdByName ? ` by ${lead.createdByName}` : ''}
                  </span>
                </div>
                {lead.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span>Last Updated:</span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {formatDate(lead.updatedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action: View Full Record */}
            <div className="p-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 rounded-b-xl flex items-center justify-between">
              <span className="text-[10px] text-slate-400 italic">
                Press Esc to close
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (onViewDetails) {
                    onViewDetails();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs hover:shadow transition-all"
              >
                <span>View Full Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
