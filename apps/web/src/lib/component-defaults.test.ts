import { describe, it, expect } from 'vitest';
import {
  BUTTON_DEFAULTS,
  TEXT_DEFAULTS,
  CARD_DEFAULTS,
  DEFAULT_TOKEN_VALUE,
  DEFAULT_DISPLAY_TEXT,
  isValidTokenName,
  getComponentDefaults,
  resolveTokenValue,
} from './component-defaults';

describe('Component Default Constants', () => {
  describe('BUTTON_DEFAULTS', () => {
    it('has required button properties', () => {
      expect(BUTTON_DEFAULTS).toHaveProperty('background');
      expect(BUTTON_DEFAULTS).toHaveProperty('color');
      expect(BUTTON_DEFAULTS).toHaveProperty('borderRadius');
      expect(BUTTON_DEFAULTS).toHaveProperty('fontSize');
      expect(BUTTON_DEFAULTS).toHaveProperty('fontWeight');
    });

    it('has valid color values', () => {
      expect(BUTTON_DEFAULTS.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(BUTTON_DEFAULTS.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('TEXT_DEFAULTS', () => {
    it('has required text properties', () => {
      expect(TEXT_DEFAULTS).toHaveProperty('color');
      expect(TEXT_DEFAULTS).toHaveProperty('fontSize');
      expect(TEXT_DEFAULTS).toHaveProperty('fontWeight');
      expect(TEXT_DEFAULTS).toHaveProperty('lineHeight');
    });
  });

  describe('CARD_DEFAULTS', () => {
    it('has required card properties', () => {
      expect(CARD_DEFAULTS).toHaveProperty('background');
      expect(CARD_DEFAULTS).toHaveProperty('borderColor');
      expect(CARD_DEFAULTS).toHaveProperty('borderRadius');
      expect(CARD_DEFAULTS).toHaveProperty('shadow');
    });
  });

  describe('DEFAULT_TOKEN_VALUE', () => {
    it('is underscore prefixed for internal use', () => {
      expect(DEFAULT_TOKEN_VALUE).toBe('_default');
      expect(DEFAULT_TOKEN_VALUE.startsWith('_')).toBe(true);
    });
  });

  describe('DEFAULT_DISPLAY_TEXT', () => {
    it('is a dash for UI display', () => {
      expect(DEFAULT_DISPLAY_TEXT).toBe('—');
    });
  });
});

describe('isValidTokenName', () => {
  describe('valid token names', () => {
    it('accepts simple alphabetic names', () => {
      expect(isValidTokenName('primary')).toEqual({ valid: true });
      expect(isValidTokenName('secondary')).toEqual({ valid: true });
    });

    it('accepts names with numbers', () => {
      expect(isValidTokenName('color1')).toEqual({ valid: true });
      expect(isValidTokenName('spacing100')).toEqual({ valid: true });
    });

    it('accepts camelCase names', () => {
      expect(isValidTokenName('primaryBlue')).toEqual({ valid: true });
      expect(isValidTokenName('darkGray500')).toEqual({ valid: true });
    });

    it('accepts PascalCase names', () => {
      expect(isValidTokenName('Primary')).toEqual({ valid: true });
      expect(isValidTokenName('DarkBlue')).toEqual({ valid: true });
    });
  });

  describe('invalid token names', () => {
    it('rejects empty names', () => {
      const result = isValidTokenName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token name is required');
    });

    it('rejects whitespace-only names', () => {
      const result = isValidTokenName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token name is required');
    });

    it('rejects names starting with underscore', () => {
      const result = isValidTokenName('_internal');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token names cannot start with underscore');
    });

    it('rejects reserved name dash', () => {
      const result = isValidTokenName('—');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This name is reserved');
    });

    it('rejects reserved name none (case insensitive)', () => {
      expect(isValidTokenName('none').valid).toBe(false);
      expect(isValidTokenName('None').valid).toBe(false);
      expect(isValidTokenName('NONE').valid).toBe(false);
    });

    it('rejects names starting with numbers', () => {
      const result = isValidTokenName('1primary');
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Token names must start with a letter and contain only letters and numbers'
      );
    });

    it('rejects names with special characters', () => {
      expect(isValidTokenName('primary-blue').valid).toBe(false);
      expect(isValidTokenName('primary_blue').valid).toBe(false);
      expect(isValidTokenName('primary.blue').valid).toBe(false);
      expect(isValidTokenName('primary blue').valid).toBe(false);
    });

    it('rejects names with hyphens', () => {
      const result = isValidTokenName('dark-blue');
      expect(result.valid).toBe(false);
    });
  });
});

describe('getComponentDefaults', () => {
  it('returns BUTTON_DEFAULTS for buttons', () => {
    expect(getComponentDefaults('buttons')).toBe(BUTTON_DEFAULTS);
  });

  it('returns TEXT_DEFAULTS for text', () => {
    expect(getComponentDefaults('text')).toBe(TEXT_DEFAULTS);
  });

  it('returns CARD_DEFAULTS for cards', () => {
    expect(getComponentDefaults('cards')).toBe(CARD_DEFAULTS);
  });
});

describe('resolveTokenValue', () => {
  const mockTokens = {
    primary: '#3b82f6',
    secondary: { value: '#6b7280' },
  };

  describe('with _default token key', () => {
    it('returns the default value', () => {
      expect(resolveTokenValue('_default', mockTokens, '#ffffff')).toBe('#ffffff');
    });
  });

  describe('with existing token key', () => {
    it('returns string token value directly', () => {
      expect(resolveTokenValue('primary', mockTokens, '#ffffff')).toBe('#3b82f6');
    });

    it('extracts value from object token', () => {
      expect(resolveTokenValue('secondary', mockTokens, '#ffffff')).toBe('#6b7280');
    });
  });

  describe('with non-existent token key', () => {
    it('returns the default value', () => {
      expect(resolveTokenValue('nonexistent', mockTokens, '#ffffff')).toBe('#ffffff');
    });
  });

  describe('edge cases', () => {
    it('handles empty tokens object', () => {
      expect(resolveTokenValue('primary', {}, '#ffffff')).toBe('#ffffff');
    });

    it('handles empty string default', () => {
      expect(resolveTokenValue('_default', mockTokens, '')).toBe('');
    });
  });
});
