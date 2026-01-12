import { forwardRef, type ReactNode } from 'react';
import type { ButtonVariant } from '@extracted/types';
import type { AllowedButtonBehavioralProps } from '../types/allowed-props';

export interface ButtonProps extends AllowedButtonBehavioralProps {
  variant: ButtonVariant;
  children?: ReactNode;
}

/**
 * Style-locked Button primitive.
 * Accepts only behavioral props and variant - NO className, style, or id.
 * Styling is controlled entirely through the variant prop and extracted tokens.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, children, type = 'button', ...behavioralProps },
  ref
) {
  return (
    <button ref={ref} data-variant={variant} type={type} {...behavioralProps}>
      {children}
    </button>
  );
});
