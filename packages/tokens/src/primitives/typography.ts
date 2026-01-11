import type { FontSizeKey, FontWeightKey } from '@extracted/types';

export const fontSizes = {
  'text-xs': '0.75rem',
  'text-sm': '0.875rem',
  'text-base': '1rem',
  'text-lg': '1.125rem',
  'text-xl': '1.25rem',
} as const satisfies Record<FontSizeKey, string>;

export const fontWeights = {
  'font-normal': '400',
  'font-medium': '500',
  'font-semibold': '600',
  'font-bold': '700',
} as const satisfies Record<FontWeightKey, string>;
