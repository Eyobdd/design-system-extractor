/**
 * Reducer for wizard state management
 */

import type {
  WizardState,
  WizardStep,
  ComponentType,
  TokenCategory,
  TokenValue,
  ExtractedTokens,
  VariantsMap,
  ExtractedVariant,
  SpacingTuple,
} from './wizard-types';
import {
  getInitialWizardState,
  canProceedToNextStep,
  PROPERTY_TOKEN_CATEGORY,
} from './wizard-types';

function resetApprovedVariantsUsingToken(
  variants: VariantsMap,
  category: TokenCategory,
  tokenKey: string
): VariantsMap {
  const shouldResetVariant = (variant: ExtractedVariant): boolean => {
    const spec = variant.spec as unknown as Record<string, unknown>;

    for (const [property, value] of Object.entries(spec)) {
      const propertyCategory = PROPERTY_TOKEN_CATEGORY[property];
      if (!propertyCategory || propertyCategory !== category) continue;

      if (property === 'padding' && Array.isArray(value)) {
        return value.some(v => v === tokenKey);
      }

      if (value === tokenKey) return true;
    }

    return false;
  };

  const resetList = (list: ExtractedVariant[]) =>
    list.map(v => {
      if (v.status !== 'approved') return v;
      if (!shouldResetVariant(v)) return v;
      return { ...v, status: 'pending' as const };
    });

  return {
    buttons: resetList(variants.buttons),
    text: resetList(variants.text),
    cards: resetList(variants.cards),
  };
}

