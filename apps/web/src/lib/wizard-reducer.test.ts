import { describe, it, expect } from 'vitest';
import { wizardReducer, type WizardAction } from './wizard-reducer';
import {
  getInitialWizardState,
  getDefaultTokens,
  getDefaultVariants,
  type WizardState,
  type ExtractedVariant,
  type ExtractedTokens,
} from './wizard-types';

describe('wizardReducer', () => {
  const createState = (overrides: Partial<WizardState> = {}): WizardState => ({
    ...getInitialWizardState(),
    ...overrides,
  });

  describe('GO_TO_STEP', () => {
    it('does nothing when navigating to current step', () => {
      const state = createState({ currentStep: 2 });
      const result = wizardReducer(state, { type: 'GO_TO_STEP', step: 2 });
      expect(result).toBe(state);
    });

    it('allows going back to previous steps', () => {
      const state = createState({ currentStep: 3, completedSteps: new Set([1, 2]) });
      const result = wizardReducer(state, { type: 'GO_TO_STEP', step: 1 });
      expect(result.currentStep).toBe(1);
    });

    it('allows going to completed steps', () => {
      const state = createState({ currentStep: 3, completedSteps: new Set([1, 2]) });
      const result = wizardReducer(state, { type: 'GO_TO_STEP', step: 2 });
      expect(result.currentStep).toBe(2);
    });

    it('prevents going forward when cannot proceed', () => {
      const state = createState({ currentStep: 1, extractionStatus: 'idle' });
      const result = wizardReducer(state, { type: 'GO_TO_STEP', step: 2 });
      expect(result.currentStep).toBe(1);
    });

    it('does not allow jumping forward to uncompleted steps even when can proceed', () => {
      // GO_TO_STEP only allows forward navigation to completed steps
      // Use NEXT_STEP for advancing to new steps
      const state = createState({ currentStep: 1, extractionStatus: 'complete' });
      const result = wizardReducer(state, { type: 'GO_TO_STEP', step: 2 });
      expect(result.currentStep).toBe(1); // stays at 1 because step 2 is not completed
    });

    it('allows going forward to completed steps', () => {
      const state = createState({
        currentStep: 1,
        extractionStatus: 'complete',
        completedSteps: new Set([1, 2]),
      });
      const result = wizardReducer(state, { type: 'GO_TO_STEP', step: 2 });
      expect(result.currentStep).toBe(2);
    });
  });

  describe('NEXT_STEP', () => {
    it('does not advance when cannot proceed', () => {
      const state = createState({ currentStep: 1, extractionStatus: 'idle' });
      const result = wizardReducer(state, { type: 'NEXT_STEP' });
      expect(result.currentStep).toBe(1);
    });

    it('advances when can proceed', () => {
      const state = createState({ currentStep: 1, extractionStatus: 'complete' });
      const result = wizardReducer(state, { type: 'NEXT_STEP' });
      expect(result.currentStep).toBe(2);
    });

    it('marks current step as completed', () => {
      const state = createState({ currentStep: 1, extractionStatus: 'complete' });
      const result = wizardReducer(state, { type: 'NEXT_STEP' });
      expect(result.completedSteps.has(1)).toBe(true);
    });

    it('does not advance past step 5', () => {
      const state = createState({ currentStep: 5 });
      const result = wizardReducer(state, { type: 'NEXT_STEP' });
      expect(result.currentStep).toBe(5);
    });
  });

  describe('PREV_STEP', () => {
    it('goes back one step', () => {
      const state = createState({ currentStep: 3 });
      const result = wizardReducer(state, { type: 'PREV_STEP' });
      expect(result.currentStep).toBe(2);
    });

    it('does not go below step 1', () => {
      const state = createState({ currentStep: 1 });
      const result = wizardReducer(state, { type: 'PREV_STEP' });
      expect(result.currentStep).toBe(1);
    });
  });

  describe('SET_SOURCE_URL', () => {
    it('sets the source URL', () => {
      const state = createState();
      const result = wizardReducer(state, { type: 'SET_SOURCE_URL', url: 'https://example.com' });
      expect(result.sourceUrl).toBe('https://example.com');
    });
  });

  describe('START_EXTRACTION', () => {
    it('sets extraction status to extracting', () => {
      const state = createState();
      const result = wizardReducer(state, { type: 'START_EXTRACTION' });
      expect(result.extractionStatus).toBe('extracting');
    });

    it('clears previous errors', () => {
      const state = createState({ extractionError: 'Previous error' });
      const result = wizardReducer(state, { type: 'START_EXTRACTION' });
      expect(result.extractionError).toBeNull();
    });

    it('resets progress to 0', () => {
      const state = createState({ extractionProgress: 50 });
      const result = wizardReducer(state, { type: 'START_EXTRACTION' });
      expect(result.extractionProgress).toBe(0);
    });
  });

  describe('EXTRACTION_PROGRESS', () => {
    it('updates extraction progress', () => {
      const state = createState({ extractionStatus: 'extracting' });
      const result = wizardReducer(state, { type: 'EXTRACTION_PROGRESS', progress: 50 });
      expect(result.extractionProgress).toBe(50);
    });
  });

  describe('EXTRACTION_COMPLETE', () => {
    it('sets extraction status to complete', () => {
      const state = createState({ extractionStatus: 'extracting' });
      const result = wizardReducer(state, {
        type: 'EXTRACTION_COMPLETE',
        checkpointId: 'checkpoint-123',
        tokens: getDefaultTokens(),
        variants: getDefaultVariants(),
      });
      expect(result.extractionStatus).toBe('complete');
    });

    it('stores checkpoint ID', () => {
      const state = createState();
      const result = wizardReducer(state, {
        type: 'EXTRACTION_COMPLETE',
        checkpointId: 'checkpoint-123',
        tokens: getDefaultTokens(),
        variants: getDefaultVariants(),
      });
      expect(result.checkpointId).toBe('checkpoint-123');
    });

    it('stores extracted tokens', () => {
      const state = createState();
      const tokens: ExtractedTokens = {
        ...getDefaultTokens(),
        colors: { primary: { value: '#3b82f6', source: 'manual', usageCount: 1 } },
      };
      const result = wizardReducer(state, {
        type: 'EXTRACTION_COMPLETE',
        checkpointId: 'checkpoint-123',
        tokens,
        variants: getDefaultVariants(),
      });
      expect(result.tokens.colors).toHaveProperty('primary');
    });

    it('marks step 1 as completed', () => {
      const state = createState();
      const result = wizardReducer(state, {
        type: 'EXTRACTION_COMPLETE',
        checkpointId: 'checkpoint-123',
        tokens: getDefaultTokens(),
        variants: getDefaultVariants(),
      });
      expect(result.completedSteps.has(1)).toBe(true);
    });
  });

  describe('EXTRACTION_ERROR', () => {
    it('sets extraction status to error', () => {
      const state = createState({ extractionStatus: 'extracting' });
      const result = wizardReducer(state, { type: 'EXTRACTION_ERROR', error: 'Failed to extract' });
      expect(result.extractionStatus).toBe('error');
    });

    it('stores error message', () => {
      const state = createState();
      const result = wizardReducer(state, { type: 'EXTRACTION_ERROR', error: 'Network error' });
      expect(result.extractionError).toBe('Network error');
    });
  });

  describe('Token actions', () => {
    describe('UPDATE_TOKEN', () => {
      it('updates a color token', () => {
        const state = createState({
          tokens: {
            ...getDefaultTokens(),
            colors: { primary: { value: '#3b82f6', source: 'manual', usageCount: 1 } },
          },
        });
        const result = wizardReducer(state, {
          type: 'UPDATE_TOKEN',
          category: 'colors',
          key: 'primary',
          value: { value: '#ef4444', source: 'manual', usageCount: 1 },
        });
        expect(result.tokens.colors['primary']?.value).toBe('#ef4444');
      });

      it('unlocks variants when tokens change', () => {
        const state = createState({ variantsLocked: true });
        const result = wizardReducer(state, {
          type: 'UPDATE_TOKEN',
          category: 'colors',
          key: 'primary',
          value: { value: '#3b82f6', source: 'manual', usageCount: 1 },
        });
        expect(result.variantsLocked).toBe(false);
      });

      it('ignores non-color categories', () => {
        const state = createState();
        const result = wizardReducer(state, {
          type: 'UPDATE_TOKEN',
          category: 'fontSizes',
          key: 'base',
          value: { value: '16px', source: 'manual', usageCount: 1 },
        });
        expect(result).toBe(state);
      });
    });

    describe('ADD_TOKEN', () => {
      it('adds a new color token', () => {
        const state = createState();
        const result = wizardReducer(state, {
          type: 'ADD_TOKEN',
          category: 'colors',
          key: 'accent',
          value: { value: '#8b5cf6', source: 'manual', usageCount: 1 },
        });
        expect(result.tokens.colors['accent']).toBeDefined();
        expect(result.tokens.colors['accent']?.value).toBe('#8b5cf6');
      });
    });

    describe('DELETE_TOKEN', () => {
      it('removes a color token', () => {
        const state = createState({
          tokens: {
            ...getDefaultTokens(),
            colors: {
              primary: { value: '#3b82f6', source: 'manual', usageCount: 1 },
              secondary: { value: '#6b7280', source: 'manual', usageCount: 1 },
            },
          },
        });
        const result = wizardReducer(state, {
          type: 'DELETE_TOKEN',
          category: 'colors',
          key: 'primary',
        });
        expect(result.tokens.colors['primary']).toBeUndefined();
        expect(result.tokens.colors['secondary']).toBeDefined();
      });
    });

    describe('Simple token actions', () => {
      it('UPDATE_SIMPLE_TOKEN updates a non-color token', () => {
        const state = createState({
          tokens: {
            ...getDefaultTokens(),
            fontSizes: { base: '16px' },
          },
        });
        const result = wizardReducer(state, {
          type: 'UPDATE_SIMPLE_TOKEN',
          category: 'fontSizes',
          key: 'base',
          value: '18px',
        });
        expect(result.tokens.fontSizes['base']).toBe('18px');
      });

      it('ADD_SIMPLE_TOKEN adds a non-color token', () => {
        const state = createState();
        const result = wizardReducer(state, {
          type: 'ADD_SIMPLE_TOKEN',
          category: 'spacing',
          key: 'lg',
          value: '24px',
        });
        expect(result.tokens.spacing['lg']).toBe('24px');
      });

      it('DELETE_SIMPLE_TOKEN removes a non-color token', () => {
        const state = createState({
          tokens: {
            ...getDefaultTokens(),
            spacing: { sm: '8px', md: '16px' },
          },
        });
        const result = wizardReducer(state, {
          type: 'DELETE_SIMPLE_TOKEN',
          category: 'spacing',
          key: 'sm',
        });
        expect(result.tokens.spacing['sm']).toBeUndefined();
        expect(result.tokens.spacing['md']).toBeDefined();
      });
    });
  });

  describe('Lock actions', () => {
    describe('LOCK_TOKENS', () => {
      it('locks tokens', () => {
        const state = createState({ tokensLocked: false });
        const result = wizardReducer(state, { type: 'LOCK_TOKENS' });
        expect(result.tokensLocked).toBe(true);
      });

      it('marks step 2 as completed', () => {
        const state = createState();
        const result = wizardReducer(state, { type: 'LOCK_TOKENS' });
        expect(result.completedSteps.has(2)).toBe(true);
      });
    });

    describe('UNLOCK_TOKENS', () => {
      it('unlocks tokens', () => {
        const state = createState({ tokensLocked: true });
        const result = wizardReducer(state, { type: 'UNLOCK_TOKENS' });
        expect(result.tokensLocked).toBe(false);
      });

      it('removes step 2 from completed', () => {
        const state = createState({ completedSteps: new Set([1, 2]) });
        const result = wizardReducer(state, { type: 'UNLOCK_TOKENS' });
        expect(result.completedSteps.has(2)).toBe(false);
      });
    });

    describe('LOCK_VARIANTS', () => {
      it('locks variants', () => {
        const state = createState({ variantsLocked: false });
        const result = wizardReducer(state, { type: 'LOCK_VARIANTS' });
        expect(result.variantsLocked).toBe(true);
      });

      it('marks step 3 as completed', () => {
        const state = createState();
        const result = wizardReducer(state, { type: 'LOCK_VARIANTS' });
        expect(result.completedSteps.has(3)).toBe(true);
      });
    });

    describe('UNLOCK_VARIANTS', () => {
      it('unlocks variants', () => {
        const state = createState({ variantsLocked: true });
        const result = wizardReducer(state, { type: 'UNLOCK_VARIANTS' });
        expect(result.variantsLocked).toBe(false);
      });
    });
  });

  describe('Component selection', () => {
    describe('SELECT_COMPONENT', () => {
      it('changes current component', () => {
        const state = createState({ currentComponent: 'buttons' });
        const result = wizardReducer(state, { type: 'SELECT_COMPONENT', component: 'text' });
        expect(result.currentComponent).toBe('text');
      });

      it('resets variant index to 0', () => {
        const state = createState({ currentVariantIndex: 5 });
        const result = wizardReducer(state, { type: 'SELECT_COMPONENT', component: 'cards' });
        expect(result.currentVariantIndex).toBe(0);
      });

      it('cancels new variant creation', () => {
        const state = createState({ isCreatingNewVariant: true, newVariantDraft: { id: 'draft' } });
        const result = wizardReducer(state, { type: 'SELECT_COMPONENT', component: 'text' });
        expect(result.isCreatingNewVariant).toBe(false);
        expect(result.newVariantDraft).toBeNull();
      });
    });

    describe('SELECT_VARIANT', () => {
      it('changes current variant index', () => {
        const state = createState({ currentVariantIndex: 0 });
        const result = wizardReducer(state, { type: 'SELECT_VARIANT', index: 3 });
        expect(result.currentVariantIndex).toBe(3);
      });

      it('cancels new variant creation', () => {
        const state = createState({ isCreatingNewVariant: true });
        const result = wizardReducer(state, { type: 'SELECT_VARIANT', index: 1 });
        expect(result.isCreatingNewVariant).toBe(false);
      });
    });
  });

  describe('Variant actions', () => {
    const createVariantsState = (): WizardState =>
      createState({
        currentComponent: 'buttons',
        currentVariantIndex: 0,
        variants: {
          buttons: [createVariant('pending', 'Button 1'), createVariant('pending', 'Button 2')],
          text: [],
          cards: [],
        },
      });

    describe('UPDATE_VARIANT_SPEC', () => {
      it('updates a variant property', () => {
        const state = createVariantsState();
        const result = wizardReducer(state, {
          type: 'UPDATE_VARIANT_SPEC',
          property: 'background',
          value: 'primary',
        });
        expect((result.variants.buttons[0]?.spec as { background: string }).background).toBe(
          'primary'
        );
      });

      it('does nothing when index is out of bounds', () => {
        const state = createState({
          currentComponent: 'buttons',
          currentVariantIndex: 10,
          variants: { buttons: [], text: [], cards: [] },
        });
        const result = wizardReducer(state, {
          type: 'UPDATE_VARIANT_SPEC',
          property: 'background',
          value: 'primary',
        });
        expect(result).toBe(state);
      });
    });

    describe('APPROVE_VARIANT', () => {
      it('sets variant status to approved', () => {
        const state = createVariantsState();
        const result = wizardReducer(state, { type: 'APPROVE_VARIANT' });
        expect(result.variants.buttons[0]?.status).toBe('approved');
      });

      it('does not affect other variants', () => {
        const state = createVariantsState();
        const result = wizardReducer(state, { type: 'APPROVE_VARIANT' });
        expect(result.variants.buttons[1]?.status).toBe('pending');
      });
    });

    describe('REJECT_VARIANT', () => {
      it('sets variant status to rejected', () => {
        const state = createVariantsState();
        const result = wizardReducer(state, { type: 'REJECT_VARIANT' });
        expect(result.variants.buttons[0]?.status).toBe('rejected');
      });
    });

    describe('SET_PENDING_VARIANT', () => {
      it('sets variant status to pending', () => {
        const state = createState({
          ...createVariantsState(),
          variants: {
            buttons: [createVariant('approved', 'Button')],
            text: [],
            cards: [],
          },
        });
        const result = wizardReducer(state, { type: 'SET_PENDING_VARIANT' });
        expect(result.variants.buttons[0]?.status).toBe('pending');
      });
    });

    describe('RENAME_VARIANT', () => {
      it('renames the current variant', () => {
        const state = createVariantsState();
        const result = wizardReducer(state, { type: 'RENAME_VARIANT', name: 'Primary Button' });
        expect(result.variants.buttons[0]?.name).toBe('Primary Button');
      });
    });

    describe('PREV_VARIANT / NEXT_VARIANT', () => {
      it('PREV_VARIANT decrements index', () => {
        const state = createState({ ...createVariantsState(), currentVariantIndex: 1 });
        const result = wizardReducer(state, { type: 'PREV_VARIANT' });
        expect(result.currentVariantIndex).toBe(0);
      });

      it('PREV_VARIANT does not go below 0', () => {
        const state = createVariantsState();
        const result = wizardReducer(state, { type: 'PREV_VARIANT' });
        expect(result.currentVariantIndex).toBe(0);
      });

      it('NEXT_VARIANT increments index', () => {
        const state = createVariantsState();
        const result = wizardReducer(state, { type: 'NEXT_VARIANT' });
        expect(result.currentVariantIndex).toBe(1);
      });

      it('NEXT_VARIANT does not exceed bounds', () => {
        const state = createState({ ...createVariantsState(), currentVariantIndex: 1 });
        const result = wizardReducer(state, { type: 'NEXT_VARIANT' });
        expect(result.currentVariantIndex).toBe(1);
      });
    });
  });

  describe('New variant creation', () => {
    describe('START_NEW_VARIANT', () => {
      it('enters new variant creation mode', () => {
        const state = createState();
        const result = wizardReducer(state, {
          type: 'START_NEW_VARIANT',
          componentType: 'buttons',
        });
        expect(result.isCreatingNewVariant).toBe(true);
      });

      it('creates a draft with editing status', () => {
        const state = createState();
        const result = wizardReducer(state, {
          type: 'START_NEW_VARIANT',
          componentType: 'buttons',
        });
        expect(result.newVariantDraft).not.toBeNull();
        expect(result.newVariantDraft?.status).toBe('editing');
        expect(result.newVariantDraft?.isManual).toBe(true);
      });

      it('sets the component type', () => {
        const state = createState({ currentComponent: 'text' });
        const result = wizardReducer(state, { type: 'START_NEW_VARIANT', componentType: 'cards' });
        expect(result.currentComponent).toBe('cards');
      });
    });

    describe('CANCEL_NEW_VARIANT', () => {
      it('exits new variant creation mode', () => {
        const state = createState({ isCreatingNewVariant: true, newVariantDraft: { id: 'draft' } });
        const result = wizardReducer(state, { type: 'CANCEL_NEW_VARIANT' });
        expect(result.isCreatingNewVariant).toBe(false);
        expect(result.newVariantDraft).toBeNull();
      });
    });

    describe('SAVE_NEW_VARIANT', () => {
      it('adds variant to the current component list', () => {
        const state = createState({
          currentComponent: 'buttons',
          isCreatingNewVariant: true,
          variants: { buttons: [], text: [], cards: [] },
        });
        const newVariant = createVariant('pending', 'New Button');
        const result = wizardReducer(state, { type: 'SAVE_NEW_VARIANT', variant: newVariant });
        expect(result.variants.buttons).toHaveLength(1);
      });

      it('sets new variant as approved', () => {
        const state = createState({
          currentComponent: 'buttons',
          isCreatingNewVariant: true,
          variants: { buttons: [], text: [], cards: [] },
        });
        const newVariant = createVariant('pending', 'New Button');
        const result = wizardReducer(state, { type: 'SAVE_NEW_VARIANT', variant: newVariant });
        expect(result.variants.buttons[0]?.status).toBe('approved');
      });

      it('exits creation mode', () => {
        const state = createState({
          currentComponent: 'buttons',
          isCreatingNewVariant: true,
          variants: { buttons: [], text: [], cards: [] },
        });
        const newVariant = createVariant('pending', 'New Button');
        const result = wizardReducer(state, { type: 'SAVE_NEW_VARIANT', variant: newVariant });
        expect(result.isCreatingNewVariant).toBe(false);
        expect(result.newVariantDraft).toBeNull();
      });

      it('selects the newly created variant', () => {
        const state = createState({
          currentComponent: 'buttons',
          currentVariantIndex: 0,
          isCreatingNewVariant: true,
          variants: {
            buttons: [createVariant('approved', 'Existing')],
            text: [],
            cards: [],
          },
        });
        const newVariant = createVariant('pending', 'New Button');
        const result = wizardReducer(state, { type: 'SAVE_NEW_VARIANT', variant: newVariant });
        expect(result.currentVariantIndex).toBe(1);
      });
    });
  });

  describe('RESET_WIZARD', () => {
    it('returns initial state', () => {
      const state = createState({
        currentStep: 4,
        extractionStatus: 'complete',
        tokensLocked: true,
        completedSteps: new Set([1, 2, 3]),
      });
      const result = wizardReducer(state, { type: 'RESET_WIZARD' });

      expect(result.currentStep).toBe(1);
      expect(result.extractionStatus).toBe('idle');
      expect(result.tokensLocked).toBe(false);
      expect(result.completedSteps.size).toBe(0);
    });
  });

  describe('Default case', () => {
    it('returns state unchanged for unknown action', () => {
      const state = createState();
      const result = wizardReducer(state, { type: 'UNKNOWN_ACTION' } as unknown as WizardAction);
      expect(result).toBe(state);
    });
  });
});

// Helper function
function createVariant(
  status: 'pending' | 'approved' | 'rejected' | 'editing',
  name: string
): ExtractedVariant {
  return {
    id: `variant-${Math.random()}`,
    name,
    status,
    isManual: false,
    spec: {
      background: '_default',
      color: '_default',
      borderColor: '_default',
      borderWidth: '_default',
      borderRadius: '_default',
      padding: ['_default'],
      fontSize: '_default',
      fontWeight: '_default',
      fontFamily: '_default',
      shadow: '_default',
    },
  };
}
