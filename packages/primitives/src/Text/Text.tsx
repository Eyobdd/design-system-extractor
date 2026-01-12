import { forwardRef, type ReactNode } from 'react';
import type { TextVariant } from '@extracted/types';
import type { AllowedSpanBehavioralProps } from '../types/allowed-props';

export interface TextProps extends AllowedSpanBehavioralProps {
  variant: TextVariant;
  children?: ReactNode;
}

/**
 * Style-locked Text primitive.
 * Accepts only behavioral props and variant - NO className, style, or id.
 * Styling is controlled entirely through the variant prop and extracted tokens.
 */
export const Text = forwardRef<HTMLSpanElement, TextProps>(function Text(
  { variant, children, ...behavioralProps },
  ref
) {
  return (
    <span ref={ref} data-variant={variant} {...behavioralProps}>
      {children}
    </span>
  );
});
