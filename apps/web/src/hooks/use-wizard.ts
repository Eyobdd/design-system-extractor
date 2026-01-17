'use client';

import { useCallback } from 'react';
import { useWizardContext } from '@/contexts/wizard-context';
import type {
  WizardStep,
  ComponentType,
  TokenCategory,
  TokenValue,
  ExtractedTokens,
  VariantsMap,
  ExtractedVariant,
  SpacingTuple,
} from '@/lib/wizard-types';
import { canProceedToNextStep, allVariantsReviewed } from '@/lib/wizard-types';

export function useWizard() {
  const { state, dispatch } = useWizardContext();

  const goToStep = useCallback(
    (step: WizardStep) => {
      dispatch({ type: 'GO_TO_STEP', step });
    },
    [dispatch]
  );

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, [dispatch]);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, [dispatch]);

  const setSourceUrl = useCallback(
    (url: string) => {
      dispatch({ type: 'SET_SOURCE_URL', url });
    },
    [dispatch]
  );

  const startExtraction = useCallback(() => {
    dispatch({ type: 'START_EXTRACTION' });
  }, [dispatch]);

  const updateExtractionProgress = useCallback(
    (progress: number) => {
      dispatch({ type: 'EXTRACTION_PROGRESS', progress });
    },
    [dispatch]
  );

  const completeExtraction = useCallback(
    (checkpointId: string, tokens: ExtractedTokens, variants: VariantsMap) => {
      dispatch({ type: 'EXTRACTION_COMPLETE', checkpointId, tokens, variants });
    },
    [dispatch]
  );

  const setExtractionError = useCallback(
    (error: string) => {
      dispatch({ type: 'EXTRACTION_ERROR', error });
    },
    [dispatch]
  );

  const updateToken = useCallback(
    (category: TokenCategory, key: string, value: TokenValue) => {
      dispatch({ type: 'UPDATE_TOKEN', category, key, value });
    },
    [dispatch]
  );

  const addToken = useCallback(
    (category: TokenCategory, key: string, value: TokenValue) => {
      dispatch({ type: 'ADD_TOKEN', category, key, value });
    },
    [dispatch]
  );

  const deleteToken = useCallback(
    (category: TokenCategory, key: string) => {
      dispatch({ type: 'DELETE_TOKEN', category, key });
    },
    [dispatch]
  );

  const updateSimpleToken = useCallback(
    (category: TokenCategory, key: string, value: string) => {
      dispatch({ type: 'UPDATE_SIMPLE_TOKEN', category, key, value });
    },
    [dispatch]
  );

  const addSimpleToken = useCallback(
    (category: TokenCategory, key: string, value: string) => {
      dispatch({ type: 'ADD_SIMPLE_TOKEN', category, key, value });
    },
    [dispatch]
  );

  const deleteSimpleToken = useCallback(
    (category: TokenCategory, key: string) => {
      dispatch({ type: 'DELETE_SIMPLE_TOKEN', category, key });
    },
    [dispatch]
  );

  const lockTokens = useCallback(() => {
    dispatch({ type: 'LOCK_TOKENS' });
  }, [dispatch]);

  const unlockTokens = useCallback(() => {
    dispatch({ type: 'UNLOCK_TOKENS' });
  }, [dispatch]);

  const lockVariants = useCallback(() => {
    dispatch({ type: 'LOCK_VARIANTS' });
  }, [dispatch]);

  const unlockVariants = useCallback(() => {
    dispatch({ type: 'UNLOCK_VARIANTS' });
  }, [dispatch]);

  const selectComponent = useCallback(
    (component: ComponentType) => {
      dispatch({ type: 'SELECT_COMPONENT', component });
    },
    [dispatch]
  );

  const selectVariant = useCallback(
    (index: number) => {
      dispatch({ type: 'SELECT_VARIANT', index });
    },
    [dispatch]
  );

  const updateVariantSpec = useCallback(
    (property: string, value: string | SpacingTuple) => {
      dispatch({ type: 'UPDATE_VARIANT_SPEC', property, value });
    },
    [dispatch]
  );

  const approveVariant = useCallback(() => {
    dispatch({ type: 'APPROVE_VARIANT' });
  }, [dispatch]);

  const rejectVariant = useCallback(() => {
    dispatch({ type: 'REJECT_VARIANT' });
  }, [dispatch]);

  const setPendingVariant = useCallback(() => {
    dispatch({ type: 'SET_PENDING_VARIANT' });
  }, [dispatch]);

  const renameVariant = useCallback(
    (name: string) => {
      dispatch({ type: 'RENAME_VARIANT', name });
    },
    [dispatch]
  );

  const startNewVariant = useCallback(
    (componentType: ComponentType) => {
      dispatch({ type: 'START_NEW_VARIANT', componentType });
    },
    [dispatch]
  );

  const cancelNewVariant = useCallback(() => {
    dispatch({ type: 'CANCEL_NEW_VARIANT' });
  }, [dispatch]);

  const saveNewVariant = useCallback(
    (variant: ExtractedVariant) => {
      dispatch({ type: 'SAVE_NEW_VARIANT', variant });
    },
    [dispatch]
  );

  const prevVariant = useCallback(() => {
    dispatch({ type: 'PREV_VARIANT' });
  }, [dispatch]);

  const nextVariant = useCallback(() => {
    dispatch({ type: 'NEXT_VARIANT' });
  }, [dispatch]);

  const resetWizard = useCallback(() => {
    dispatch({ type: 'RESET_WIZARD' });
  }, [dispatch]);

  const canProceed = canProceedToNextStep(state);
  const allReviewed = allVariantsReviewed(state.variants);

  const currentVariants = state.variants[state.currentComponent];
  const currentVariant =
    state.currentVariantIndex < currentVariants.length
      ? currentVariants[state.currentVariantIndex]
      : null;

  return {
    state,
    dispatch,

    goToStep,
    nextStep,
    prevStep,

    setSourceUrl,
    startExtraction,
    updateExtractionProgress,
    completeExtraction,
    setExtractionError,

    updateToken,
    addToken,
    deleteToken,
    updateSimpleToken,
    addSimpleToken,
    deleteSimpleToken,
    lockTokens,
    unlockTokens,
    lockVariants,
    unlockVariants,

    selectComponent,
    selectVariant,
    updateVariantSpec,
    approveVariant,
    rejectVariant,
    setPendingVariant,
    renameVariant,
    startNewVariant,
    cancelNewVariant,
    saveNewVariant,
    prevVariant,
    nextVariant,

    resetWizard,

    canProceed,
    allReviewed,
    currentVariants,
    currentVariant,
  };
}
