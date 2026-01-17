'use client';

import { ArrowLeft, ArrowRight, Lock, Unlock } from 'lucide-react';
import { useWizard } from '@/hooks/use-wizard';
import { Tooltip } from './tooltip';

interface WizardFooterProps {
  onRequestReset?: () => void;
}

export function WizardFooter({ onRequestReset }: WizardFooterProps) {
  const {
    state,
    prevStep,
    nextStep,
    lockTokens,
    unlockTokens,
    lockVariants,
    unlockVariants,
    canProceed,
  } = useWizard();

  const isFirstStep = state.currentStep === 1;
  const isLastStep = state.currentStep === 5;
  const isTokenStep = state.currentStep === 2;
  const isVariantStep = state.currentStep === 3;

  const canContinue = isTokenStep
    ? state.tokensLocked
    : isVariantStep
      ? state.variantsLocked
      : canProceed;

  const handleBack = () => {
    // If on Token step (step 2), show reset confirmation instead of going back
    if (isTokenStep && onRequestReset) {
      onRequestReset();
      return;
    }
    prevStep();
  };

  return (
    <footer
      className="flex items-center justify-between px-12 py-5"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div>
        {!isFirstStep && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--muted)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Lock/Unlock button - on Token and Variant steps */}
        {isTokenStep && (
          <button
            type="button"
            onClick={state.tokensLocked ? unlockTokens : lockTokens}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              state.tokensLocked ? 'border border-current' : 'border'
            }`}
            style={{
              color: state.tokensLocked ? 'var(--accent)' : 'var(--muted)',
              borderColor: state.tokensLocked ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {state.tokensLocked ? (
              <>
                <Unlock className="h-4 w-4" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Lock Tokens
              </>
            )}
          </button>
        )}

        {isVariantStep && (
          <Tooltip
            content={'Review all pending variants (approve or reject) to lock variants.'}
            disabled={state.variantsLocked || canProceed}
          >
            <span>
              <button
                type="button"
                onClick={state.variantsLocked ? unlockVariants : lockVariants}
                disabled={!canProceed && !state.variantsLocked}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                  state.variantsLocked ? 'border border-current' : 'border'
                }`}
                style={{
                  color: state.variantsLocked ? 'var(--accent)' : 'var(--muted)',
                  borderColor: state.variantsLocked ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {state.variantsLocked ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Lock Variants
                  </>
                )}
              </button>
            </span>
          </Tooltip>
        )}

        {/* Continue button - not shown on Extract step (auto-advances) */}
        {!isLastStep && !isFirstStep && (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canContinue}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </footer>
  );
}
