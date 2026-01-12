import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PNG } from 'pngjs';
import type { ColorHistogram } from './color';
import type { BatchComparisonResult, ComparisonResult } from './compare';
import type { RefinementSuggestion } from './refine';
import { calculateSSIM, isSSIMPass } from './ssim';
import {
  extractColorHistogram,
  compareHistograms,
  calculateColorSimilarity,
  isColorPass,
} from './color';
import { compareComponents, compareComponentsBatch, getComparisonSummary } from './compare';
import {
  getRefinementSuggestions,
  getRefinementSuggestionsBatch,
  prioritizeSuggestions,
  filterSuggestionsByCategory,
} from './refine';

vi.mock('pixelmatch', () => ({
  default: vi.fn(() => 0),
}));

const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: mockGenerateContent,
    })),
  })),
}));

describe('SSIM Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateSSIM', () => {
    it('returns score of 1 for identical images', async () => {
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(0);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer);

      expect(result.score).toBe(1);
      expect(result.diffPixels).toBe(0);
      expect(result.totalPixels).toBe(100);
    });

    it('returns lower score when images differ', async () => {
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(50);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer);

      expect(result.score).toBe(0.5);
      expect(result.diffPixels).toBe(50);
    });

    it('generates diff image when requested', async () => {
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(0);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer, { generateDiff: true });

      expect(result.diffImage).toBeDefined();
      expect(result.diffImage).toBeInstanceOf(Buffer);
    });

    it('does not generate diff image by default', async () => {
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(0);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer);

      expect(result.diffImage).toBeUndefined();
    });

    it('handles images of different sizes', async () => {
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(25);

      const png1 = new PNG({ width: 10, height: 10 });
      png1.data.fill(255);
      const buffer1 = PNG.sync.write(png1);

      const png2 = new PNG({ width: 5, height: 5 });
      png2.data.fill(255);
      const buffer2 = PNG.sync.write(png2);

      const result = await calculateSSIM(buffer1, buffer2);

      expect(result.totalPixels).toBe(100);
      expect(result.score).toBe(0.75);
    });

    it('respects threshold option', async () => {
      const pixelmatch = (await import('pixelmatch')).default;

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      await calculateSSIM(buffer, buffer, { threshold: 0.5 });

      expect(pixelmatch).toHaveBeenCalled();
      const callArgs = vi.mocked(pixelmatch).mock.calls[0];
      expect(callArgs?.[5]).toMatchObject({ threshold: 0.5 });
    });
  });

  describe('isSSIMPass', () => {
    it('returns true when score meets threshold', () => {
      expect(isSSIMPass(0.95)).toBe(true);
      expect(isSSIMPass(0.99)).toBe(true);
      expect(isSSIMPass(1.0)).toBe(true);
    });

    it('returns false when score below threshold', () => {
      expect(isSSIMPass(0.94)).toBe(false);
      expect(isSSIMPass(0.5)).toBe(false);
      expect(isSSIMPass(0)).toBe(false);
    });

    it('respects custom threshold', () => {
      expect(isSSIMPass(0.8, 0.8)).toBe(true);
      expect(isSSIMPass(0.79, 0.8)).toBe(false);
    });
  });
});

