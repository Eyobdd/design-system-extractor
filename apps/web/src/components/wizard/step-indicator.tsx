'use client';

import { Check } from 'lucide-react';
import type { WizardStep } from '@/lib/wizard-types';
import { STEP_LABELS } from '@/lib/wizard-types';

interface StepIndicatorProps {
  step: WizardStep;
  isActive: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  onClick: () => void;
}

export function StepIndicator({
  step,
  isActive,
  isCompleted,
  isClickable,
  onClick,
}: StepIndicatorProps) {
  const label = STEP_LABELS[step];

  const getStatusIcon = () => {
    if (isCompleted) {
      return (
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Check className="h-2.5 w-2.5 text-white" />
        </span>
      );
    }
    if (isActive) {
      return (
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--accent)' }}
        />
      );
    }
    return (
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full"
        style={{ border: '1.5px solid var(--border)' }}
      />
    );
  };

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-all ${
        isClickable ? 'cursor-pointer hover:opacity-70' : 'cursor-default'
      }`}
      style={{
        color: isActive ? 'var(--foreground)' : isCompleted ? 'var(--foreground)' : 'var(--muted)',
        fontWeight: isActive ? 500 : 400,
      }}
    >
      {getStatusIcon()}
      <span>{label}</span>
    </button>
  );
}
