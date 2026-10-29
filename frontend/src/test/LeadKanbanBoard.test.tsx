import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeadKanbanBoard } from '../components/leads/LeadKanbanBoard';
import { Lead } from '../types';

describe('LeadKanbanBoard Component', () => {
  const mockLeads: Lead[] = [
    {
      id: 101,
      leadCode: 'LEAD-101',
      fullName: 'Eleanor Sterling',
      phone: '+1-555-0199',
      email: 'eleanor.sterling@luxuryhomes.com',
      leadSource: 'WEBSITE',
      stage: 'NEW',
      budget: 850000,
      createdAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 102,
      leadCode: 'LEAD-102',
      fullName: 'Marcus Vance',
      phone: '+1-555-0234',
      email: 'marcus.vance@investcorp.com',
      leadSource: 'REFERRAL',
      stage: 'SITE_VISIT',
      budget: 1200000,
      createdAt: '2026-03-02T11:00:00Z',
    },
    {
      id: 103,
      leadCode: 'LEAD-103',
      fullName: 'Dr. Sophia Reyes',
      phone: '+1-555-0388',
      email: 'sophia.reyes@medcenter.org',
      leadSource: 'WALK_IN',
      stage: 'BOOKED',
      budget: 950000,
      createdAt: '2026-03-03T14:30:00Z',
    },
  ];

  it('renders all 7 pipeline stage columns', () => {
    render(
      <LeadKanbanBoard
        leads={mockLeads}
        onStageChange={vi.fn()}
        onLeadClick={vi.fn()}
      />
    );

    expect(screen.getByText('New Inquiries')).toBeDefined();
    expect(screen.getByText('Contacted')).toBeDefined();
    expect(screen.getByText('Interested')).toBeDefined();
    expect(screen.getByText('Site Visit')).toBeDefined();
    expect(screen.getByText('In Negotiation')).toBeDefined();
    expect(screen.getByText('Converted / Booked')).toBeDefined();
    expect(screen.getByText('Lost / Closed')).toBeDefined();
  });

  it('renders lead cards under their respective stage columns', () => {
    render(
      <LeadKanbanBoard
        leads={mockLeads}
        onStageChange={vi.fn()}
        onLeadClick={vi.fn()}
      />
    );

    expect(screen.getByText('Eleanor Sterling')).toBeDefined();
    expect(screen.getByText('Marcus Vance')).toBeDefined();
    expect(screen.getByText('Dr. Sophia Reyes')).toBeDefined();
    expect(screen.getByText('LEAD-101')).toBeDefined();
    expect(screen.getByText('LEAD-102')).toBeDefined();
    expect(screen.getByText('LEAD-103')).toBeDefined();
  });

  it('calls onLeadClick when clicking a lead card', () => {
    const handleLeadClick = vi.fn();
    render(
      <LeadKanbanBoard
        leads={mockLeads}
        onStageChange={vi.fn()}
        onLeadClick={handleLeadClick}
      />
    );

    const card = screen.getByText('Eleanor Sterling');
    fireEvent.click(card);

    expect(handleLeadClick).toHaveBeenCalledTimes(1);
    expect(handleLeadClick).toHaveBeenCalledWith(mockLeads[0]);
  });
});