describe('Color Comparison', () => {
  describe('extractColorHistogram', () => {
    it('extracts histogram from image with correct bucket count', async () => {
      const png = new PNG({ width: 2, height: 2 });
      // Set all pixels to red
      for (let i = 0; i < 4; i++) {
        png.data[i * 4] = 255; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 0; // B
        png.data[i * 4 + 3] = 255; // A
      }
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer);

      expect(histogram.red).toHaveLength(256);
      expect(histogram.green).toHaveLength(256);
      expect(histogram.blue).toHaveLength(256);
      expect(histogram.red[255]).toBe(1); // All red pixels in highest bucket
    });

    it('normalizes histogram values to sum to 1', async () => {
      const png = new PNG({ width: 2, height: 2 });
      png.data.fill(255); // All white pixels
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer);

      const redSum = histogram.red.reduce((sum, val) => sum + val, 0);
      const greenSum = histogram.green.reduce((sum, val) => sum + val, 0);
      const blueSum = histogram.blue.reduce((sum, val) => sum + val, 0);

      expect(redSum).toBeCloseTo(1, 5);
      expect(greenSum).toBeCloseTo(1, 5);
      expect(blueSum).toBeCloseTo(1, 5);
    });

    it('respects bucket count option', async () => {
      const png = new PNG({ width: 2, height: 2 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer, { buckets: 16 });

      expect(histogram.red).toHaveLength(16);
      expect(histogram.green).toHaveLength(16);
      expect(histogram.blue).toHaveLength(16);
    });

    it('ignores transparent pixels when ignoreAlpha is true (default)', async () => {
      const png = new PNG({ width: 2, height: 2 });
      // Set 2 opaque red pixels, 2 transparent blue pixels
      for (let i = 0; i < 2; i++) {
        png.data[i * 4] = 255; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 0; // B
        png.data[i * 4 + 3] = 255; // A (opaque)
      }
      for (let i = 2; i < 4; i++) {
        png.data[i * 4] = 0; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 255; // B
        png.data[i * 4 + 3] = 0; // A (transparent)
      }
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer);

      // Only red pixels should be counted (ignoring transparent blue)
      expect(histogram.red[255]).toBe(1);
      expect(histogram.blue[255]).toBe(0);
    });

    it('includes transparent pixels when ignoreAlpha is false', async () => {
      const png = new PNG({ width: 2, height: 2 });
      // Set 2 opaque red pixels, 2 transparent blue pixels
      for (let i = 0; i < 2; i++) {
        png.data[i * 4] = 255; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 0; // B
        png.data[i * 4 + 3] = 255; // A (opaque)
      }
      for (let i = 2; i < 4; i++) {
        png.data[i * 4] = 0; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 255; // B
        png.data[i * 4 + 3] = 0; // A (transparent)
      }
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer, { ignoreAlpha: false });

      // Both red and blue pixels should be counted
      expect(histogram.red[255]).toBe(0.5);
      expect(histogram.blue[255]).toBe(0.5);
    });

    it('distributes colors across correct buckets', async () => {
      const png = new PNG({ width: 2, height: 2 });
      // Set pixels with different red values
      png.data[0] = 0; // bucket 0 for 16 buckets
      png.data[4] = 64; // bucket 4 for 16 buckets
      png.data[8] = 128; // bucket 8 for 16 buckets
      png.data[12] = 255; // bucket 15 for 16 buckets
      // Fill other channels and alpha
      for (let i = 0; i < 4; i++) {
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 0; // B
        png.data[i * 4 + 3] = 255; // A
      }
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer, { buckets: 16 });

      expect(histogram.red[0]).toBe(0.25); // 0 -> bucket 0
      expect(histogram.red[4]).toBe(0.25); // 64 -> bucket 4
      expect(histogram.red[8]).toBe(0.25); // 128 -> bucket 8
      expect(histogram.red[15]).toBe(0.25); // 255 -> bucket 15
    });
  });

  describe('compareHistograms', () => {
    it('returns 1 for identical histograms', async () => {
      const histogram: ColorHistogram = {
        red: [0.5, 0.5],
        green: [0.5, 0.5],
        blue: [0.5, 0.5],
      };

      const score = compareHistograms(histogram, histogram);

      expect(score).toBe(1);
    });

    it('returns 0 for completely different histograms', async () => {
      const h1: ColorHistogram = {
        red: [1, 0],
        green: [1, 0],
        blue: [1, 0],
      };

      const h2: ColorHistogram = {
        red: [0, 1],
        green: [0, 1],
        blue: [0, 1],
      };

      const score = compareHistograms(h1, h2);

      expect(score).toBe(0);
    });

    it('returns partial score for overlapping histograms', async () => {
      const h1: ColorHistogram = {
        red: [0.5, 0.5],
        green: [0.5, 0.5],
        blue: [0.5, 0.5],
      };

      const h2: ColorHistogram = {
        red: [0.25, 0.75],
        green: [0.25, 0.75],
        blue: [0.25, 0.75],
      };

      const score = compareHistograms(h1, h2);

      // Intersection: min(0.5, 0.25) + min(0.5, 0.75) = 0.25 + 0.5 = 0.75 per channel
      expect(score).toBe(0.75);
    });

    it('averages scores across all three channels', async () => {
      const h1: ColorHistogram = {
        red: [1, 0], // Will have 0 similarity with h2.red
        green: [0.5, 0.5], // Will have 1 similarity with h2.green
        blue: [0.5, 0.5], // Will have 0.5 similarity with h2.blue
      };

      const h2: ColorHistogram = {
        red: [0, 1],
        green: [0.5, 0.5],
        blue: [0.25, 0.75],
      };

      const score = compareHistograms(h1, h2);

      // (0 + 1 + 0.75) / 3 ≈ 0.583
      expect(score).toBeCloseTo(0.583, 2);
    });
  });

  describe('calculateColorSimilarity', () => {
    it('returns score of 1 for identical images', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateColorSimilarity(buffer, buffer);

      expect(result.score).toBe(1);
      expect(result.histogram1).toBeDefined();
      expect(result.histogram2).toBeDefined();
    });

    it('returns lower score for different images', async () => {
      const png1 = new PNG({ width: 2, height: 2 });
      // All red
      for (let i = 0; i < 4; i++) {
        png1.data[i * 4] = 255;
        png1.data[i * 4 + 1] = 0;
        png1.data[i * 4 + 2] = 0;
        png1.data[i * 4 + 3] = 255;
      }
      const buffer1 = PNG.sync.write(png1);

      const png2 = new PNG({ width: 2, height: 2 });
      // All blue
      for (let i = 0; i < 4; i++) {
        png2.data[i * 4] = 0;
        png2.data[i * 4 + 1] = 0;
        png2.data[i * 4 + 2] = 255;
        png2.data[i * 4 + 3] = 255;
      }
      const buffer2 = PNG.sync.write(png2);

      const result = await calculateColorSimilarity(buffer1, buffer2);

      expect(result.score).toBeLessThan(1);
      expect(result.histogram1.red[255]).toBe(1);
      expect(result.histogram2.blue[255]).toBe(1);
    });

    it('passes options to extractColorHistogram', async () => {
      const png = new PNG({ width: 2, height: 2 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateColorSimilarity(buffer, buffer, { buckets: 16 });

      expect(result.histogram1.red).toHaveLength(16);
      expect(result.histogram2.red).toHaveLength(16);
    });

    it('returns both histograms for comparison', async () => {
      const png = new PNG({ width: 2, height: 2 });
      png.data.fill(128);
      const buffer = PNG.sync.write(png);

      const result = await calculateColorSimilarity(buffer, buffer);

      expect(result.histogram1).toHaveProperty('red');
      expect(result.histogram1).toHaveProperty('green');
      expect(result.histogram1).toHaveProperty('blue');
      expect(result.histogram2).toHaveProperty('red');
      expect(result.histogram2).toHaveProperty('green');
      expect(result.histogram2).toHaveProperty('blue');
    });
  });

  describe('isColorPass', () => {
    it('returns true when score meets threshold', async () => {
      expect(isColorPass(0.95)).toBe(true);
      expect(isColorPass(1.0)).toBe(true);
    });

    it('returns true when score exactly equals threshold', async () => {
      expect(isColorPass(0.95, 0.95)).toBe(true);
      expect(isColorPass(0.8, 0.8)).toBe(true);
    });

    it('returns false when score below threshold', async () => {
      expect(isColorPass(0.94)).toBe(false);
      expect(isColorPass(0.5)).toBe(false);
      expect(isColorPass(0)).toBe(false);
    });

    it('respects custom threshold', async () => {
      expect(isColorPass(0.8, 0.8)).toBe(true);
      expect(isColorPass(0.79, 0.8)).toBe(false);
      expect(isColorPass(0.5, 0.5)).toBe(true);
      expect(isColorPass(0.49, 0.5)).toBe(false);
    });

    it('uses default threshold of 0.95', async () => {
      expect(isColorPass(0.95)).toBe(true);
      expect(isColorPass(0.949)).toBe(false);
    });
  });
});

