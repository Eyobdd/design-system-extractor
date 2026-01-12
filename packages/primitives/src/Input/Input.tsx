import { forwardRef } from 'react';
import type { InputVariant } from '@extracted/types';
import type { AllowedInputBehavioralProps } from '../types/allowed-props';

export interface InputProps extends AllowedInputBehavioralProps {
  variant: InputVariant;
}

/**
 * Style-locked Input primitive.
 * Accepts only behavioral props and variant - NO className, style, or id.
 * Styling is controlled entirely through the variant prop and extracted tokens.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant, ...behavioralProps },
  ref
) {
  return <input ref={ref} data-variant={variant} {...behavioralProps} />;
});
