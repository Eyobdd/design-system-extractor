import type { VariantReview, TextVariantSpec } from '@extracted/types';

interface ExtractedColors {
  [color: string]: string[];
}

interface ExtractedTypography {
  [key: string]: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
}

interface ExtractedTokens {
  colors?: ExtractedColors;
  typography?: ExtractedTypography;
}

/**
 * Converts extracted tokens into VariantReview objects for display
 */
export function tokensToVariantReviews(tokens: ExtractedTokens): VariantReview[] {
  const reviews: VariantReview[] = [];

  // Convert typography entries to text variants
  if (tokens.typography) {
    Object.entries(tokens.typography).forEach(([key, style], index) => {
      // Parse the font family to get a clean name
      const fontName = extractFontName(style.fontFamily);
      const variantName = `${fontName} ${style.fontSize} ${style.fontWeight}`;

      const spec: TextVariantSpec = {
        family: style.fontFamily as TextVariantSpec['family'],
        size: style.fontSize as TextVariantSpec['size'],
        weight: style.fontWeight as TextVariantSpec['weight'],
        lineHeight: style.lineHeight as TextVariantSpec['lineHeight'],
        color: 'gray-900' as TextVariantSpec['color'],
      };

      reviews.push({
        componentType: 'text',
        variantId: `text_${index}`,
        variantName,
        status: 'pending',
        extractedSpec: spec,
        originalSelector: key,
        originalBoundingBox: { x: 0, y: 0, width: 200, height: 50 },
      });
    });
  }

  return reviews;
}

/**
 * Extracts a clean font name from a font-family string
 */
function extractFontName(fontFamily: string): string {
  // Handle Next.js font hashes like "__DM_Sans_be8b38"
  const parts = fontFamily.split(',')[0]?.trim() ?? '';

  // Remove Next.js hash pattern
  const cleaned = parts.replace(/__([^_]+)_[a-f0-9]+/g, '$1');

  // Remove quotes and fallback keywords
  return cleaned.replace(/["']/g, '').replace(/^(ui-|system-)/, '');
}

/**
 * Parsed color with usage information
 */
export interface ParsedColor {
  hex: string;
  usedIn: string[];
}

/**
 * Parsed typography style
 */
export interface ParsedTypography {
  id: string;
  fontFamily: string;
  cleanFontName: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
}

/**
 * Parses extracted tokens into display-ready format
 */
export function parseExtractedTokens(tokens: ExtractedTokens): {
  colors: ParsedColor[];
  typography: ParsedTypography[];
} {
  const colors: ParsedColor[] = [];
  const typography: ParsedTypography[] = [];

  if (tokens.colors) {
    Object.entries(tokens.colors).forEach(([hex, usedIn]) => {
      colors.push({ hex, usedIn });
    });
  }

  if (tokens.typography) {
    Object.entries(tokens.typography).forEach(([key, style]) => {
      typography.push({
        id: key,
        fontFamily: style.fontFamily,
        cleanFontName: extractFontName(style.fontFamily),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
      });
    });
  }

  return { colors, typography };
}