describe('Combined Comparison', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const pixelmatch = (await import('pixelmatch')).default;
    vi.mocked(pixelmatch).mockReturnValue(0);
  });

  describe('compareComponents', () => {
    it('returns all required fields in result', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result).toHaveProperty('ssimScore');
      expect(result).toHaveProperty('colorScore');
      expect(result).toHaveProperty('combinedScore');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('ssimResult');
      expect(result).toHaveProperty('colorResult');
      expect(typeof result.ssimScore).toBe('number');
      expect(typeof result.colorScore).toBe('number');
      expect(typeof result.combinedScore).toBe('number');
      expect(typeof result.passed).toBe('boolean');
    });

    it('returns high scores for identical images', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result.ssimScore).toBe(1);
      expect(result.colorScore).toBe(1);
      expect(result.combinedScore).toBe(1);
    });

    it('calculates combined score with default weights (60% SSIM, 40% color)', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      const expectedCombined = result.ssimScore * 0.6 + result.colorScore * 0.4;
      expect(result.combinedScore).toBeCloseTo(expectedCombined, 5);
    });

    it('passes when combined score >= threshold', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer, { passThreshold: 0.5 });

      expect(result.combinedScore).toBeGreaterThanOrEqual(0.5);
      expect(result.passed).toBe(true);
    });

    it('fails when combined score < threshold', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer, { passThreshold: 1.1 });

      expect(result.passed).toBe(false);
    });

    it('respects custom passThreshold', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const resultLow = await compareComponents(buffer, buffer, { passThreshold: 0.5 });
      const resultHigh = await compareComponents(buffer, buffer, { passThreshold: 1.1 });

      expect(resultLow.passed).toBe(true);
      expect(resultHigh.passed).toBe(false);
    });

    it('respects custom weights', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer, {
        ssimWeight: 0.8,
        colorWeight: 0.2,
      });

      const expectedCombined = result.ssimScore * 0.8 + result.colorScore * 0.2;
      expect(result.combinedScore).toBeCloseTo(expectedCombined, 5);
    });

    it('generates diff image when requested', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer, { generateDiff: true });

      expect(result.diffImage).toBeDefined();
      expect(result.diffImage).toBeInstanceOf(Buffer);
    });

    it('does not generate diff image by default', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result.diffImage).toBeUndefined();
    });

    it('includes nested ssimResult with correct structure', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result.ssimResult).toHaveProperty('score');
      expect(result.ssimResult).toHaveProperty('diffPixels');
      expect(result.ssimResult).toHaveProperty('totalPixels');
      expect(result.ssimResult.score).toBe(result.ssimScore);
    });

    it('includes nested colorResult with histograms', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result.colorResult).toHaveProperty('score');
      expect(result.colorResult).toHaveProperty('histogram1');
      expect(result.colorResult).toHaveProperty('histogram2');
      expect(result.colorResult.score).toBe(result.colorScore);
    });
  });

  describe('compareComponentsBatch', () => {
    it('compares multiple components and preserves order', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const results = await compareComponentsBatch([
        { componentId: 'button', originalImage: buffer, generatedImage: buffer },
        { componentId: 'card', originalImage: buffer, generatedImage: buffer },
        { componentId: 'input', originalImage: buffer, generatedImage: buffer },
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]?.componentId).toBe('button');
      expect(results[1]?.componentId).toBe('card');
      expect(results[2]?.componentId).toBe('input');
    });

    it('returns full ComparisonResult for each component', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const results = await compareComponentsBatch([
        { componentId: 'button', originalImage: buffer, generatedImage: buffer },
      ]);

      const result = results[0]?.result;
      expect(result).toHaveProperty('ssimScore');
      expect(result).toHaveProperty('colorScore');
      expect(result).toHaveProperty('combinedScore');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('ssimResult');
      expect(result).toHaveProperty('colorResult');
    });

    it('passes options to all comparisons', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const results = await compareComponentsBatch(
        [
          { componentId: 'button', originalImage: buffer, generatedImage: buffer },
          { componentId: 'card', originalImage: buffer, generatedImage: buffer },
        ],
        { passThreshold: 0.5, ssimWeight: 0.7, colorWeight: 0.3 }
      );

      for (const item of results) {
        const expectedCombined = item.result.ssimScore * 0.7 + item.result.colorScore * 0.3;
        expect(item.result.combinedScore).toBeCloseTo(expectedCombined, 5);
        expect(item.result.passed).toBe(true);
      }
    });

    it('returns empty array for empty input', async () => {
      const results = await compareComponentsBatch([]);

      expect(results).toEqual([]);
    });

    it('handles single component', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const results = await compareComponentsBatch(
        [{ componentId: 'solo', originalImage: buffer, generatedImage: buffer }],
        { passThreshold: 0.5 }
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.componentId).toBe('solo');
      expect(results[0]?.result.combinedScore).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('getComparisonSummary', () => {
    const createMockResult = (
      componentId: string,
      combinedScore: number,
      passed: boolean
    ): BatchComparisonResult => ({
      componentId,
      result: {
        ssimScore: combinedScore,
        colorScore: combinedScore,
        combinedScore,
        passed,
        ssimResult: { score: combinedScore, diffPixels: 0, totalPixels: 100 },
        colorResult: {
          score: combinedScore,
          histogram1: { red: [], green: [], blue: [] },
          histogram2: { red: [], green: [], blue: [] },
        },
      },
    });

    it('calculates correct totals for mixed results', () => {
      const mockResults: BatchComparisonResult[] = [
        createMockResult('button', 1, true),
        createMockResult('card', 0.8, false),
      ];

      const summary = getComparisonSummary(mockResults);

      expect(summary.total).toBe(2);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.averageScore).toBe(0.9);
    });

    it('handles all passing results', () => {
      const mockResults: BatchComparisonResult[] = [
        createMockResult('button', 1, true),
        createMockResult('card', 0.98, true),
        createMockResult('input', 0.96, true),
      ];

      const summary = getComparisonSummary(mockResults);

      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(3);
      expect(summary.failed).toBe(0);
      expect(summary.averageScore).toBeCloseTo(0.98, 2);
    });

    it('handles all failing results', () => {
      const mockResults: BatchComparisonResult[] = [
        createMockResult('button', 0.5, false),
        createMockResult('card', 0.6, false),
      ];

      const summary = getComparisonSummary(mockResults);

      expect(summary.total).toBe(2);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(2);
      expect(summary.averageScore).toBe(0.55);
    });

    it('handles single result', () => {
      const mockResults: BatchComparisonResult[] = [createMockResult('button', 0.95, true)];

      const summary = getComparisonSummary(mockResults);

      expect(summary.total).toBe(1);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(0);
      expect(summary.averageScore).toBe(0.95);
    });

    it('handles empty results array', () => {
      const summary = getComparisonSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.averageScore).toBe(0);
    });

    it('calculates average score correctly with varying scores', () => {
      const mockResults: BatchComparisonResult[] = [
        createMockResult('a', 1.0, true),
        createMockResult('b', 0.8, false),
        createMockResult('c', 0.6, false),
        createMockResult('d', 0.4, false),
      ];

      const summary = getComparisonSummary(mockResults);

      expect(summary.averageScore).toBe(0.7);
    });
  });
});

