/**
 * Type definitions for the multi-step wizard flow
 */

export type WizardStep = 1 | 2 | 3 | 4 | 5;
export type ExtractionStatus = 'idle' | 'extracting' | 'complete' | 'error';
export type VariantStatus = 'pending' | 'approved' | 'rejected' | 'editing';
export type ComponentType = 'buttons' | 'text' | 'cards';
export type TokenCategory =
  | 'colors'
  | 'fontFamilies'
  | 'fontSizes'
  | 'fontWeights'
  | 'lineHeights'
  | 'spacing'
  | 'radii'
  | 'shadows';

export const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Extract',
  2: 'Tokens',
  3: 'Variants',
  4: 'Review',
  5: 'Export',
};

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: Set<number>;

  sourceUrl: string;
  checkpointId: string | null;
  extractionStatus: ExtractionStatus;
  extractionError: string | null;
  extractionProgress: number;

  tokens: ExtractedTokens;
  tokensLocked: boolean;

  variants: VariantsMap;
  variantsLocked: boolean;
  currentComponent: ComponentType;
  currentVariantIndex: number;
  isCreatingNewVariant: boolean;
  newVariantDraft: Partial<ExtractedVariant> | null;
}

export interface VariantsMap {
  buttons: ExtractedVariant[];
  text: ExtractedVariant[];
  cards: ExtractedVariant[];
}

export interface ExtractedTokens {
  colors: Record<string, TokenValue>;
  fontFamilies: Record<string, string>;
  fontSizes: Record<string, string>;
  fontWeights: Record<string, string>;
  lineHeights: Record<string, string>;
  spacing: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
}

export interface TokenValue {
  value: string;
  source: 'css-var' | 'computed' | 'manual';
  cssVarName?: string;
  usageCount: number;
}

export interface ExtractedVariant {
  id: string;
  name: string;
  status: VariantStatus;
  spec: ButtonVariantSpec | TextVariantSpec | CardVariantSpec;
  rawStyles?: Record<string, string>;
  instances?: VariantInstance[];
  isManual: boolean;
}

export interface VariantInstance {
  selector: string;
  rect: BoundingBox;
  croppedScreenshot: string;
  contextScreenshot: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SpacingTuple = [string] | [string, string] | [string, string, string, string];

export interface ButtonVariantSpec {
  background: string;
  color: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: SpacingTuple;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  shadow: string;
}

export interface TextVariantSpec {
  color: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  lineHeight: string;
}

export interface CardVariantSpec {
  background: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: SpacingTuple;
  shadow: string;
}

export type AnyVariantSpec = ButtonVariantSpec | TextVariantSpec | CardVariantSpec;

export const PROPERTY_TOKEN_CATEGORY: Record<string, TokenCategory> = {
  background: 'colors',
  color: 'colors',
  borderColor: 'colors',
  borderWidth: 'spacing',
  borderRadius: 'radii',
  padding: 'spacing',
  fontSize: 'fontSizes',
  fontWeight: 'fontWeights',
  fontFamily: 'fontFamilies',
  lineHeight: 'lineHeights',
  shadow: 'shadows',
} as const;

export const BUTTON_PROPERTIES = [
  'background',
  'color',
  'borderColor',
  'borderWidth',
  'borderRadius',
  'padding',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'shadow',
] as const;

export const TEXT_PROPERTIES = [
  'color',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'lineHeight',
] as const;

export const CARD_PROPERTIES = [
  'background',
  'borderColor',
  'borderWidth',
  'borderRadius',
  'padding',
  'shadow',
] as const;

export function getDefaultTokens(): ExtractedTokens {
  return {
    colors: {},
    fontFamilies: {},
    fontSizes: {},
    fontWeights: {},
    lineHeights: {},
    spacing: {},
    radii: {},
    shadows: {},
  };
}

export function getDefaultVariants(): VariantsMap {
  return {
    buttons: [],
    text: [],
    cards: [],
  };
}

export function getInitialWizardState(): WizardState {
  return {
    currentStep: 1,
    completedSteps: new Set(),

    sourceUrl: '',
    checkpointId: null,
    extractionStatus: 'idle',
    extractionError: null,
    extractionProgress: 0,

    tokens: getDefaultTokens(),
    tokensLocked: false,

    variants: getDefaultVariants(),
    variantsLocked: false,
    currentComponent: 'buttons',
    currentVariantIndex: 0,
    isCreatingNewVariant: false,
    newVariantDraft: null,
  };
}

export function canProceedToNextStep(state: WizardState): boolean {
  switch (state.currentStep) {
    case 1:
      return state.extractionStatus === 'complete';
    case 2:
      return state.tokensLocked;
    case 3:
      return allVariantsReviewed(state.variants);
    case 4:
      return true;
    case 5:
      return false;
    default:
      return false;
  }
}

export function allVariantsReviewed(variants: VariantsMap): boolean {
  const allVariants = [...variants.buttons, ...variants.text, ...variants.cards];
  // Allow proceeding with zero variants - components will use default styles
  if (allVariants.length === 0) return true;
  return allVariants.every(v => v.status === 'approved' || v.status === 'rejected');
}

export function getVariantCounts(variants: VariantsMap): {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
} {
  const allVariants = [...variants.buttons, ...variants.text, ...variants.cards];
  return {
    total: allVariants.length,
    approved: allVariants.filter(v => v.status === 'approved').length,
    rejected: allVariants.filter(v => v.status === 'rejected').length,
    pending: allVariants.filter(v => v.status === 'pending').length,
  };
}

/**
 * Check if a variant has any deleted tokens (tokens referenced that no longer exist,
 * but the category still has other tokens available).
 * Returns false if the category is completely empty - that's not a "deleted token" situation.
 */
export function variantHasDeletedTokens(
  variant: ExtractedVariant,
  tokens: ExtractedTokens
): boolean {
  const spec = variant.spec as unknown as Record<string, unknown>;

  for (const [property, value] of Object.entries(spec)) {
    if (value === '_default' || value === undefined) continue;

    const category = PROPERTY_TOKEN_CATEGORY[property];
    if (!category) continue;

    // Handle padding array
    if (property === 'padding' && Array.isArray(value)) {
      const spacingTokens = Object.keys(tokens.spacing);
      // Only consider it "deleted" if category has tokens but referenced one is missing
      if (spacingTokens.length === 0) continue;
      for (const paddingValue of value) {
        if (paddingValue === '_default') continue;
        if (!spacingTokens.includes(paddingValue as string)) {
          return true;
        }
      }
      continue;
    }

    // Get available tokens for this category
    const categoryTokens = tokens[category as keyof ExtractedTokens];
    if (!categoryTokens) continue;

    const availableKeys =
      category === 'colors'
        ? Object.keys(categoryTokens as Record<string, TokenValue>)
        : Object.keys(categoryTokens as Record<string, string>);

    // Only consider it "deleted" if category has tokens but referenced one is missing
    if (availableKeys.length === 0) continue;

    if (typeof value === 'string' && !availableKeys.includes(value)) {
      return true;
    }
  }

  return false;
}
