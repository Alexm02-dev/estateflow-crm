import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityTimeline } from '../components/leads/ActivityTimeline';
import { LeadActivity } from '../types';

describe('ActivityTimeline Component', () => {
  const mockActivities: LeadActivity[] = [
    {
      id: 1,
      leadId: 10,
      type: 'CALL',
      description: 'Discussed 3 BHK penthouse unit pricing and payment plan.',
      userName: 'Sarah Jenkins',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      leadId: 10,
      type: 'EMAIL',
      description: 'Sent formal floor plan brochures and specification document.',
      userName: 'Sarah Jenkins',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      leadId: 10,
      type: 'BOOKING',
      description: 'Unit #402 token reservation confirmed via Escrow.',
      userName: 'System Admin',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  it('renders activities with their specific labels and descriptions', () => {
    render(<ActivityTimeline activities={mockActivities} />);

    expect(screen.getByText('Phone Call')).toBeDefined();
    expect(screen.getByText('Email')).toBeDefined();
    expect(screen.getByText('Reservation')).toBeDefined();
    expect(screen.getByText('Discussed 3 BHK penthouse unit pricing and payment plan.')).toBeDefined();
    expect(screen.getByText('Unit #402 token reservation confirmed via Escrow.')).toBeDefined();
  });

  it('renders empty message when no activities are present', () => {
    render(<ActivityTimeline activities={[]} emptyMessage="No interaction records found." />);
    expect(screen.getByText('No interaction records found.')).toBeDefined();
  });

  it('respects maxItems parameter to limit displayed activities', () => {
    render(<ActivityTimeline activities={mockActivities} maxItems={2} />);
    expect(screen.getByText('Discussed 3 BHK penthouse unit pricing and payment plan.')).toBeDefined();
    expect(screen.getByText('Sent formal floor plan brochures and specification document.')).toBeDefined();
    expect(screen.queryByText('Unit #402 token reservation confirmed via Escrow.')).toBeNull();
  });
});