describe('Refinement Suggestions', () => {
  const createMockComparisonResult = (): ComparisonResult => ({
    ssimScore: 0.9,
    colorScore: 0.85,
    combinedScore: 0.88,
    passed: false,
    ssimResult: { score: 0.9, diffPixels: 10, totalPixels: 100 },
    colorResult: {
      score: 0.85,
      histogram1: { red: [], green: [], blue: [] },
      histogram2: { red: [], green: [], blue: [] },
    },
  });

  const createTestBuffer = (): Buffer => {
    const png = new PNG({ width: 10, height: 10 });
    png.data.fill(255);
    return PNG.sync.write(png);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('prioritizeSuggestions', () => {
    it('sorts suggestions by severity (critical first)', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'minor', description: 'Minor color diff' },
        { category: 'spacing', severity: 'critical', description: 'Critical spacing' },
        { category: 'typography', severity: 'major', description: 'Major font diff' },
      ];

      const sorted = prioritizeSuggestions(suggestions);

      expect(sorted[0]?.severity).toBe('critical');
      expect(sorted[1]?.severity).toBe('major');
      expect(sorted[2]?.severity).toBe('minor');
    });

    it('preserves order for same severity (stable sort)', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'major', description: 'First major' },
        { category: 'spacing', severity: 'major', description: 'Second major' },
        { category: 'typography', severity: 'major', description: 'Third major' },
      ];

      const sorted = prioritizeSuggestions(suggestions);

      expect(sorted[0]?.description).toBe('First major');
      expect(sorted[1]?.description).toBe('Second major');
      expect(sorted[2]?.description).toBe('Third major');
    });

    it('handles empty array', () => {
      const sorted = prioritizeSuggestions([]);

      expect(sorted).toEqual([]);
    });

    it('handles single suggestion', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'critical', description: 'Only one' },
      ];

      const sorted = prioritizeSuggestions(suggestions);

      expect(sorted).toHaveLength(1);
      expect(sorted[0]?.description).toBe('Only one');
    });

    it('does not mutate original array', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'minor', description: 'Minor' },
        { category: 'spacing', severity: 'critical', description: 'Critical' },
      ];

      const sorted = prioritizeSuggestions(suggestions);

      expect(suggestions[0]?.severity).toBe('minor');
      expect(sorted[0]?.severity).toBe('critical');
      expect(sorted).not.toBe(suggestions);
    });
  });

  describe('filterSuggestionsByCategory', () => {
    it('filters suggestions by single category', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'major', description: 'Color issue' },
        { category: 'spacing', severity: 'minor', description: 'Spacing issue' },
        { category: 'typography', severity: 'critical', description: 'Font issue' },
      ];

      const filtered = filterSuggestionsByCategory(suggestions, ['color']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.category).toBe('color');
    });

    it('filters suggestions by multiple categories', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'major', description: 'Color issue' },
        { category: 'spacing', severity: 'minor', description: 'Spacing issue' },
        { category: 'typography', severity: 'critical', description: 'Font issue' },
        { category: 'border', severity: 'minor', description: 'Border issue' },
      ];

      const filtered = filterSuggestionsByCategory(suggestions, ['color', 'typography']);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]?.category).toBe('color');
      expect(filtered[1]?.category).toBe('typography');
    });

    it('returns empty array when no matches', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'major', description: 'Color issue' },
      ];

      const filtered = filterSuggestionsByCategory(suggestions, ['shadow']);

      expect(filtered).toHaveLength(0);
    });

    it('handles empty suggestions array', () => {
      const filtered = filterSuggestionsByCategory([], ['color']);

      expect(filtered).toEqual([]);
    });

    it('handles empty categories array', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'major', description: 'Color issue' },
      ];

      const filtered = filterSuggestionsByCategory(suggestions, []);

      expect(filtered).toHaveLength(0);
    });

    it('preserves order of filtered suggestions', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'minor', description: 'First color' },
        { category: 'spacing', severity: 'major', description: 'Spacing' },
        { category: 'color', severity: 'critical', description: 'Second color' },
      ];

      const filtered = filterSuggestionsByCategory(suggestions, ['color']);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]?.description).toBe('First color');
      expect(filtered[1]?.description).toBe('Second color');
    });

    it('filters all valid categories', () => {
      const suggestions: RefinementSuggestion[] = [
        { category: 'color', severity: 'minor', description: 'Color' },
        { category: 'spacing', severity: 'minor', description: 'Spacing' },
        { category: 'typography', severity: 'minor', description: 'Typography' },
        { category: 'layout', severity: 'minor', description: 'Layout' },
        { category: 'border', severity: 'minor', description: 'Border' },
        { category: 'shadow', severity: 'minor', description: 'Shadow' },
        { category: 'other', severity: 'minor', description: 'Other' },
      ];

      const filtered = filterSuggestionsByCategory(suggestions, [
        'color',
        'spacing',
        'typography',
        'layout',
        'border',
        'shadow',
        'other',
      ]);

      expect(filtered).toHaveLength(7);
    });
  });

  describe('getRefinementSuggestions', () => {
    it('throws error when API key is missing', async () => {
      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      await expect(
        getRefinementSuggestions('button', buffer, buffer, comparisonResult, { apiKey: '' })
      ).rejects.toThrow('GEMINI_API_KEY is required');
    });

    it('throws error when API key is undefined', async () => {
      const originalEnv = process.env['GEMINI_API_KEY'];
      delete process.env['GEMINI_API_KEY'];

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      await expect(
        getRefinementSuggestions('button', buffer, buffer, comparisonResult, {})
      ).rejects.toThrow('GEMINI_API_KEY is required');

      process.env['GEMINI_API_KEY'] = originalEnv;
    });

    it('returns refinement result with valid API response', async () => {
      const mockResponse = {
        suggestions: [
          { category: 'color', severity: 'major', description: 'Color mismatch' },
          { category: 'spacing', severity: 'minor', description: 'Padding difference' },
        ],
        summary: 'Two visual differences found',
        confidence: 0.85,
      };

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(mockResponse) },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const result = await getRefinementSuggestions('button', buffer, buffer, comparisonResult, {
        apiKey: 'test-key',
      });

      expect(result.componentId).toBe('button');
      expect(result.suggestions).toHaveLength(2);
      expect(result.summary).toBe('Two visual differences found');
      expect(result.confidence).toBe(0.85);
    });

    it('respects maxSuggestions option', async () => {
      const mockResponse = {
        suggestions: [
          { category: 'color', severity: 'major', description: 'Issue 1' },
          { category: 'spacing', severity: 'minor', description: 'Issue 2' },
          { category: 'typography', severity: 'critical', description: 'Issue 3' },
        ],
        summary: 'Multiple issues',
        confidence: 0.9,
      };

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(mockResponse) },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const result = await getRefinementSuggestions('button', buffer, buffer, comparisonResult, {
        apiKey: 'test-key',
        maxSuggestions: 2,
      });

      expect(result.suggestions).toHaveLength(2);
    });

    it('handles malformed JSON response gracefully', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'not valid json at all' },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const result = await getRefinementSuggestions('button', buffer, buffer, comparisonResult, {
        apiKey: 'test-key',
      });

      expect(result.suggestions).toEqual([]);
      expect(result.confidence).toBe(0);
    });

    it('handles JSON with extra text around it', async () => {
      const mockResponse = {
        suggestions: [{ category: 'color', severity: 'major', description: 'Color issue' }],
        summary: 'Found issue',
        confidence: 0.8,
      };

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => `Here's my analysis:\n${JSON.stringify(mockResponse)}\nHope that helps!`,
        },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const result = await getRefinementSuggestions('button', buffer, buffer, comparisonResult, {
        apiKey: 'test-key',
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.summary).toBe('Found issue');
    });

    it('filters out invalid suggestions from response', async () => {
      const mockResponse = {
        suggestions: [
          { category: 'color', severity: 'major', description: 'Valid' },
          { category: 'invalid-category', severity: 'major', description: 'Invalid category' },
          { category: 'color', severity: 'invalid-severity', description: 'Invalid severity' },
          { category: 'color', severity: 'major' }, // missing description
          null,
          'not an object',
        ],
        summary: 'Mixed results',
        confidence: 0.7,
      };

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(mockResponse) },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const result = await getRefinementSuggestions('button', buffer, buffer, comparisonResult, {
        apiKey: 'test-key',
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]?.description).toBe('Valid');
    });

    it('clamps confidence to valid range', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({ suggestions: [], summary: 'Test', confidence: 1.5 }),
        },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const result = await getRefinementSuggestions('button', buffer, buffer, comparisonResult, {
        apiKey: 'test-key',
      });

      expect(result.confidence).toBe(1);
    });

    it('provides default confidence when not in response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify({ suggestions: [], summary: 'Test' }) },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const result = await getRefinementSuggestions('button', buffer, buffer, comparisonResult, {
        apiKey: 'test-key',
      });

      expect(result.confidence).toBe(0.5);
    });

    it('provides default summary when not in response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify({ suggestions: [] }) },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const result = await getRefinementSuggestions('button', buffer, buffer, comparisonResult, {
        apiKey: 'test-key',
      });

      expect(result.summary).toBe('No summary provided');
    });
  });

  describe('getRefinementSuggestionsBatch', () => {
    it('processes multiple components', async () => {
      const mockResponse1 = {
        suggestions: [{ category: 'color', severity: 'major', description: 'Color issue' }],
        summary: 'Button analysis',
        confidence: 0.9,
      };
      const mockResponse2 = {
        suggestions: [{ category: 'spacing', severity: 'minor', description: 'Spacing issue' }],
        summary: 'Card analysis',
        confidence: 0.85,
      };

      mockGenerateContent
        .mockResolvedValueOnce({ response: { text: () => JSON.stringify(mockResponse1) } })
        .mockResolvedValueOnce({ response: { text: () => JSON.stringify(mockResponse2) } });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const results = await getRefinementSuggestionsBatch(
        [
          {
            componentId: 'button',
            originalImage: buffer,
            generatedImage: buffer,
            comparisonResult,
          },
          { componentId: 'card', originalImage: buffer, generatedImage: buffer, comparisonResult },
        ],
        { apiKey: 'test-key' }
      );

      expect(results).toHaveLength(2);
      expect(results[0]?.componentId).toBe('button');
      expect(results[1]?.componentId).toBe('card');
      expect(results[0]?.summary).toBe('Button analysis');
      expect(results[1]?.summary).toBe('Card analysis');
    });

    it('returns empty array for empty input', async () => {
      const results = await getRefinementSuggestionsBatch([], { apiKey: 'test-key' });

      expect(results).toEqual([]);
    });

    it('passes options to all calls', async () => {
      const mockResponse = {
        suggestions: [
          { category: 'color', severity: 'major', description: '1' },
          { category: 'spacing', severity: 'minor', description: '2' },
          { category: 'typography', severity: 'critical', description: '3' },
        ],
        summary: 'Test',
        confidence: 0.9,
      };

      mockGenerateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(mockResponse) },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const results = await getRefinementSuggestionsBatch(
        [
          {
            componentId: 'button',
            originalImage: buffer,
            generatedImage: buffer,
            comparisonResult,
          },
        ],
        { apiKey: 'test-key', maxSuggestions: 1 }
      );

      expect(results[0]?.suggestions).toHaveLength(1);
    });

    it('handles single component', async () => {
      const mockResponse = {
        suggestions: [{ category: 'color', severity: 'major', description: 'Issue' }],
        summary: 'Single component',
        confidence: 0.8,
      };

      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => JSON.stringify(mockResponse) },
      });

      const buffer = createTestBuffer();
      const comparisonResult = createMockComparisonResult();

      const results = await getRefinementSuggestionsBatch(
        [{ componentId: 'solo', originalImage: buffer, generatedImage: buffer, comparisonResult }],
        { apiKey: 'test-key' }
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.componentId).toBe('solo');
    });
  });

  describe('module exports', () => {
    it('exports all refinement functions', async () => {
      const refine = await import('./refine');

      expect(refine.getRefinementSuggestions).toBeDefined();
      expect(refine.getRefinementSuggestionsBatch).toBeDefined();
      expect(refine.prioritizeSuggestions).toBeDefined();
      expect(refine.filterSuggestionsByCategory).toBeDefined();
    });

    it('exports RefinementSuggestion type', async () => {
      const refine = await import('./refine');

      expect(typeof refine.getRefinementSuggestions).toBe('function');
    });
  });
});
