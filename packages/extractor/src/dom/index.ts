// DOM module - Style extraction from page elements
export {
  extractElementStyles,
  extractMultipleElementStyles,
  getElementInfo,
  findElementsByType,
  diffStyles,
  normalizeColor,
  extractColorTokens,
  extractTypographyTokens,
} from './extract';
export {
  DEFAULT_STYLE_PROPERTIES,
  type ExtractedStyles,
  type ElementInfo,
  type ExtractionConfig,
  type StyleProperty,
} from './types';
