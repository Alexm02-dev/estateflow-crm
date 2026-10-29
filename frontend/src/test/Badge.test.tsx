import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, StatusBadge } from '../components/common/Badge';

describe('Badge and StatusBadge', () => {
  it('renders default badge with children text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders correct variant for available status', () => {
    render(<StatusBadge status="AVAILABLE" />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders correct variant for booked status', () => {
    render(<StatusBadge status="BOOKED" />);
    expect(screen.getByText('Booked')).toBeInTheDocument();
  });
});
