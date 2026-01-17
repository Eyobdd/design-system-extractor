import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardLayout } from './wizard-layout';
import { WizardProvider } from '@/contexts/wizard-context';

vi.mock('./wizard-sidebar', () => ({
  WizardSidebar: ({ onRequestReset }: { onRequestReset?: () => void }) => (
    <div data-testid="wizard-sidebar">
      <button onClick={onRequestReset}>Request Reset Sidebar</button>
    </div>
  ),
}));

vi.mock('./wizard-footer', () => ({
  WizardFooter: ({ onRequestReset }: { onRequestReset?: () => void }) => (
    <div data-testid="wizard-footer">
      <button onClick={onRequestReset}>Request Reset Footer</button>
    </div>
  ),
}));

vi.mock('./step-content', () => ({
  StepContent: () => <div data-testid="step-content">Step Content</div>,
}));

vi.mock('./confirmation-modal', () => ({
  ConfirmationModal: ({
    isOpen,
    onConfirm,
    onCancel,
    title,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <span>{title}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <WizardProvider>{children}</WizardProvider>;
}

describe('WizardLayout', () => {
  it('renders sidebar', () => {
    render(<WizardLayout />, { wrapper: Wrapper });
    expect(screen.getByTestId('wizard-sidebar')).toBeInTheDocument();
  });

  it('renders step content', () => {
    render(<WizardLayout />, { wrapper: Wrapper });
    expect(screen.getByTestId('step-content')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<WizardLayout />, { wrapper: Wrapper });
    expect(screen.getByTestId('wizard-footer')).toBeInTheDocument();
  });

  it('does not show reset modal by default', () => {
    render(<WizardLayout />, { wrapper: Wrapper });
    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
  });

  it('shows reset modal when reset is requested from sidebar', () => {
    render(<WizardLayout />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('Request Reset Sidebar'));
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    expect(screen.getByText('Start Over?')).toBeInTheDocument();
  });

  it('shows reset modal when reset is requested from footer', () => {
    render(<WizardLayout />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('Request Reset Footer'));
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
  });

  it('hides modal when cancel is clicked', () => {
    render(<WizardLayout />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('Request Reset Sidebar'));
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
  });

  it('resets wizard when confirm is clicked', () => {
    render(<WizardLayout />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('Request Reset Sidebar'));
    fireEvent.click(screen.getByText('Confirm'));

    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    render(<WizardLayout />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument();
  });

  it('toggles mobile menu on button click', () => {
    render(<WizardLayout />, { wrapper: Wrapper });

    const menuButton = screen.getByLabelText(/open menu/i);
    fireEvent.click(menuButton);

    expect(screen.getByLabelText(/close menu/i)).toBeInTheDocument();
  });
});
