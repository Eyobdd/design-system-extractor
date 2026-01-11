import type { SpacingKey, RadiusKey } from '@extracted/types';

export const spacing = {
  'space-0': '0',
  'space-1': '0.25rem',
  'space-2': '0.5rem',
  'space-4': '1rem',
  'space-8': '2rem',
} as const satisfies Record<SpacingKey, string>;

export const radii = {
  'radius-none': '0',
  'radius-sm': '0.125rem',
  'radius-md': '0.375rem',
  'radius-lg': '0.5rem',
  'radius-full': '9999px',
} as const satisfies Record<RadiusKey, string>;
