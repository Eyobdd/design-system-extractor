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
