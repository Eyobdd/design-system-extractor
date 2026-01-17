import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardSidebar } from './wizard-sidebar';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState } from '@/lib/wizard-types';
import { getInitialWizardState } from '@/lib/wizard-types';

vi.mock('./step-indicator', () => ({
  StepIndicator: ({
    step,
    isActive,
    isCompleted,
    isClickable,
    onClick,
  }: {
    step: number;
    isActive: boolean;
    isCompleted: boolean;
    isClickable: boolean;
    onClick: () => void;
  }) => (
    <button
      data-testid={`step-${step}`}
      data-active={isActive}
      data-completed={isCompleted}
      disabled={!isClickable}
      onClick={onClick}
    >
      Step {step}
    </button>
  ),
}));

vi.mock('./sidebar-tools', () => ({
  SidebarTools: () => <div data-testid="sidebar-tools">Sidebar Tools</div>,
}));

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState = { ...getInitialWizardState(), ...overrides };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

describe('WizardSidebar', () => {
  it('renders all step indicators', () => {
    render(<WizardSidebar />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('step-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-2')).toBeInTheDocument();
    expect(screen.getByTestId('step-3')).toBeInTheDocument();
    expect(screen.getByTestId('step-4')).toBeInTheDocument();
    expect(screen.getByTestId('step-5')).toBeInTheDocument();
  });

  it('renders Steps heading', () => {
    render(<WizardSidebar />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Steps')).toBeInTheDocument();
  });

  it('renders SidebarTools', () => {
    render(<WizardSidebar />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('sidebar-tools')).toBeInTheDocument();
  });

  it('marks current step as active', () => {
    render(<WizardSidebar />, {
      wrapper: createWrapper({ currentStep: 2 }),
    });

    expect(screen.getByTestId('step-2')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('step-1')).toHaveAttribute('data-active', 'false');
  });

  it('marks completed steps', () => {
    render(<WizardSidebar />, {
      wrapper: createWrapper({
        currentStep: 3,
        completedSteps: new Set([1, 2]),
      }),
    });

    expect(screen.getByTestId('step-1')).toHaveAttribute('data-completed', 'true');
    expect(screen.getByTestId('step-2')).toHaveAttribute('data-completed', 'true');
    expect(screen.getByTestId('step-3')).toHaveAttribute('data-completed', 'false');
  });

  it('calls onRequestReset when clicking step 1 from later step', () => {
    const onRequestReset = vi.fn();
    render(<WizardSidebar onRequestReset={onRequestReset} />, {
      wrapper: createWrapper({ currentStep: 3 }),
    });

    fireEvent.click(screen.getByTestId('step-1'));
    expect(onRequestReset).toHaveBeenCalled();
  });

  it('navigates to previous steps without reset', () => {
    render(<WizardSidebar />, {
      wrapper: createWrapper({ currentStep: 3 }),
    });

    // Step 2 should be clickable when on step 3
    expect(screen.getByTestId('step-2')).not.toBeDisabled();
  });

  it('renders as aside element', () => {
    render(<WizardSidebar />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });
});
