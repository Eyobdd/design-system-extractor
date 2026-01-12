import { calculateSSIM, type SSIMResult } from './ssim';
import { calculateColorSimilarity, type ColorComparisonResult } from './color';

export interface ComparisonResult {
  ssimScore: number;
  colorScore: number;
  combinedScore: number;
  passed: boolean;
  ssimResult: SSIMResult;
  colorResult: ColorComparisonResult;
  diffImage?: Buffer | undefined;
}

export interface ComparisonOptions {
  ssimWeight?: number;
  colorWeight?: number;
  passThreshold?: number;
  generateDiff?: boolean;
}

const DEFAULT_SSIM_WEIGHT = 0.6;
const DEFAULT_COLOR_WEIGHT = 0.4;
const DEFAULT_PASS_THRESHOLD = 0.95;

export async function compareComponents(
  originalImage: Buffer,
  generatedImage: Buffer,
  options: ComparisonOptions = {}
): Promise<ComparisonResult> {
  const {
    ssimWeight = DEFAULT_SSIM_WEIGHT,
    colorWeight = DEFAULT_COLOR_WEIGHT,
    passThreshold = DEFAULT_PASS_THRESHOLD,
    generateDiff = false,
  } = options;

  const [ssimResult, colorResult] = await Promise.all([
    calculateSSIM(originalImage, generatedImage, { generateDiff }),
    calculateColorSimilarity(originalImage, generatedImage),
  ]);

  const combinedScore = ssimResult.score * ssimWeight + colorResult.score * colorWeight;
  const passed = combinedScore >= passThreshold;

  return {
    ssimScore: ssimResult.score,
    colorScore: colorResult.score,
    combinedScore,
    passed,
    ssimResult,
    colorResult,
    diffImage: ssimResult.diffImage,
  };
}

export interface BatchComparisonItem {
  componentId: string;
  originalImage: Buffer;
  generatedImage: Buffer;
}

export interface BatchComparisonResult {
  componentId: string;
  result: ComparisonResult;
}

export async function compareComponentsBatch(
  items: BatchComparisonItem[],
  options: ComparisonOptions = {}
): Promise<BatchComparisonResult[]> {
  const results = await Promise.all(
    items.map(async item => ({
      componentId: item.componentId,
      result: await compareComponents(item.originalImage, item.generatedImage, options),
    }))
  );

  return results;
}

export function getComparisonSummary(results: BatchComparisonResult[]): {
  total: number;
  passed: number;
  failed: number;
  averageScore: number;
} {
  const total = results.length;
  const passed = results.filter(r => r.result.passed).length;
  const failed = total - passed;
  const averageScore =
    total > 0 ? results.reduce((sum, r) => sum + r.result.combinedScore, 0) / total : 0;

  return {
    total,
    passed,
    failed,
    averageScore,
  };
}
