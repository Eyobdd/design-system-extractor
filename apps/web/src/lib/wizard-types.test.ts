import { describe, it, expect } from 'vitest';
import {
  STEP_LABELS,
  getDefaultTokens,
  getDefaultVariants,
  getInitialWizardState,
  canProceedToNextStep,
  allVariantsReviewed,
  getVariantCounts,
  variantHasDeletedTokens,
  type WizardState,
  type VariantsMap,
  type ExtractedVariant,
  type ExtractedTokens,
} from './wizard-types';

describe('STEP_LABELS', () => {
  it('has labels for all 5 steps', () => {
    expect(STEP_LABELS[1]).toBe('Extract');
    expect(STEP_LABELS[2]).toBe('Tokens');
    expect(STEP_LABELS[3]).toBe('Variants');
    expect(STEP_LABELS[4]).toBe('Review');
    expect(STEP_LABELS[5]).toBe('Export');
  });
});

describe('getDefaultTokens', () => {
  it('returns empty token collections', () => {
    const tokens = getDefaultTokens();

    expect(tokens.colors).toEqual({});
    expect(tokens.fontFamilies).toEqual({});
    expect(tokens.fontSizes).toEqual({});
    expect(tokens.fontWeights).toEqual({});
    expect(tokens.lineHeights).toEqual({});
    expect(tokens.spacing).toEqual({});
    expect(tokens.radii).toEqual({});
    expect(tokens.shadows).toEqual({});
  });

  it('returns a new object each time', () => {
    const tokens1 = getDefaultTokens();
    const tokens2 = getDefaultTokens();
    expect(tokens1).not.toBe(tokens2);
  });
});

describe('getDefaultVariants', () => {
  it('returns empty variant arrays', () => {
    const variants = getDefaultVariants();

    expect(variants.buttons).toEqual([]);
    expect(variants.text).toEqual([]);
    expect(variants.cards).toEqual([]);
  });

  it('returns a new object each time', () => {
    const variants1 = getDefaultVariants();
    const variants2 = getDefaultVariants();
    expect(variants1).not.toBe(variants2);
  });
});

describe('getInitialWizardState', () => {
  it('returns initial state with step 1', () => {
    const state = getInitialWizardState();
    expect(state.currentStep).toBe(1);
  });

  it('has empty completed steps', () => {
    const state = getInitialWizardState();
    expect(state.completedSteps.size).toBe(0);
  });

  it('has idle extraction status', () => {
    const state = getInitialWizardState();
    expect(state.extractionStatus).toBe('idle');
    expect(state.extractionError).toBeNull();
    expect(state.extractionProgress).toBe(0);
  });

  it('has unlocked tokens and variants', () => {
    const state = getInitialWizardState();
    expect(state.tokensLocked).toBe(false);
    expect(state.variantsLocked).toBe(false);
  });

  it('has buttons as default component', () => {
    const state = getInitialWizardState();
    expect(state.currentComponent).toBe('buttons');
  });

  it('has empty source URL and checkpoint', () => {
    const state = getInitialWizardState();
    expect(state.sourceUrl).toBe('');
    expect(state.checkpointId).toBeNull();
  });
});

