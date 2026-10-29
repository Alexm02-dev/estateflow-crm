import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeadRow } from '../components/leads/LeadRow';
import { Lead } from '../types';

const mockLead: Lead = {
  id: 42,
  leadCode: 'LD-2026-0042',
  fullName: 'Marcus Vance',
  phone: '+1 555-0142',
  email: 'marcus.vance@example.com',
  leadSource: 'WEBSITE',
  stage: 'INTERESTED',
  budget: 750000,
  interestedProjectId: 1,
  interestedProjectName: 'Azure Residences',
  assignedToId: 2,
  assignedToName: 'Sarah Agent',
  createdAt: '2026-10-01T10:00:00',
};

describe('LeadRow Component', () => {
  it('renders lead information correctly', () => {
    render(<LeadRow lead={mockLead} isSelected={false} onSelect={vi.fn()} />);

    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.getByText('LD-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('+1 555-0142')).toBeInTheDocument();
    expect(screen.getByText('marcus.vance@example.com')).toBeInTheDocument();
    expect(screen.getByText('Azure Residences')).toBeInTheDocument();
    expect(screen.getByText('$750,000')).toBeInTheDocument();
  });

  it('calls onSelect when row is clicked', () => {
    const handleSelect = vi.fn();
    render(<LeadRow lead={mockLead} isSelected={false} onSelect={handleSelect} />);

    fireEvent.click(screen.getByRole('row'));
    expect(handleSelect).toHaveBeenCalledWith(mockLead);
  });

  it('clicking checkbox selects lead without invoking onProceed', () => {
    const handleSelect = vi.fn();
    const handleProceed = vi.fn();

    render(
      <LeadRow
        lead={mockLead}
        isSelected={false}
        onSelect={handleSelect}
        onProceed={handleProceed}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(handleSelect).toHaveBeenCalledWith(mockLead);
    expect(handleProceed).not.toHaveBeenCalled();
  });

  it('clicking action button calls onProceed', () => {
    const handleSelect = vi.fn();
    const handleProceed = vi.fn();

    render(
      <LeadRow
        lead={mockLead}
        isSelected={false}
        onSelect={handleSelect}
        onProceed={handleProceed}
        actionLabel="Select & Proceed"
      />
    );

    const proceedBtn = screen.getByText('Select & Proceed');
    fireEvent.click(proceedBtn);

    expect(handleSelect).toHaveBeenCalledWith(mockLead);
    expect(handleProceed).toHaveBeenCalledWith(mockLead);
  });

  it('applies distinct styling when isSelected is true', () => {
    const { rerender } = render(
      <LeadRow lead={mockLead} isSelected={false} onSelect={vi.fn()} />
    );
    expect(screen.getByRole('row')).toHaveAttribute('aria-selected', 'false');

    rerender(<LeadRow lead={mockLead} isSelected={true} onSelect={vi.fn()} />);
    expect(screen.getByRole('row')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Proceed to Unit')).toBeInTheDocument();
  });
});
