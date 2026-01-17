import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { WizardProvider, useWizardContext } from './wizard-context';
import type { ReactNode } from 'react';

describe('WizardContext', () => {
  describe('WizardProvider', () => {
    it('provides initial state to children', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <WizardProvider>{children}</WizardProvider>
      );

      const { result } = renderHook(() => useWizardContext(), { wrapper });

      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.extractionStatus).toBe('idle');
    });

    it('accepts partial initial state overrides', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <WizardProvider initialState={{ sourceUrl: 'https://test.com', currentStep: 2 }}>
          {children}
        </WizardProvider>
      );

      const { result } = renderHook(() => useWizardContext(), { wrapper });

      expect(result.current.state.sourceUrl).toBe('https://test.com');
      expect(result.current.state.currentStep).toBe(2);
      expect(result.current.state.extractionStatus).toBe('idle');
    });

    it('provides dispatch function', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <WizardProvider>{children}</WizardProvider>
      );

      const { result } = renderHook(() => useWizardContext(), { wrapper });

      expect(typeof result.current.dispatch).toBe('function');
    });
  });

  describe('useWizardContext', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useWizardContext());
      }).toThrow('useWizardContext must be used within a WizardProvider');
    });
  });
});
