import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardFooter } from './wizard-footer';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState } from '@/lib/wizard-types';
import { getInitialWizardState } from '@/lib/wizard-types';

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState = { ...getInitialWizardState(), ...overrides };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

describe('WizardFooter', () => {
  describe('Step 1 (Extract)', () => {
    it('does not show Back button on first step', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 1 }),
      });

      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('does not show Continue button on first step', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 1 }),
      });

      expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    });
  });

  describe('Step 2 (Tokens)', () => {
    it('shows Back button', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 2 }),
      });

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('shows Lock Tokens button when unlocked', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 2, tokensLocked: false }),
      });

      expect(screen.getByRole('button', { name: /lock tokens/i })).toBeInTheDocument();
    });

    it('shows Unlock button when locked', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 2, tokensLocked: true }),
      });

      expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument();
    });

    it('Continue is disabled when tokens are not locked', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 2, tokensLocked: false }),
      });

      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    });

    it('Continue is enabled when tokens are locked', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 2, tokensLocked: true }),
      });

      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
    });

    it('calls onRequestReset when Back is clicked', () => {
      const onRequestReset = vi.fn();
      render(<WizardFooter onRequestReset={onRequestReset} />, {
        wrapper: createWrapper({ currentStep: 2 }),
      });

      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(onRequestReset).toHaveBeenCalled();
    });
  });

  describe('Step 3 (Variants)', () => {
    it('shows Lock Variants button when unlocked', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 3, variantsLocked: false }),
      });

      expect(screen.getByRole('button', { name: /lock variants/i })).toBeInTheDocument();
    });

    it('shows Unlock button when locked', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 3, variantsLocked: true }),
      });

      expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument();
    });

    it('Back button navigates to previous step', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 3 }),
      });

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  describe('Step 4 (Review)', () => {
    it('shows Continue button', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 4 }),
      });

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('does not show lock buttons', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 4 }),
      });

      expect(screen.queryByRole('button', { name: /lock/i })).not.toBeInTheDocument();
    });
  });

  describe('Step 5 (Export)', () => {
    it('does not show Continue button on last step', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 5 }),
      });

      expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    });

    it('shows Back button', () => {
      render(<WizardFooter />, {
        wrapper: createWrapper({ currentStep: 5 }),
      });

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });
});
