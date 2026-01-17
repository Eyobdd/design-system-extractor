'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { WizardState } from '@/lib/wizard-types';
import { getInitialWizardState } from '@/lib/wizard-types';
import { wizardReducer, type WizardAction } from '@/lib/wizard-reducer';

interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

interface WizardProviderProps {
  children: ReactNode;
  initialState?: Partial<WizardState>;
}

export function WizardProvider({ children, initialState }: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...getInitialWizardState(),
    ...initialState,
  });

  return <WizardContext.Provider value={{ state, dispatch }}>{children}</WizardContext.Provider>;
}

export function useWizardContext(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizardContext must be used within a WizardProvider');
  }
  return context;
}
