import { describe, it, expect } from 'vitest';
import { getVariantReviewSummary, getFailedVariants, groupVariantsByType } from './variant-review';
import type { VariantReview } from './variant-review';
import type { ButtonVariantSpec } from '../components';

function createMockReview(overrides: Partial<VariantReview> = {}): VariantReview {
  return {
    variantId: 'variant-1',
    componentType: 'button',
    variantName: 'Primary',
    status: 'pending',
    extractedSpec: {
      surface: 'primary',
      text: 'white',
      paddingX: 16,
      paddingY: 8,
      radius: 'md',
      fontSize: 'base',
      fontWeight: 'medium',
      border: null,
    } as ButtonVariantSpec,
    originalSelector: '.btn-primary',
    originalBoundingBox: { x: 100, y: 200, width: 200, height: 50 },
    ...overrides,
  };
}

describe('getVariantReviewSummary', () => {
  it('returns zero counts for empty array', () => {
    const result = getVariantReviewSummary([]);

    expect(result).toEqual({
      total: 0,
      pending: 0,
      accepted: 0,
      failed: 0,
      dne: 0,
    });
  });

  it('counts single pending review', () => {
    const reviews = [createMockReview({ status: 'pending' })];

    const result = getVariantReviewSummary(reviews);

    expect(result).toEqual({
      total: 1,
      pending: 1,
      accepted: 0,
      failed: 0,
      dne: 0,
    });
  });

  it('counts all status types correctly', () => {
    const reviews = [
      createMockReview({ variantId: '1', status: 'pending' }),
      createMockReview({ variantId: '2', status: 'pending' }),
      createMockReview({ variantId: '3', status: 'accepted' }),
      createMockReview({ variantId: '4', status: 'failed' }),
      createMockReview({ variantId: '5', status: 'dne' }),
    ];

    const result = getVariantReviewSummary(reviews);

    expect(result).toEqual({
      total: 5,
      pending: 2,
      accepted: 1,
      failed: 1,
      dne: 1,
    });
  });

  it('handles all same status', () => {
    const reviews = [
      createMockReview({ variantId: '1', status: 'accepted' }),
      createMockReview({ variantId: '2', status: 'accepted' }),
      createMockReview({ variantId: '3', status: 'accepted' }),
    ];

    const result = getVariantReviewSummary(reviews);

    expect(result).toEqual({
      total: 3,
      pending: 0,
      accepted: 3,
      failed: 0,
      dne: 0,
    });
  });
});

describe('getFailedVariants', () => {
  it('returns empty array when no reviews', () => {
    const result = getFailedVariants([]);

    expect(result).toEqual([]);
  });

  it('returns empty array when no failed variants', () => {
    const reviews = [
      createMockReview({ variantId: '1', status: 'pending' }),
      createMockReview({ variantId: '2', status: 'accepted' }),
    ];

    const result = getFailedVariants(reviews);

    expect(result).toEqual([]);
  });

  it('returns only failed variants', () => {
    const reviews = [
      createMockReview({ variantId: '1', status: 'pending' }),
      createMockReview({ variantId: '2', status: 'failed' }),
      createMockReview({ variantId: '3', status: 'accepted' }),
      createMockReview({ variantId: '4', status: 'failed' }),
    ];

    const result = getFailedVariants(reviews);

    expect(result).toHaveLength(2);
    expect(result[0]?.variantId).toBe('2');
    expect(result[1]?.variantId).toBe('4');
  });

  it('returns all variants when all are failed', () => {
    const reviews = [
      createMockReview({ variantId: '1', status: 'failed' }),
      createMockReview({ variantId: '2', status: 'failed' }),
    ];

    const result = getFailedVariants(reviews);

    expect(result).toHaveLength(2);
  });

  it('excludes dne variants', () => {
    const reviews = [
      createMockReview({ variantId: '1', status: 'failed' }),
      createMockReview({ variantId: '2', status: 'dne' }),
    ];

    const result = getFailedVariants(reviews);

    expect(result).toHaveLength(1);
    expect(result[0]?.variantId).toBe('1');
  });
});

describe('groupVariantsByType', () => {
  it('returns empty groups when no reviews', () => {
    const result = groupVariantsByType([]);

    expect(result).toEqual({
      button: [],
      card: [],
      input: [],
      text: [],
    });
  });

  it('groups single button variant', () => {
    const reviews = [createMockReview({ componentType: 'button' })];

    const result = groupVariantsByType(reviews);

    expect(result.button).toHaveLength(1);
    expect(result.card).toHaveLength(0);
    expect(result.input).toHaveLength(0);
    expect(result.text).toHaveLength(0);
  });

  it('groups multiple variants by type', () => {
    const reviews = [
      createMockReview({ variantId: '1', componentType: 'button' }),
      createMockReview({ variantId: '2', componentType: 'button' }),
      createMockReview({ variantId: '3', componentType: 'card' }),
      createMockReview({ variantId: '4', componentType: 'input' }),
      createMockReview({ variantId: '5', componentType: 'text' }),
    ];

    const result = groupVariantsByType(reviews);

    expect(result.button).toHaveLength(2);
    expect(result.card).toHaveLength(1);
    expect(result.input).toHaveLength(1);
    expect(result.text).toHaveLength(1);
  });

  it('preserves variant data in groups', () => {
    const reviews = [
      createMockReview({
        variantId: 'btn-primary',
        componentType: 'button',
        variantName: 'Primary Button',
      }),
    ];

    const result = groupVariantsByType(reviews);

    expect(result.button[0]?.variantId).toBe('btn-primary');
    expect(result.button[0]?.variantName).toBe('Primary Button');
  });

  it('maintains order within groups', () => {
    const reviews = [
      createMockReview({ variantId: 'btn-1', componentType: 'button' }),
      createMockReview({ variantId: 'btn-2', componentType: 'button' }),
      createMockReview({ variantId: 'btn-3', componentType: 'button' }),
    ];

    const result = groupVariantsByType(reviews);

    expect(result.button[0]?.variantId).toBe('btn-1');
    expect(result.button[1]?.variantId).toBe('btn-2');
    expect(result.button[2]?.variantId).toBe('btn-3');
  });
});
