import type { SurfaceColorKey, TextColorKey, BorderColorKey } from '@extracted/types';

export const surfaceColors = {
  'surface-default': '#ffffff',
  'surface-elevated': '#f8fafc',
  'surface-muted': '#f1f5f9',
} as const satisfies Record<SurfaceColorKey, string>;

export const textColors = {
  'text-primary': '#0f172a',
  'text-secondary': '#475569',
  'text-muted': '#94a3b8',
  'text-on-primary': '#ffffff',
} as const satisfies Record<TextColorKey, string>;

export const borderColors = {
  'border-default': '#e2e8f0',
  'border-subtle': '#f1f5f9',
} as const satisfies Record<BorderColorKey, string>;
