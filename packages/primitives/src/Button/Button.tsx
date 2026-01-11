import { forwardRef, type ReactNode } from 'react';
import type { AllowedButtonBehavioralProps } from '../types';

export interface ButtonProps extends AllowedButtonBehavioralProps {
  variant?: string;
  children?: ReactNode;
}

/**
 * Style-locked Button primitive.
 * Accepts only behavioral props and variant - NO className, style, or id.
 * Styling is controlled entirely through the variant prop and extracted tokens.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, children, ...behavioralProps },
  ref
) {
  return (
    <button ref={ref} data-variant={variant} {...behavioralProps}>
      {children}
    </button>
  );
});
