import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WizardStepper } from '../components/wizard/WizardStepper';

describe('WizardStepper Component', () => {
  it('renders all wizard steps', () => {
    render(<WizardStepper currentStep={1} />);

    expect(screen.getByText('Select Buyer')).toBeInTheDocument();
    expect(screen.getByText('Select Property Unit')).toBeInTheDocument();
    expect(screen.getByText('Pricing & Terms')).toBeInTheDocument();
    expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
  });

  it('indicates current active step with aria-current="step"', () => {
    render(<WizardStepper currentStep={2} />);

    const stepElements = screen.getAllByRole('generic');
    const step2 = screen.getByText('2');
    expect(step2).toHaveAttribute('aria-current', 'step');
  });

  it('allows clicking previous completed steps', () => {
    const handleStepClick = vi.fn();
    render(<WizardStepper currentStep={3} onStepClick={handleStepClick} />);

    // Step 1 is completed
    const step1Label = screen.getByText('Select Buyer');
    fireEvent.click(step1Label);
    expect(handleStepClick).toHaveBeenCalledWith(1);
  });
});
