// Comparison module - visual similarity scoring
export { calculateSSIM, isSSIMPass, type SSIMResult, type SSIMOptions } from './ssim';

export {
  extractColorHistogram,
  compareHistograms,
  calculateColorSimilarity,
  isColorPass,
  type ColorHistogram,
  type ColorComparisonResult,
  type ColorComparisonOptions,
} from './color';

export {
  compareComponents,
  compareComponentsBatch,
  getComparisonSummary,
  type ComparisonResult,
  type ComparisonOptions,
  type BatchComparisonItem,
  type BatchComparisonResult,
} from './compare';
