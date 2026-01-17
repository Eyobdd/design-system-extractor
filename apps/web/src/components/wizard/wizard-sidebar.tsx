'use client';

import { useWizard } from '@/hooks/use-wizard';
import { StepIndicator } from './step-indicator';
import { SidebarTools } from './sidebar-tools';
import type { WizardStep } from '@/lib/wizard-types';

const STEPS: WizardStep[] = [1, 2, 3, 4, 5];

interface WizardSidebarProps {
  onRequestReset?: () => void;
}

export function WizardSidebar({ onRequestReset }: WizardSidebarProps) {
  const { state, goToStep } = useWizard();

  const handleStepClick = (step: WizardStep) => {
    // If navigating back to Extract (step 1) from a later step, show warning
    if (step === 1 && state.currentStep > 1) {
      onRequestReset?.();
      return;
    }

    if (step < state.currentStep || state.completedSteps.has(step)) {
      goToStep(step);
    }
  };

  return (
    <aside
      className="flex w-[200px] flex-shrink-0 flex-col"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="px-5 py-8">
        <p
          className="mb-4 text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--muted)' }}
        >
          Steps
        </p>
        <nav className="space-y-1">
          {STEPS.map(step => (
            <StepIndicator
              key={step}
              step={step}
              isActive={state.currentStep === step}
              isCompleted={state.completedSteps.has(step)}
              isClickable={step < state.currentStep || state.completedSteps.has(step)}
              onClick={() => handleStepClick(step)}
            />
          ))}
        </nav>
      </div>

      <div className="divider-centered" />

      <div className="flex-1 overflow-auto px-5 py-6">
        <SidebarTools />
      </div>
    </aside>
  );
}
