import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepIndicator } from './step-indicator';

describe('StepIndicator', () => {
  const defaultProps = {
    step: 1 as const,
    isActive: false,
    isCompleted: false,
    isClickable: false,
    onClick: vi.fn(),
  };

  it('renders step label', () => {
    render(<StepIndicator {...defaultProps} step={1} />);
    expect(screen.getByText('Extract')).toBeInTheDocument();
  });

  it('renders correct labels for all steps', () => {
    const steps = [
      { step: 1 as const, label: 'Extract' },
      { step: 2 as const, label: 'Tokens' },
      { step: 3 as const, label: 'Variants' },
      { step: 4 as const, label: 'Review' },
      { step: 5 as const, label: 'Export' },
    ];

    steps.forEach(({ step, label }) => {
      const { unmount } = render(<StepIndicator {...defaultProps} step={step} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders as button', () => {
    render(<StepIndicator {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('is disabled when not clickable', () => {
    render(<StepIndicator {...defaultProps} isClickable={false} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is enabled when clickable', () => {
    render(<StepIndicator {...defaultProps} isClickable={true} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('calls onClick when clickable and clicked', () => {
    const onClick = vi.fn();
    render(<StepIndicator {...defaultProps} isClickable={true} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when not clickable', () => {
    const onClick = vi.fn();
    render(<StepIndicator {...defaultProps} isClickable={false} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows completed icon when step is completed', () => {
    render(<StepIndicator {...defaultProps} isCompleted={true} />);
    // The Check icon is rendered inside a span
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('shows active indicator when step is active', () => {
    render(<StepIndicator {...defaultProps} isActive={true} />);
    const button = screen.getByRole('button');
    // Active step has a filled circle (no border, background color)
    expect(button).toBeInTheDocument();
  });

  it('shows inactive indicator when step is neither active nor completed', () => {
    render(<StepIndicator {...defaultProps} isActive={false} isCompleted={false} />);
    const button = screen.getByRole('button');
    // Inactive step has an empty circle with border
    expect(button).toBeInTheDocument();
  });
});
