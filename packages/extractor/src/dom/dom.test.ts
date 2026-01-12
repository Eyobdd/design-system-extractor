import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Page, ElementHandle } from 'puppeteer';
import {
  extractElementStyles,
  extractMultipleElementStyles,
  getElementInfo,
  findElementsByType,
  diffStyles,
  normalizeColor,
  extractColorTokens,
  extractTypographyTokens,
} from './extract';
import type { ExtractedStyles } from './types';

describe('DOM Extraction', () => {
  let mockPage: Partial<Page>;
  let mockElement: Partial<ElementHandle>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockElement = {};

    mockPage = {
      $: vi.fn().mockResolvedValue(mockElement),
      $$: vi.fn().mockResolvedValue([]),
      evaluate: vi.fn(),
    };
  });

  describe('extractElementStyles', () => {
    it('returns null when element not found', async () => {
      vi.mocked(mockPage.$!).mockResolvedValue(null);

      const result = await extractElementStyles(mockPage as Page, '.non-existent');

      expect(result).toBeNull();
    });

    it('extracts computed styles for element', async () => {
      const expectedStyles = {
        color: 'rgb(0, 0, 0)',
        'background-color': 'rgb(255, 255, 255)',
        'font-size': '16px',
      };
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(expectedStyles);
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(undefined);

      const result = await extractElementStyles(mockPage as Page, '.my-button');

      expect(result).toEqual({
        selector: '.my-button',
        computedStyles: expectedStyles,
      });
    });

    it('extracts pseudo styles when enabled', async () => {
      const baseStyles = { color: 'rgb(0, 0, 0)' };
      const hoverStyles = { color: 'rgb(0, 0, 255)' };

      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(baseStyles);
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(hoverStyles);
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(null);
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(null);
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(null);

      const result = await extractElementStyles(mockPage as Page, '.my-button', {
        includePseudoStyles: true,
      });

      expect(result?.pseudoStyles).toEqual({ hover: hoverStyles });
    });

    it('skips pseudo styles when disabled', async () => {
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce({
        color: 'rgb(0, 0, 0)',
      });

      const result = await extractElementStyles(mockPage as Page, '.my-button', {
        includePseudoStyles: false,
      });

      expect(result?.pseudoStyles).toBeUndefined();
    });

    it('uses custom style properties', async () => {
      const customProps = ['color', 'font-size'];
      const expectedStyles = {
        color: 'rgb(0, 0, 0)',
        'font-size': '16px',
      };
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(expectedStyles);
      vi.mocked(mockPage.evaluate!).mockResolvedValueOnce(undefined);

      const result = await extractElementStyles(mockPage as Page, '.my-button', {
        styleProperties: customProps,
      });

      expect(result?.computedStyles).toEqual(expectedStyles);
    });
  });

  describe('extractMultipleElementStyles', () => {
    it('extracts styles for multiple selectors', async () => {
      vi.mocked(mockPage.evaluate!).mockResolvedValue({
        color: 'rgb(0, 0, 0)',
      });

      const result = await extractMultipleElementStyles(mockPage as Page, [
        '.button-1',
        '.button-2',
      ]);

      expect(result).toHaveLength(2);
    });

    it('skips selectors that return null', async () => {
      vi.mocked(mockPage.$!)
        .mockResolvedValueOnce(mockElement as ElementHandle)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockElement as ElementHandle);

      vi.mocked(mockPage.evaluate!).mockResolvedValue({
        color: 'rgb(0, 0, 0)',
      });

      const result = await extractMultipleElementStyles(mockPage as Page, [
        '.button-1',
        '.missing',
        '.button-3',
      ]);

      expect(result).toHaveLength(2);
    });
  });

  describe('getElementInfo', () => {
    it('returns element info', async () => {
      vi.mocked(mockPage.evaluate!).mockResolvedValue({
        tagName: 'button',
        selector: '.my-button',
        className: 'my-button primary',
        id: 'submit-btn',
        boundingBox: { x: 100, y: 200, width: 120, height: 40 },
      });

      const result = await getElementInfo(mockPage as Page, '.my-button');

      expect(result).not.toBeNull();
      expect(result?.tagName).toBe('button');
      expect(result?.className).toBe('my-button primary');
      expect(result?.boundingBox.width).toBe(120);
    });

    it('returns null when element not found', async () => {
      vi.mocked(mockPage.$!).mockResolvedValue(null);

      const result = await getElementInfo(mockPage as Page, '.non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findElementsByType', () => {
    it('finds buttons', async () => {
      vi.mocked(mockPage.$$!)
        .mockResolvedValueOnce([{}, {}] as ElementHandle[])
        .mockResolvedValueOnce([{}] as ElementHandle[])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await findElementsByType(mockPage as Page, 'button');

      expect(result.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown type', async () => {
      const result = await findElementsByType(mockPage as Page, 'unknown-type');

      expect(result).toEqual([]);
    });
  });
});

describe('Style Utilities', () => {
  describe('diffStyles', () => {
    it('detects changed properties', () => {
      const base = { color: 'red', 'font-size': '16px' };
      const target = { color: 'blue', 'font-size': '16px' };

      const diff = diffStyles(base, target);

      expect(diff).toEqual({
        color: { from: 'red', to: 'blue' },
      });
    });

    it('detects added properties', () => {
      const base = { color: 'red' };
      const target = { color: 'red', 'font-size': '18px' };

      const diff = diffStyles(base, target);

      expect(diff).toEqual({
        'font-size': { from: '', to: '18px' },
      });
    });

    it('returns empty object when no changes', () => {
      const base = { color: 'red', 'font-size': '16px' };
      const target = { color: 'red', 'font-size': '16px' };

      const diff = diffStyles(base, target);

      expect(diff).toEqual({});
    });
  });

  describe('normalizeColor', () => {
    it('converts rgb to hex', () => {
      expect(normalizeColor('rgb(255, 0, 0)')).toBe('#ff0000');
      expect(normalizeColor('rgb(0, 255, 0)')).toBe('#00ff00');
      expect(normalizeColor('rgb(0, 0, 255)')).toBe('#0000ff');
    });

    it('converts rgba to hex', () => {
      expect(normalizeColor('rgba(255, 128, 0, 0.5)')).toBe('#ff8000');
    });

    it('lowercases hex colors', () => {
      expect(normalizeColor('#FF0000')).toBe('#ff0000');
      expect(normalizeColor('#AbCdEf')).toBe('#abcdef');
    });

    it('returns original for non-rgb formats', () => {
      expect(normalizeColor('red')).toBe('red');
      expect(normalizeColor('transparent')).toBe('transparent');
    });
  });

  describe('extractColorTokens', () => {
    it('extracts unique colors from styles', () => {
      const styles: ExtractedStyles[] = [
        {
          selector: '.button-1',
          computedStyles: {
            color: 'rgb(0, 0, 0)',
            'background-color': 'rgb(255, 0, 0)',
          },
        },
        {
          selector: '.button-2',
          computedStyles: {
            color: 'rgb(0, 0, 0)',
            'background-color': 'rgb(0, 255, 0)',
          },
        },
      ];

      const colors = extractColorTokens(styles);

      expect(Object.keys(colors)).toContain('#000000');
      expect(Object.keys(colors)).toContain('#ff0000');
      expect(Object.keys(colors)).toContain('#00ff00');
      expect(colors['#000000']).toContain('.button-1');
      expect(colors['#000000']).toContain('.button-2');
    });

    it('ignores transparent colors', () => {
      const styles: ExtractedStyles[] = [
        {
          selector: '.button',
          computedStyles: {
            color: 'rgb(0, 0, 0)',
            'background-color': 'rgba(0, 0, 0, 0)',
          },
        },
      ];

      const colors = extractColorTokens(styles);

      expect(Object.keys(colors)).not.toContain('rgba(0, 0, 0, 0)');
    });
  });

  describe('extractTypographyTokens', () => {
    it('extracts unique typography combinations', () => {
      const styles: ExtractedStyles[] = [
        {
          selector: '.heading',
          computedStyles: {
            'font-family': 'Inter, sans-serif',
            'font-size': '24px',
            'font-weight': '700',
            'line-height': '1.2',
          },
        },
        {
          selector: '.body',
          computedStyles: {
            'font-family': 'Inter, sans-serif',
            'font-size': '16px',
            'font-weight': '400',
            'line-height': '1.5',
          },
        },
      ];

      const typography = extractTypographyTokens(styles);

      expect(Object.keys(typography)).toHaveLength(2);
    });

    it('deduplicates identical typography', () => {
      const styles: ExtractedStyles[] = [
        {
          selector: '.p1',
          computedStyles: {
            'font-family': 'Inter',
            'font-size': '16px',
            'font-weight': '400',
            'line-height': '1.5',
          },
        },
        {
          selector: '.p2',
          computedStyles: {
            'font-family': 'Inter',
            'font-size': '16px',
            'font-weight': '400',
            'line-height': '1.5',
          },
        },
      ];

      const typography = extractTypographyTokens(styles);

      expect(Object.keys(typography)).toHaveLength(1);
    });
  });
});
