import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorTable } from './color-table';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState } from '@/lib/wizard-types';
import { getInitialWizardState, getDefaultTokens } from '@/lib/wizard-types';

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState = { ...getInitialWizardState(), ...overrides };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

describe('ColorTable', () => {
  it('renders Colors heading', () => {
    render(<ColorTable />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole('heading', { name: 'Colors' })).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<ColorTable />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });

  it('renders Add button when not locked', () => {
    render(<ColorTable />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('does not render Add button when locked', () => {
    render(<ColorTable />, {
      wrapper: createWrapper({ tokensLocked: true }),
    });

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
  });

  it('renders empty state when no colors', () => {
    const tokens = getDefaultTokens();
    tokens.colors = {};

    render(<ColorTable />, {
      wrapper: createWrapper({ tokens }),
    });

    expect(screen.getByText(/no colors extracted/i)).toBeInTheDocument();
  });

  it('renders color tokens', () => {
    const tokens = getDefaultTokens();
    tokens.colors = {
      primary: { value: '#3b82f6', source: 'css-var', usageCount: 5 },
      secondary: { value: '#10b981', source: 'css-var', usageCount: 3 },
    };

    render(<ColorTable />, {
      wrapper: createWrapper({ tokens }),
    });

    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('secondary')).toBeInTheDocument();
    expect(screen.getByText('#3b82f6')).toBeInTheDocument();
    expect(screen.getByText('#10b981')).toBeInTheDocument();
  });

  it('shows edit and delete buttons when unlocked', () => {
    const tokens = getDefaultTokens();
    tokens.colors = {
      primary: { value: '#3b82f6', source: 'css-var', usageCount: 5 },
    };

    render(<ColorTable />, {
      wrapper: createWrapper({ tokens, tokensLocked: false }),
    });

    expect(screen.getByLabelText('Edit')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('hides edit and delete buttons when locked', () => {
    const tokens = getDefaultTokens();
    tokens.colors = {
      primary: { value: '#3b82f6', source: 'css-var', usageCount: 5 },
    };

    render(<ColorTable />, {
      wrapper: createWrapper({ tokens, tokensLocked: true }),
    });

    expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
  });

  it('shows add row when Add button is clicked', () => {
    render(<ColorTable />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByPlaceholderText('Token name')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    const tokens = getDefaultTokens();
    tokens.colors = {
      primary: { value: '#3b82f6', source: 'css-var', usageCount: 5 },
    };

    render(<ColorTable />, {
      wrapper: createWrapper({ tokens, tokensLocked: false }),
    });

    fireEvent.click(screen.getByLabelText('Edit'));

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('exits edit mode when Cancel is clicked', () => {
    const tokens = getDefaultTokens();
    tokens.colors = {
      primary: { value: '#3b82f6', source: 'css-var', usageCount: 5 },
    };

    render(<ColorTable />, {
      wrapper: createWrapper({ tokens, tokensLocked: false }),
    });

    fireEvent.click(screen.getByLabelText('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('displays usage count', () => {
    const tokens = getDefaultTokens();
    tokens.colors = {
      primary: { value: '#3b82f6', source: 'css-var', usageCount: 5 },
    };

    render(<ColorTable />, {
      wrapper: createWrapper({ tokens }),
    });

    expect(screen.getByText('5x')).toBeInTheDocument();
  });
});
