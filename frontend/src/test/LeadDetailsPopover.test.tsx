import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeadDetailsPopover } from '../components/leads/LeadDetailsPopover';
import { Lead } from '../types';

const mockLead: Lead = {
  id: 101,
  leadCode: 'LD-2026-0101',
  fullName: 'Eleanor Sterling',
  phone: '+1 555-987-6543',
  email: 'eleanor.sterling.verylongemail@luxuryestates-sample.org',
  leadSource: 'WEBSITE',
  stage: 'INTERESTED',
  budget: 1250000,
  interestedProjectId: 3,
  interestedProjectName: 'Elysium Sky Villas',
  assignedToId: 4,
  assignedToName: 'Alexander Hayes',
  notes: 'Client is interested in penthouses with private terrace and sea view.',
  createdById: 1,
  createdByName: 'Admin User',
  createdAt: '2026-09-15T14:30:00',
  updatedAt: '2026-10-20T09:15:00',
};

describe('LeadDetailsPopover Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders trigger element and does not render popover initially', () => {
    render(
      <LeadDetailsPopover lead={mockLead}>
        <span data-testid="lead-trigger">{mockLead.fullName}</span>
      </LeadDetailsPopover>
    );

    expect(screen.getByTestId('lead-trigger')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens popover after 180ms hover intent delay and displays rich non-duplicate details', () => {
    const handleViewDetails = vi.fn();

    render(
      <LeadDetailsPopover lead={mockLead} onViewDetails={handleViewDetails}>
        <span data-testid="lead-trigger">{mockLead.fullName}</span>
      </LeadDetailsPopover>
    );

    const trigger = screen.getByTestId('lead-trigger');

    // Simulate mouse enter
    fireEvent.mouseEnter(trigger);

    // Before 180ms timer completes, dialog should not yet be open
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // After 180ms timer completes, dialog opens via portal
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-label', `Lead details for ${mockLead.fullName}`);

    // Verify rich non-duplicate contents within dialog
    expect(screen.getAllByText('Eleanor Sterling').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('LD-2026-0101')).toBeInTheDocument();
    expect(screen.getByText(mockLead.email!)).toBeInTheDocument();
    expect(screen.getByText(mockLead.phone)).toBeInTheDocument();
    expect(screen.getByText(mockLead.assignedToName!)).toBeInTheDocument();
    expect(screen.getByText(`"${mockLead.notes}"`)).toBeInTheDocument();

    // Verify V-shaped SVG pointer arrow is rendered
    const arrowSvg = dialog.querySelector('svg[aria-hidden="true"]');
    expect(arrowSvg).toBeInTheDocument();

    // Verify "View Full Record" CTA button
    const viewFullBtn = screen.getByText('View Full Record');
    expect(viewFullBtn).toBeInTheDocument();

    fireEvent.click(viewFullBtn);
    expect(handleViewDetails).toHaveBeenCalledTimes(1);
  });

  it('closes popover on Escape keypress', () => {
    render(
      <LeadDetailsPopover lead={mockLead}>
        <span data-testid="lead-trigger">{mockLead.fullName}</span>
      </LeadDetailsPopover>
    );

    const trigger = screen.getByTestId('lead-trigger');
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports click/tap toggle for touch devices', () => {
    render(
      <LeadDetailsPopover lead={mockLead}>
        <span data-testid="lead-trigger">{mockLead.fullName}</span>
      </LeadDetailsPopover>
    );

    const trigger = screen.getByTestId('lead-trigger');

    // Click trigger opens immediately
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Clicking trigger again closes it
    fireEvent.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
