'use client';

import { useWizard } from '@/hooks/use-wizard';
import { ExtractStep } from './steps/extract-step';
import { TokenEditorStep } from './steps/token-editor-step';
import { VariantEditorStep } from './steps/variant-editor-step';
import { ReviewStep } from './steps/review-step';
import { ExportStep } from './steps/export-step';

export function StepContent() {
  const { state } = useWizard();

  switch (state.currentStep) {
    case 1:
      return <ExtractStep />;
    case 2:
      return <TokenEditorStep />;
    case 3:
      return <VariantEditorStep />;
    case 4:
      return <ReviewStep />;
    case 5:
      return <ExportStep />;
    default:
      return <ExtractStep />;
  }
}
