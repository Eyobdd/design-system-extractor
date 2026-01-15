import { describe, it, expect } from 'vitest';
import { tokensToVariantReviews, parseExtractedTokens } from './tokens-to-variants';

describe('tokensToVariantReviews', () => {
  describe('empty input', () => {
    it('returns empty array for empty tokens', () => {
      const result = tokensToVariantReviews({});

      expect(result).toEqual([]);
    });

    it('returns empty array when typography is undefined', () => {
      const result = tokensToVariantReviews({ colors: { '#000': ['text'] } });

      expect(result).toEqual([]);
    });
  });

  describe('typography conversion', () => {
    it('converts single typography entry to text variant review', () => {
      const tokens = {
        typography: {
          'h1.heading': {
            fontFamily: 'Inter, sans-serif',
            fontSize: '24px',
            fontWeight: '700',
            lineHeight: '1.5',
          },
        },
      };

      const result = tokensToVariantReviews(tokens);

      expect(result).toHaveLength(1);
      expect(result[0]?.componentType).toBe('text');
      expect(result[0]?.status).toBe('pending');
    });

    it('generates unique variant IDs for multiple entries', () => {
      const tokens = {
        typography: {
          heading: {
            fontFamily: 'Inter',
            fontSize: '24px',
            fontWeight: '700',
            lineHeight: '1.5',
          },
          body: {
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.6',
          },
        },
      };

      const result = tokensToVariantReviews(tokens);

      expect(result).toHaveLength(2);
      expect(result[0]?.variantId).not.toBe(result[1]?.variantId);
    });

    it('uses original selector as key', () => {
      const tokens = {
        typography: {
          '.main-heading': {
            fontFamily: 'Arial',
            fontSize: '32px',
            fontWeight: '600',
            lineHeight: '1.2',
          },
        },
      };

      const result = tokensToVariantReviews(tokens);

      expect(result[0]?.originalSelector).toBe('.main-heading');
    });

    it('creates variant name from font name, size, and weight', () => {
      const tokens = {
        typography: {
          selector: {
            fontFamily: 'Roboto, sans-serif',
            fontSize: '18px',
            fontWeight: '500',
            lineHeight: '1.4',
          },
        },
      };

      const result = tokensToVariantReviews(tokens);

      expect(result[0]?.variantName).toContain('Roboto');
      expect(result[0]?.variantName).toContain('18px');
      expect(result[0]?.variantName).toContain('500');
    });

    it('includes font family in variant name', () => {
      const tokens = {
        typography: {
          selector: {
            fontFamily: 'Helvetica, sans-serif',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
          },
        },
      };

      const result = tokensToVariantReviews(tokens);

      expect(result[0]?.variantName).toContain('Helvetica');
    });

    it('includes extracted spec with typography properties', () => {
      const tokens = {
        typography: {
          selector: {
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            fontWeight: '600',
            lineHeight: '1.8',
          },
        },
      };

      const result = tokensToVariantReviews(tokens);

      expect(result[0]?.extractedSpec).toMatchObject({
        family: 'Georgia, serif',
        size: '20px',
        weight: '600',
        lineHeight: '1.8',
      });
    });
  });
});

describe('parseExtractedTokens', () => {
  describe('empty input', () => {
    it('returns empty arrays for empty tokens', () => {
      const result = parseExtractedTokens({});

      expect(result.colors).toEqual([]);
      expect(result.typography).toEqual([]);
    });
  });

  describe('colors parsing', () => {
    it('parses single color', () => {
      const tokens = {
        colors: {
          '#3b82f6': ['button', 'link'],
        },
      };

      const result = parseExtractedTokens(tokens);

      expect(result.colors).toHaveLength(1);
      expect(result.colors[0]?.hex).toBe('#3b82f6');
      expect(result.colors[0]?.usedIn).toEqual(['button', 'link']);
    });

    it('parses multiple colors', () => {
      const tokens = {
        colors: {
          '#3b82f6': ['button'],
          '#ef4444': ['error'],
          '#22c55e': ['success'],
        },
      };

      const result = parseExtractedTokens(tokens);

      expect(result.colors).toHaveLength(3);
    });

    it('preserves usage information', () => {
      const tokens = {
        colors: {
          '#000000': ['text', 'heading', 'border'],
        },
      };

      const result = parseExtractedTokens(tokens);

      expect(result.colors[0]?.usedIn).toEqual(['text', 'heading', 'border']);
    });
  });

  describe('typography parsing', () => {
    it('parses single typography entry', () => {
      const tokens = {
        typography: {
          heading: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '24px',
            fontWeight: '700',
            lineHeight: '1.5',
          },
        },
      };

      const result = parseExtractedTokens(tokens);

      expect(result.typography).toHaveLength(1);
      expect(result.typography[0]?.id).toBe('heading');
      expect(result.typography[0]?.fontFamily).toBe('Inter, sans-serif');
      expect(result.typography[0]?.fontSize).toBe('24px');
      expect(result.typography[0]?.fontWeight).toBe('700');
      expect(result.typography[0]?.lineHeight).toBe('1.5');
    });

    it('extracts first font from font family stack', () => {
      const tokens = {
        typography: {
          body: {
            fontFamily: 'Georgia, Times, serif',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '1.6',
          },
        },
      };

      const result = parseExtractedTokens(tokens);

      expect(result.typography[0]?.cleanFontName).toBe('Georgia');
    });

    it('parses multiple typography entries', () => {
      const tokens = {
        typography: {
          h1: {
            fontFamily: 'Georgia',
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '1.2',
          },
          body: {
            fontFamily: 'Arial',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
          },
        },
      };

      const result = parseExtractedTokens(tokens);

      expect(result.typography).toHaveLength(2);
    });
  });

  describe('combined parsing', () => {
    it('parses both colors and typography', () => {
      const tokens = {
        colors: {
          '#333': ['text'],
        },
        typography: {
          body: {
            fontFamily: 'System',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
          },
        },
      };

      const result = parseExtractedTokens(tokens);

      expect(result.colors).toHaveLength(1);
      expect(result.typography).toHaveLength(1);
    });
  });
});
