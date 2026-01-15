'use client';

import { useMemo } from 'react';
import { parseExtractedTokens } from '@/lib/tokens-to-variants';
import type { ParsedColor, ParsedTypography } from '@/lib/tokens-to-variants';

interface ExtractedTokensViewProps {
  tokens: Record<string, unknown>;
}

/**
 * Displays extracted colors and typography in a visual format
 */
export function ExtractedTokensView({ tokens }: ExtractedTokensViewProps) {
  const { colors, typography } = useMemo(
    () => parseExtractedTokens(tokens as Parameters<typeof parseExtractedTokens>[0]),
    [tokens]
  );

  return (
    <div className="space-y-8">
      {/* Colors Section */}
      {colors.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-semibold">Colors ({colors.length})</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colors.map(color => (
              <ColorCard key={color.hex} color={color} />
            ))}
          </div>
        </section>
      )}

      {/* Typography Section */}
      {typography.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-semibold">Typography ({typography.length})</h3>
          <div className="space-y-4">
            {typography.map(typo => (
              <TypographyCard key={typo.id} typography={typo} />
            ))}
          </div>
        </section>
      )}

      {colors.length === 0 && typography.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-500">No tokens extracted</p>
        </div>
      )}
    </div>
  );
}

function ColorCard({ color }: { color: ParsedColor }) {
  const isLight = isLightColor(color.hex);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex h-20 items-end p-3" style={{ backgroundColor: color.hex }}>
        <span
          className={`rounded px-2 py-0.5 text-xs font-mono ${
            isLight ? 'bg-black/10 text-black' : 'bg-white/10 text-white'
          }`}
        >
          {color.hex}
        </span>
      </div>
      <div className="bg-white p-3 dark:bg-gray-900">
        <p className="text-xs text-gray-500">
          Used in: {Array.isArray(color.usedIn) ? color.usedIn.join(', ') : String(color.usedIn)}
        </p>
      </div>
    </div>
  );
}

function TypographyCard({ typography }: { typography: ParsedTypography }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{typography.cleanFontName}</h4>
          <p className="text-xs text-gray-500">
            {typography.fontSize} / {typography.fontWeight} / {typography.lineHeight}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
            {typography.fontSize}
          </span>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
            {typography.fontWeight}
          </span>
        </div>
      </div>

      {/* Typography Preview */}
      <div
        className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize,
          fontWeight: Number(typography.fontWeight),
          lineHeight: typography.lineHeight,
        }}
      >
        The quick brown fox jumps over the lazy dog
      </div>
    </div>
  );
}

/**
 * Determines if a hex color is light (for contrast text)
 */
function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  // Using relative luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1] ?? '0', 16),
        g: parseInt(result[2] ?? '0', 16),
        b: parseInt(result[3] ?? '0', 16),
      }
    : null;
}
