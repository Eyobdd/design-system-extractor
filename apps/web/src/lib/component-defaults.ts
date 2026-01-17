/**
 * Component default styles - used when a variant property is set to '_default'
 * These are sensible defaults that components fall back to when no token is specified.
 */

export const BUTTON_DEFAULTS = {
  background: '#3b82f6',
  color: '#ffffff',
  borderColor: 'transparent',
  borderWidth: '0px',
  borderRadius: '8px',
  paddingTop: '8px',
  paddingRight: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
  fontSize: '16px',
  fontWeight: '500',
  fontFamily: 'system-ui, sans-serif',
  shadow: 'none',
} as const;

export const TEXT_DEFAULTS = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '400',
  fontFamily: 'system-ui, sans-serif',
  lineHeight: '1.5',
} as const;

export const CARD_DEFAULTS = {
  background: '#ffffff',
  borderColor: '#e5e5e5',
  borderWidth: '1px',
  borderRadius: '12px',
  paddingTop: '16px',
  paddingRight: '16px',
  paddingBottom: '16px',
  paddingLeft: '16px',
  shadow: '0 1px 3px rgba(0,0,0,0.1)',
} as const;

export type ComponentDefaults =
  | typeof BUTTON_DEFAULTS
  | typeof TEXT_DEFAULTS
  | typeof CARD_DEFAULTS;

/**
 * Reserved token value that means "use the component's default"
 * This is an internal value - users see "—" or "None" in the UI
 */
export const DEFAULT_TOKEN_VALUE = '_default';

/**
 * Display text shown to users for the default option
 */
export const DEFAULT_DISPLAY_TEXT = '—';

/**
 * Validates that a token name is allowed
 * Token names cannot start with underscore (reserved for internal use)
 */
export function isValidTokenName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Token name is required' };
  }

  if (name.startsWith('_')) {
    return { valid: false, error: 'Token names cannot start with underscore' };
  }

  if (name === '—' || name.toLowerCase() === 'none') {
    return { valid: false, error: 'This name is reserved' };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
    return {
      valid: false,
      error: 'Token names must start with a letter and contain only letters and numbers',
    };
  }

  return { valid: true };
}

/**
 * Gets the defaults object for a component type
 */
export function getComponentDefaults(componentType: 'buttons' | 'text' | 'cards') {
  switch (componentType) {
    case 'buttons':
      return BUTTON_DEFAULTS;
    case 'text':
      return TEXT_DEFAULTS;
    case 'cards':
      return CARD_DEFAULTS;
  }
}

/**
 * Resolves a token value, returning the default if the value is '_default'
 */
export function resolveTokenValue(
  tokenKey: string,
  tokens: Record<string, string | { value: string }>,
  defaultValue: string
): string {
  if (tokenKey === DEFAULT_TOKEN_VALUE) {
    return defaultValue;
  }

  const token = tokens[tokenKey];
  if (!token) {
    return defaultValue;
  }

  return typeof token === 'string' ? token : token.value;
}
