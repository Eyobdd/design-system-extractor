import { describe, it, expect } from 'vitest';
import { surfaceColors } from '../src/primitives/colors';

describe('color tokens', () => {
  it('all surface colors are valid hex codes', () => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    Object.values(surfaceColors).forEach(color => {
      expect(color).toMatch(hexRegex);
    });
  });

  it('contains essential surface colors', () => {
    expect(surfaceColors).toHaveProperty('surface-default');
    expect(surfaceColors).toHaveProperty('surface-elevated');
  });
});