describe('canProceedToNextStep', () => {
  const createState = (overrides: Partial<WizardState> = {}): WizardState => ({
    ...getInitialWizardState(),
    ...overrides,
  });

  describe('step 1 (Extract)', () => {
    it('cannot proceed when extraction is idle', () => {
      const state = createState({ currentStep: 1, extractionStatus: 'idle' });
      expect(canProceedToNextStep(state)).toBe(false);
    });

    it('cannot proceed when extraction is in progress', () => {
      const state = createState({ currentStep: 1, extractionStatus: 'extracting' });
      expect(canProceedToNextStep(state)).toBe(false);
    });

    it('cannot proceed when extraction has error', () => {
      const state = createState({ currentStep: 1, extractionStatus: 'error' });
      expect(canProceedToNextStep(state)).toBe(false);
    });

    it('can proceed when extraction is complete', () => {
      const state = createState({ currentStep: 1, extractionStatus: 'complete' });
      expect(canProceedToNextStep(state)).toBe(true);
    });
  });

  describe('step 2 (Tokens)', () => {
    it('cannot proceed when tokens are unlocked', () => {
      const state = createState({ currentStep: 2, tokensLocked: false });
      expect(canProceedToNextStep(state)).toBe(false);
    });

    it('can proceed when tokens are locked', () => {
      const state = createState({ currentStep: 2, tokensLocked: true });
      expect(canProceedToNextStep(state)).toBe(true);
    });
  });

  describe('step 3 (Variants)', () => {
    it('can proceed with no variants', () => {
      const state = createState({ currentStep: 3, variants: getDefaultVariants() });
      expect(canProceedToNextStep(state)).toBe(true);
    });

    it('cannot proceed with pending variants', () => {
      const variants: VariantsMap = {
        buttons: [createVariant('pending')],
        text: [],
        cards: [],
      };
      const state = createState({ currentStep: 3, variants });
      expect(canProceedToNextStep(state)).toBe(false);
    });

    it('can proceed when all variants are reviewed', () => {
      const variants: VariantsMap = {
        buttons: [createVariant('approved')],
        text: [createVariant('rejected')],
        cards: [],
      };
      const state = createState({ currentStep: 3, variants });
      expect(canProceedToNextStep(state)).toBe(true);
    });
  });

  describe('step 4 (Review)', () => {
    it('can always proceed from review', () => {
      const state = createState({ currentStep: 4 });
      expect(canProceedToNextStep(state)).toBe(true);
    });
  });

  describe('step 5 (Export)', () => {
    it('cannot proceed past export (final step)', () => {
      const state = createState({ currentStep: 5 });
      expect(canProceedToNextStep(state)).toBe(false);
    });
  });
});

describe('allVariantsReviewed', () => {
  it('returns true for empty variants', () => {
    const variants = getDefaultVariants();
    expect(allVariantsReviewed(variants)).toBe(true);
  });

  it('returns true when all variants are approved', () => {
    const variants: VariantsMap = {
      buttons: [createVariant('approved'), createVariant('approved')],
      text: [createVariant('approved')],
      cards: [],
    };
    expect(allVariantsReviewed(variants)).toBe(true);
  });

  it('returns true when all variants are rejected', () => {
    const variants: VariantsMap = {
      buttons: [createVariant('rejected')],
      text: [],
      cards: [createVariant('rejected')],
    };
    expect(allVariantsReviewed(variants)).toBe(true);
  });

  it('returns true when variants are mix of approved and rejected', () => {
    const variants: VariantsMap = {
      buttons: [createVariant('approved')],
      text: [createVariant('rejected')],
      cards: [createVariant('approved')],
    };
    expect(allVariantsReviewed(variants)).toBe(true);
  });

  it('returns false when any variant is pending', () => {
    const variants: VariantsMap = {
      buttons: [createVariant('approved'), createVariant('pending')],
      text: [],
      cards: [],
    };
    expect(allVariantsReviewed(variants)).toBe(false);
  });

  it('returns false when any variant is editing', () => {
    const variants: VariantsMap = {
      buttons: [],
      text: [createVariant('editing')],
      cards: [],
    };
    expect(allVariantsReviewed(variants)).toBe(false);
  });
});

