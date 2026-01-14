/**
 * Source of truth for primitive component types
 * All primitives must conform to these types
 */
export type PrimitiveComponentType = 'button' | 'card' | 'input' | 'text';

export const PRIMITIVE_COMPONENT_TYPES: readonly PrimitiveComponentType[] = [
  'button',
  'card',
  'input',
  'text',
] as const;

/**
 * Type guard to check if a string is a valid PrimitiveComponentType
 */
export function isPrimitiveComponentType(value: string): value is PrimitiveComponentType {
  return PRIMITIVE_COMPONENT_TYPES.includes(value as PrimitiveComponentType);
}
