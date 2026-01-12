import { forwardRef, type ReactNode } from 'react';
import type { CardVariant } from '@extracted/types';
import type { AllowedDivBehavioralProps } from '../types/allowed-props';

export interface CardProps extends AllowedDivBehavioralProps {
  variant: CardVariant;
  children?: ReactNode;
}

/**
 * Style-locked Card primitive.
 * Accepts only behavioral props and variant - NO className, style, or id.
 * Styling is controlled entirely through the variant prop and extracted tokens.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant, children, ...behavioralProps },
  ref
) {
  return (
    <div ref={ref} data-variant={variant} {...behavioralProps}>
      {children}
    </div>
  );
});