describe('getVariantCounts', () => {
  it('returns zeros for empty variants', () => {
    const variants = getDefaultVariants();
    const counts = getVariantCounts(variants);

    expect(counts.total).toBe(0);
    expect(counts.approved).toBe(0);
    expect(counts.rejected).toBe(0);
    expect(counts.pending).toBe(0);
  });

  it('counts variants across all component types', () => {
    const variants: VariantsMap = {
      buttons: [createVariant('approved'), createVariant('pending')],
      text: [createVariant('rejected')],
      cards: [createVariant('approved'), createVariant('approved')],
    };
    const counts = getVariantCounts(variants);

    expect(counts.total).toBe(5);
    expect(counts.approved).toBe(3);
    expect(counts.rejected).toBe(1);
    expect(counts.pending).toBe(1);
  });

  it('handles single component type with variants', () => {
    const variants: VariantsMap = {
      buttons: [createVariant('pending'), createVariant('pending'), createVariant('approved')],
      text: [],
      cards: [],
    };
    const counts = getVariantCounts(variants);

    expect(counts.total).toBe(3);
    expect(counts.approved).toBe(1);
    expect(counts.pending).toBe(2);
    expect(counts.rejected).toBe(0);
  });
});

describe('variantHasDeletedTokens', () => {
  const createTokens = (overrides: Partial<ExtractedTokens> = {}): ExtractedTokens => ({
    colors: { primary: { value: '#3b82f6', source: 'manual', usageCount: 1 } },
    fontFamilies: { sans: 'system-ui' },
    fontSizes: { base: '16px' },
    fontWeights: { normal: '400' },
    lineHeights: { normal: '1.5' },
    spacing: { md: '16px' },
    radii: { md: '8px' },
    shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)' },
    ...overrides,
  });

  it('returns false when all token references exist', () => {
    const variant = createButtonVariant({
      background: 'primary',
      color: 'primary',
      borderRadius: 'md',
    });
    const tokens = createTokens();

    expect(variantHasDeletedTokens(variant, tokens)).toBe(false);
  });

  it('returns false for _default values', () => {
    const variant = createButtonVariant({
      background: '_default',
      color: '_default',
    });
    const tokens = createTokens();

    expect(variantHasDeletedTokens(variant, tokens)).toBe(false);
  });

  it('returns true when a referenced color token is deleted', () => {
    const variant = createButtonVariant({
      background: 'deletedColor',
      color: 'primary',
    });
    const tokens = createTokens();

    expect(variantHasDeletedTokens(variant, tokens)).toBe(true);
  });

  it('returns true when a referenced spacing token is deleted', () => {
    const variant = createButtonVariant({
      borderRadius: 'deletedRadius',
    });
    const tokens = createTokens();

    expect(variantHasDeletedTokens(variant, tokens)).toBe(true);
  });

  it('returns false when category is empty (not a deleted token scenario)', () => {
    const variant = createButtonVariant({
      background: 'nonexistent',
    });
    const tokens = createTokens({ colors: {} });

    expect(variantHasDeletedTokens(variant, tokens)).toBe(false);
  });

  it('handles padding array with deleted tokens', () => {
    const variant = createButtonVariant({
      padding: ['md', 'deletedSpacing', 'md', 'md'],
    });
    const tokens = createTokens();

    expect(variantHasDeletedTokens(variant, tokens)).toBe(true);
  });

  it('handles padding array with all valid tokens', () => {
    const variant = createButtonVariant({
      padding: ['md', 'md'],
    });
    const tokens = createTokens();

    expect(variantHasDeletedTokens(variant, tokens)).toBe(false);
  });

  it('handles padding array with _default values', () => {
    const variant = createButtonVariant({
      padding: ['_default', 'md'],
    });
    const tokens = createTokens();

    expect(variantHasDeletedTokens(variant, tokens)).toBe(false);
  });
});

// Helper functions
function createVariant(status: 'pending' | 'approved' | 'rejected' | 'editing'): ExtractedVariant {
  return {
    id: `variant-${Math.random()}`,
    name: 'Test Variant',
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

function createButtonVariant(specOverrides: Record<string, unknown> = {}): ExtractedVariant {
  return {
    id: `variant-${Math.random()}`,
    name: 'Test Button',
    status: 'pending',
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
      ...specOverrides,
    },
  };
}
