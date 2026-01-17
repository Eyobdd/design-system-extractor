'use client';

import { useWizard } from '@/hooks/use-wizard';
import { VariantDetail } from '../variants/variant-detail';
import { NewVariantForm } from '../variants/new-variant-form';
import { ChevronLeft, ChevronRight, Check, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { getVariantCounts, variantHasDeletedTokens } from '@/lib/wizard-types';

export function VariantEditorStep() {
  const {
    state,
    currentVariant,
    currentVariants,
    prevVariant,
    nextVariant,
    approveVariant,
    rejectVariant,
    setPendingVariant,
  } = useWizard();

  const counts = getVariantCounts(state.variants);
  const hasVariants = currentVariants.length > 0;
  const isCreating = state.isCreatingNewVariant;
  const isLocked = state.variantsLocked;
  // Can only lock when there are 0 pending variants
  const canLock = counts.pending === 0 && counts.total > 0;

  // Check if current variant has deleted tokens
  const hasDeletedTokens = currentVariant
    ? variantHasDeletedTokens(currentVariant, state.tokens)
    : false;

  const componentLabels: Record<string, string> = {
    buttons: 'Buttons',
    text: 'Text',
    cards: 'Cards',
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          Variant Editor
        </h2>
        <p style={{ color: 'var(--muted)' }}>Review and approve component variants</p>
      </div>

      {/* Lock status banner */}
      {isLocked && (
        <div
          className="mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--accent)',
          }}
        >
          <AlertCircle className="h-4 w-4" />
          Variants are locked. Use the footer button to unlock.
        </div>
      )}

      {isCreating ? (
        <NewVariantForm />
      ) : hasVariants && currentVariant ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {componentLabels[state.currentComponent]} Variant {state.currentVariantIndex + 1} of{' '}
              {currentVariants.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevVariant}
                disabled={state.currentVariantIndex === 0}
                className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextVariant}
                disabled={state.currentVariantIndex >= currentVariants.length - 1}
                className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <VariantDetail variant={currentVariant} />

          {/* Warning chip for deleted tokens */}
          {hasDeletedTokens && !isLocked && (
            <div
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                color: '#ca8a04',
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              Please address deleted token assignments before proceeding
            </div>
          )}

          {/* Approve/Reject chip-style buttons */}
          {!isLocked && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (currentVariant.status === 'rejected') {
                    setPendingVariant();
                  } else {
                    rejectVariant();
                  }
                }}
                disabled={hasDeletedTokens}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor:
                    currentVariant.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  color: currentVariant.status === 'rejected' ? '#ef4444' : 'var(--muted)',
                  border:
                    currentVariant.status === 'rejected'
                      ? '1.5px solid #ef4444'
                      : '1.5px solid var(--border)',
                }}
              >
                <X className="h-4 w-4" />
                Rejected
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentVariant.status === 'approved') {
                    setPendingVariant();
                  } else {
                    approveVariant();
                  }
                }}
                disabled={hasDeletedTokens}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor:
                    currentVariant.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                  color: currentVariant.status === 'approved' ? '#22c55e' : 'var(--muted)',
                  border:
                    currentVariant.status === 'approved'
                      ? '1.5px solid #22c55e'
                      : '1.5px solid var(--border)',
                }}
              >
                <Check className="h-4 w-4" />
                Approved
              </button>
            </div>
          )}

          {/* Show current status when locked */}
          {isLocked && (
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor:
                    currentVariant.status === 'approved'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : currentVariant.status === 'rejected'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'var(--border)',
                  color:
                    currentVariant.status === 'approved'
                      ? '#22c55e'
                      : currentVariant.status === 'rejected'
                        ? '#ef4444'
                        : 'var(--muted)',
                }}
              >
                {currentVariant.status === 'approved' && <Check className="h-4 w-4" />}
                {currentVariant.status === 'rejected' && <X className="h-4 w-4" />}
                {currentVariant.status.charAt(0).toUpperCase() + currentVariant.status.slice(1)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            No variants found. Use the sidebar to add new variants manually.
          </p>
        </div>
      )}

      {/* Review Progress */}
      <div className="mt-8 rounded-lg p-4" style={{ border: '1px solid var(--border)' }}>
        <h3 className="mb-3 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Review Progress
        </h3>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
            <span style={{ color: 'var(--muted)' }}>Pending: {counts.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span style={{ color: 'var(--muted)' }}>Approved: {counts.approved}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span style={{ color: 'var(--muted)' }}>Rejected: {counts.rejected}</span>
          </div>
        </div>
        {!canLock && counts.total > 0 && (
          <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
            Review all variants to lock and continue
          </p>
        )}
      </div>
    </div>
  );
}
