import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizard } from './use-wizard';
import { WizardProvider } from '@/contexts/wizard-context';
import { getDefaultTokens, getDefaultVariants } from '@/lib/wizard-types';
import type { ReactNode } from 'react';

function createWrapper(initialState = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

describe('useWizard', () => {
  describe('initialization', () => {
    it('returns initial state', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.extractionStatus).toBe('idle');
    });

    it('accepts initial state overrides', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ sourceUrl: 'https://example.com' }),
      });

      expect(result.current.state.sourceUrl).toBe('https://example.com');
    });
  });

  describe('step navigation', () => {
    it('goToStep changes current step when going to a completed step', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          currentStep: 3,
          extractionStatus: 'complete',
          completedSteps: new Set([1, 2]),
        }),
      });

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.state.currentStep).toBe(2);
    });

    it('nextStep advances when can proceed', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ extractionStatus: 'complete' }),
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(2);
    });

    it('nextStep does not advance when cannot proceed', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ extractionStatus: 'idle' }),
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(1);
    });

    it('prevStep goes back', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ currentStep: 3 }),
      });

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.state.currentStep).toBe(2);
    });
  });

  describe('extraction actions', () => {
    it('setSourceUrl updates the URL', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setSourceUrl('https://test.com');
      });

      expect(result.current.state.sourceUrl).toBe('https://test.com');
    });

    it('startExtraction sets status to extracting', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.startExtraction();
      });

      expect(result.current.state.extractionStatus).toBe('extracting');
    });

    it('updateExtractionProgress updates progress', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ extractionStatus: 'extracting' }),
      });

      act(() => {
        result.current.updateExtractionProgress(50);
      });

      expect(result.current.state.extractionProgress).toBe(50);
    });

    it('completeExtraction sets complete status and stores data', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ extractionStatus: 'extracting' }),
      });

      act(() => {
        result.current.completeExtraction(
          'checkpoint-123',
          getDefaultTokens(),
          getDefaultVariants()
        );
      });

      expect(result.current.state.extractionStatus).toBe('complete');
      expect(result.current.state.checkpointId).toBe('checkpoint-123');
    });

    it('setExtractionError sets error status', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ extractionStatus: 'extracting' }),
      });

      act(() => {
        result.current.setExtractionError('Network error');
      });

      expect(result.current.state.extractionStatus).toBe('error');
      expect(result.current.state.extractionError).toBe('Network error');
    });
  });

  describe('token actions', () => {
    it('addToken adds a color token', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addToken('colors', 'primary', {
          value: '#3b82f6',
          source: 'manual',
          usageCount: 1,
        });
      });

      expect(result.current.state.tokens.colors['primary']).toBeDefined();
    });

    it('updateToken updates an existing token', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          tokens: {
            ...getDefaultTokens(),
            colors: { primary: { value: '#3b82f6', source: 'manual', usageCount: 1 } },
          },
        }),
      });

      act(() => {
        result.current.updateToken('colors', 'primary', {
          value: '#ef4444',
          source: 'manual',
          usageCount: 1,
        });
      });

      expect(result.current.state.tokens.colors['primary']?.value).toBe('#ef4444');
    });

    it('deleteToken removes a token', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          tokens: {
            ...getDefaultTokens(),
            colors: { primary: { value: '#3b82f6', source: 'manual', usageCount: 1 } },
          },
        }),
      });

      act(() => {
        result.current.deleteToken('colors', 'primary');
      });

      expect(result.current.state.tokens.colors['primary']).toBeUndefined();
    });

    it('addSimpleToken adds a non-color token', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.addSimpleToken('spacing', 'lg', '24px');
      });

      expect(result.current.state.tokens.spacing['lg']).toBe('24px');
    });

    it('lockTokens locks tokens', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.lockTokens();
      });

      expect(result.current.state.tokensLocked).toBe(true);
    });

    it('unlockTokens unlocks tokens', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ tokensLocked: true }),
      });

      act(() => {
        result.current.unlockTokens();
      });

      expect(result.current.state.tokensLocked).toBe(false);
    });
  });

  describe('variant actions', () => {
    it('selectComponent changes the current component', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.selectComponent('text');
      });

      expect(result.current.state.currentComponent).toBe('text');
    });

    it('selectVariant changes the current variant index', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.selectVariant(2);
      });

      expect(result.current.state.currentVariantIndex).toBe(2);
    });

    it('approveVariant sets status to approved', () => {
      const variant = {
        id: 'v1',
        name: 'Button',
        status: 'pending' as const,
        isManual: false,
        spec: {
          background: '_default',
          color: '_default',
          borderColor: '_default',
          borderWidth: '_default',
          borderRadius: '_default',
          padding: ['_default'] as ['_default'],
          fontSize: '_default',
          fontWeight: '_default',
          fontFamily: '_default',
          shadow: '_default',
        },
      };

      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          variants: { buttons: [variant], text: [], cards: [] },
          currentComponent: 'buttons',
          currentVariantIndex: 0,
        }),
      });

      act(() => {
        result.current.approveVariant();
      });

      expect(result.current.state.variants.buttons[0]?.status).toBe('approved');
    });

    it('rejectVariant sets status to rejected', () => {
      const variant = {
        id: 'v1',
        name: 'Button',
        status: 'pending' as const,
        isManual: false,
        spec: {
          background: '_default',
          color: '_default',
          borderColor: '_default',
          borderWidth: '_default',
          borderRadius: '_default',
          padding: ['_default'] as ['_default'],
          fontSize: '_default',
          fontWeight: '_default',
          fontFamily: '_default',
          shadow: '_default',
        },
      };

      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          variants: { buttons: [variant], text: [], cards: [] },
          currentComponent: 'buttons',
          currentVariantIndex: 0,
        }),
      });

      act(() => {
        result.current.rejectVariant();
      });

      expect(result.current.state.variants.buttons[0]?.status).toBe('rejected');
    });

    it('startNewVariant enters creation mode', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.startNewVariant('cards');
      });

      expect(result.current.state.isCreatingNewVariant).toBe(true);
      expect(result.current.state.currentComponent).toBe('cards');
    });

    it('cancelNewVariant exits creation mode', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ isCreatingNewVariant: true }),
      });

      act(() => {
        result.current.cancelNewVariant();
      });

      expect(result.current.state.isCreatingNewVariant).toBe(false);
    });
  });

  describe('computed values', () => {
    it('canProceed is false when extraction is idle', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ currentStep: 1, extractionStatus: 'idle' }),
      });

      expect(result.current.canProceed).toBe(false);
    });

    it('canProceed is true when extraction is complete', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({ currentStep: 1, extractionStatus: 'complete' }),
      });

      expect(result.current.canProceed).toBe(true);
    });

    it('allReviewed is true with no variants', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.allReviewed).toBe(true);
    });

    it('currentVariants returns variants for current component', () => {
      const variant = {
        id: 'v1',
        name: 'Button',
        status: 'pending' as const,
        isManual: false,
        spec: {
          background: '_default',
          color: '_default',
          borderColor: '_default',
          borderWidth: '_default',
          borderRadius: '_default',
          padding: ['_default'] as ['_default'],
          fontSize: '_default',
          fontWeight: '_default',
          fontFamily: '_default',
          shadow: '_default',
        },
      };

      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          variants: { buttons: [variant], text: [], cards: [] },
          currentComponent: 'buttons',
        }),
      });

      expect(result.current.currentVariants).toHaveLength(1);
      expect(result.current.currentVariants[0]?.name).toBe('Button');
    });

    it('currentVariant returns the selected variant', () => {
      const variant = {
        id: 'v1',
        name: 'Primary Button',
        status: 'pending' as const,
        isManual: false,
        spec: {
          background: '_default',
          color: '_default',
          borderColor: '_default',
          borderWidth: '_default',
          borderRadius: '_default',
          padding: ['_default'] as ['_default'],
          fontSize: '_default',
          fontWeight: '_default',
          fontFamily: '_default',
          shadow: '_default',
        },
      };

      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          variants: { buttons: [variant], text: [], cards: [] },
          currentComponent: 'buttons',
          currentVariantIndex: 0,
        }),
      });

      expect(result.current.currentVariant?.name).toBe('Primary Button');
    });

    it('currentVariant is null when index is out of bounds', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          variants: { buttons: [], text: [], cards: [] },
          currentVariantIndex: 5,
        }),
      });

      expect(result.current.currentVariant).toBeNull();
    });
  });

  describe('resetWizard', () => {
    it('resets all state to initial values', () => {
      const { result } = renderHook(() => useWizard(), {
        wrapper: createWrapper({
          currentStep: 4,
          extractionStatus: 'complete',
          tokensLocked: true,
          sourceUrl: 'https://example.com',
        }),
      });

      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.extractionStatus).toBe('idle');
      expect(result.current.state.tokensLocked).toBe(false);
      expect(result.current.state.sourceUrl).toBe('');
    });
  });
});