export type WizardAction =
  | { type: 'GO_TO_STEP'; step: WizardStep }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_SOURCE_URL'; url: string }
  | { type: 'START_EXTRACTION' }
  | { type: 'EXTRACTION_PROGRESS'; progress: number }
  | {
      type: 'EXTRACTION_COMPLETE';
      checkpointId: string;
      tokens: ExtractedTokens;
      variants: VariantsMap;
    }
  | { type: 'EXTRACTION_ERROR'; error: string }
  | { type: 'UPDATE_TOKEN'; category: TokenCategory; key: string; value: TokenValue }
  | { type: 'ADD_TOKEN'; category: TokenCategory; key: string; value: TokenValue }
  | { type: 'DELETE_TOKEN'; category: TokenCategory; key: string }
  | { type: 'UPDATE_SIMPLE_TOKEN'; category: TokenCategory; key: string; value: string }
  | { type: 'ADD_SIMPLE_TOKEN'; category: TokenCategory; key: string; value: string }
  | { type: 'DELETE_SIMPLE_TOKEN'; category: TokenCategory; key: string }
  | { type: 'LOCK_TOKENS' }
  | { type: 'UNLOCK_TOKENS' }
  | { type: 'LOCK_VARIANTS' }
  | { type: 'UNLOCK_VARIANTS' }
  | { type: 'SELECT_COMPONENT'; component: ComponentType }
  | { type: 'SELECT_VARIANT'; index: number }
  | { type: 'UPDATE_VARIANT_SPEC'; property: string; value: string | SpacingTuple }
  | { type: 'APPROVE_VARIANT' }
  | { type: 'REJECT_VARIANT' }
  | { type: 'SET_PENDING_VARIANT' }
  | { type: 'RENAME_VARIANT'; name: string }
  | { type: 'START_NEW_VARIANT'; componentType: ComponentType }
  | { type: 'CANCEL_NEW_VARIANT' }
  | { type: 'SAVE_NEW_VARIANT'; variant: ExtractedVariant }
  | { type: 'PREV_VARIANT' }
  | { type: 'NEXT_VARIANT' }
  | { type: 'RESET_WIZARD' };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'GO_TO_STEP': {
      if (action.step === state.currentStep) return state;
      if (action.step > state.currentStep && !canProceedToNextStep(state)) {
        return state;
      }
      if (action.step < state.currentStep || state.completedSteps.has(action.step)) {
        return { ...state, currentStep: action.step };
      }
      return state;
    }

    case 'NEXT_STEP': {
      if (!canProceedToNextStep(state)) return state;
      if (state.currentStep >= 5) return state;

      const newCompleted = new Set(state.completedSteps);
      newCompleted.add(state.currentStep);

      return {
        ...state,
        currentStep: (state.currentStep + 1) as WizardStep,
        completedSteps: newCompleted,
      };
    }

    case 'PREV_STEP': {
      if (state.currentStep <= 1) return state;
      return {
        ...state,
        currentStep: (state.currentStep - 1) as WizardStep,
      };
    }

    case 'SET_SOURCE_URL': {
      return { ...state, sourceUrl: action.url };
    }

    case 'START_EXTRACTION': {
      return {
        ...state,
        extractionStatus: 'extracting',
        extractionError: null,
        extractionProgress: 0,
      };
    }

    case 'EXTRACTION_PROGRESS': {
      return { ...state, extractionProgress: action.progress };
    }

    case 'EXTRACTION_COMPLETE': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.add(1);

      return {
        ...state,
        extractionStatus: 'complete',
        checkpointId: action.checkpointId,
        tokens: action.tokens,
        variants: action.variants,
        completedSteps: newCompleted,
      };
    }

    case 'EXTRACTION_ERROR': {
      return {
        ...state,
        extractionStatus: 'error',
        extractionError: action.error,
      };
    }

    case 'UPDATE_TOKEN': {
      if (action.category !== 'colors') return state;
      return {
        ...state,
        variantsLocked: false, // Unlock variants when tokens change
        variants: resetApprovedVariantsUsingToken(state.variants, action.category, action.key),
        tokens: {
          ...state.tokens,
          colors: {
            ...state.tokens.colors,
            [action.key]: action.value,
          },
        },
      };
    }

    case 'ADD_TOKEN': {
      if (action.category !== 'colors') return state;
      return {
        ...state,
        variantsLocked: false, // Unlock variants when tokens change
        tokens: {
          ...state.tokens,
          colors: {
            ...state.tokens.colors,
            [action.key]: action.value,
          },
        },
      };
    }

    case 'DELETE_TOKEN': {
      if (action.category !== 'colors') return state;
      const newColors = { ...state.tokens.colors };
      delete newColors[action.key];
      return {
        ...state,
        variantsLocked: false, // Unlock variants when tokens change
        variants: resetApprovedVariantsUsingToken(state.variants, action.category, action.key),
        tokens: {
          ...state.tokens,
          colors: newColors,
        },
      };
    }

    case 'UPDATE_SIMPLE_TOKEN': {
      if (action.category === 'colors') return state;
      const categoryKey = action.category as keyof Omit<ExtractedTokens, 'colors'>;
      return {
        ...state,
        variantsLocked: false, // Unlock variants when tokens change
        variants: resetApprovedVariantsUsingToken(state.variants, action.category, action.key),
        tokens: {
          ...state.tokens,
          [categoryKey]: {
            ...state.tokens[categoryKey],
            [action.key]: action.value,
          },
        },
      };
    }

    case 'ADD_SIMPLE_TOKEN': {
      if (action.category === 'colors') return state;
      const categoryKey = action.category as keyof Omit<ExtractedTokens, 'colors'>;
      return {
        ...state,
        variantsLocked: false, // Unlock variants when tokens change
        tokens: {
          ...state.tokens,
          [categoryKey]: {
            ...state.tokens[categoryKey],
            [action.key]: action.value,
          },
        },
      };
    }

    case 'DELETE_SIMPLE_TOKEN': {
      if (action.category === 'colors') return state;
      const categoryKey = action.category as keyof Omit<ExtractedTokens, 'colors'>;
      const newTokens = { ...state.tokens[categoryKey] };
      delete newTokens[action.key];
      return {
        ...state,
        variantsLocked: false, // Unlock variants when tokens change
        variants: resetApprovedVariantsUsingToken(state.variants, action.category, action.key),
        tokens: {
          ...state.tokens,
          [categoryKey]: newTokens,
        },
      };
    }

    case 'LOCK_TOKENS': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.add(2);
      return {
        ...state,
        tokensLocked: true,
        completedSteps: newCompleted,
      };
    }

    case 'UNLOCK_TOKENS': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.delete(2);
      return {
        ...state,
        tokensLocked: false,
        completedSteps: newCompleted,
      };
    }

    case 'LOCK_VARIANTS': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.add(3);
      return {
        ...state,
        variantsLocked: true,
        completedSteps: newCompleted,
      };
    }

    case 'UNLOCK_VARIANTS': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.delete(3);
      return {
        ...state,
        variantsLocked: false,
        completedSteps: newCompleted,
      };
    }

    case 'SELECT_COMPONENT': {
      return {
        ...state,
        currentComponent: action.component,
        currentVariantIndex: 0,
        isCreatingNewVariant: false,
        newVariantDraft: null,
      };
    }

    case 'SELECT_VARIANT': {
      return {
        ...state,
        currentVariantIndex: action.index,
        isCreatingNewVariant: false,
        newVariantDraft: null,
      };
    }

    case 'UPDATE_VARIANT_SPEC': {
      const variants = state.variants[state.currentComponent];
      if (state.currentVariantIndex >= variants.length) return state;

      const updatedVariants = variants.map((v, i) => {
        if (i !== state.currentVariantIndex) return v;
        return {
          ...v,
          spec: {
            ...v.spec,
            [action.property]: action.value,
          },
        };
      });

      return {
        ...state,
        variants: {
          ...state.variants,
          [state.currentComponent]: updatedVariants,
        },
      };
    }

    case 'APPROVE_VARIANT': {
      const variants = state.variants[state.currentComponent];
      if (state.currentVariantIndex >= variants.length) return state;

      const updatedVariants = variants.map((v, i) => {
        if (i !== state.currentVariantIndex) return v;
        return { ...v, status: 'approved' as const };
      });

      return {
        ...state,
        variants: {
          ...state.variants,
          [state.currentComponent]: updatedVariants,
        },
      };
    }

    case 'REJECT_VARIANT': {
      const variants = state.variants[state.currentComponent];
      if (state.currentVariantIndex >= variants.length) return state;

      const updatedVariants = variants.map((v, i) => {
        if (i !== state.currentVariantIndex) return v;
        return { ...v, status: 'rejected' as const };
      });

      return {
        ...state,
        variants: {
          ...state.variants,
          [state.currentComponent]: updatedVariants,
        },
      };
    }

    case 'SET_PENDING_VARIANT': {
      const variants = state.variants[state.currentComponent];
      if (state.currentVariantIndex >= variants.length) return state;

      const updatedVariants = variants.map((v, i) => {
        if (i !== state.currentVariantIndex) return v;
        return { ...v, status: 'pending' as const };
      });

      return {
        ...state,
        variants: {
          ...state.variants,
          [state.currentComponent]: updatedVariants,
        },
      };
    }

    case 'RENAME_VARIANT': {
      const variants = state.variants[state.currentComponent];
      if (state.currentVariantIndex >= variants.length) return state;

      const updatedVariants = variants.map((v, i) => {
        if (i !== state.currentVariantIndex) return v;
        return { ...v, name: action.name };
      });

      return {
        ...state,
        variants: {
          ...state.variants,
          [state.currentComponent]: updatedVariants,
        },
      };
    }

    case 'START_NEW_VARIANT': {
      return {
        ...state,
        currentComponent: action.componentType,
        isCreatingNewVariant: true,
        newVariantDraft: {
          id: `new-${Date.now()}`,
          name: '',
          status: 'editing',
          isManual: true,
        },
      };
    }

    case 'CANCEL_NEW_VARIANT': {
      return {
        ...state,
        isCreatingNewVariant: false,
        newVariantDraft: null,
      };
    }

    case 'SAVE_NEW_VARIANT': {
      const newVariant: ExtractedVariant = {
        ...action.variant,
        status: 'approved',
        isManual: true,
      };

      return {
        ...state,
        variants: {
          ...state.variants,
          [state.currentComponent]: [...state.variants[state.currentComponent], newVariant],
        },
        isCreatingNewVariant: false,
        newVariantDraft: null,
        currentVariantIndex: state.variants[state.currentComponent].length,
      };
    }

    case 'PREV_VARIANT': {
      if (state.currentVariantIndex <= 0) return state;
      return {
        ...state,
        currentVariantIndex: state.currentVariantIndex - 1,
      };
    }

    case 'NEXT_VARIANT': {
      const variants = state.variants[state.currentComponent];
      if (state.currentVariantIndex >= variants.length - 1) return state;
      return {
        ...state,
        currentVariantIndex: state.currentVariantIndex + 1,
      };
    }

    case 'RESET_WIZARD': {
      return getInitialWizardState();
    }

    default:
      return state;
  }
}
