import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepContent } from './step-content';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState } from '@/lib/wizard-types';
import { getInitialWizardState } from '@/lib/wizard-types';

vi.mock('./steps/extract-step', () => ({
  ExtractStep: () => <div data-testid="extract-step">Extract Step</div>,
}));

vi.mock('./steps/token-editor-step', () => ({
  TokenEditorStep: () => <div data-testid="token-editor-step">Token Editor Step</div>,
}));

vi.mock('./steps/variant-editor-step', () => ({
  VariantEditorStep: () => <div data-testid="variant-editor-step">Variant Editor Step</div>,
}));

vi.mock('./steps/review-step', () => ({
  ReviewStep: () => <div data-testid="review-step">Review Step</div>,
}));

vi.mock('./steps/export-step', () => ({
  ExportStep: () => <div data-testid="export-step">Export Step</div>,
}));

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState = { ...getInitialWizardState(), ...overrides };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

describe('StepContent', () => {
  it('renders ExtractStep for step 1', () => {
    render(<StepContent />, {
      wrapper: createWrapper({ currentStep: 1 }),
    });

    expect(screen.getByTestId('extract-step')).toBeInTheDocument();
  });

  it('renders TokenEditorStep for step 2', () => {
    render(<StepContent />, {
      wrapper: createWrapper({ currentStep: 2 }),
    });

    expect(screen.getByTestId('token-editor-step')).toBeInTheDocument();
  });

  it('renders VariantEditorStep for step 3', () => {
    render(<StepContent />, {
      wrapper: createWrapper({ currentStep: 3 }),
    });

    expect(screen.getByTestId('variant-editor-step')).toBeInTheDocument();
  });

  it('renders ReviewStep for step 4', () => {
    render(<StepContent />, {
      wrapper: createWrapper({ currentStep: 4 }),
    });

    expect(screen.getByTestId('review-step')).toBeInTheDocument();
  });

  it('renders ExportStep for step 5', () => {
    render(<StepContent />, {
      wrapper: createWrapper({ currentStep: 5 }),
    });

    expect(screen.getByTestId('export-step')).toBeInTheDocument();
  });

  it('renders ExtractStep for invalid step (default)', () => {
    render(<StepContent />, {
      wrapper: createWrapper({ currentStep: 99 as never }),
    });

    expect(screen.getByTestId('extract-step')).toBeInTheDocument();
  });
});
