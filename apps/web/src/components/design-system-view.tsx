'use client';

import { ColorPalette } from './color-palette';
import { TypographyDisplay } from './typography-display';
import { SpacingDisplay } from './spacing-display';

export interface DesignTokens {
  colors?: Record<string, string>;
  typography?: {
    fontFamily?: string;
    fontSize?: Record<string, string>;
    fontWeight?: Record<string, string | number>;
    lineHeight?: Record<string, string>;
  };
  spacing?: Record<string, string>;
}

interface DesignSystemViewProps {
  tokens: DesignTokens;
  url?: string;
}

export function DesignSystemView({ tokens, url }: DesignSystemViewProps) {
  const hasContent =
    (tokens.colors && Object.keys(tokens.colors).length > 0) ||
    tokens.typography ||
    (tokens.spacing && Object.keys(tokens.spacing).length > 0);

  if (!hasContent) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">No design tokens extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {url && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Source URL</h2>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
          >
            {url}
          </a>
        </div>
      )}

      {tokens.colors && Object.keys(tokens.colors).length > 0 && (
        <ColorPalette colors={tokens.colors} />
      )}

      {tokens.typography && <TypographyDisplay typography={tokens.typography} />}

      {tokens.spacing && Object.keys(tokens.spacing).length > 0 && (
        <SpacingDisplay spacing={tokens.spacing} />
      )}
    </div>
  );
}
