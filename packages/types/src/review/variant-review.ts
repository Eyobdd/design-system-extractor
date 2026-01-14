import type { PrimitiveComponentType } from '../primitives/component-type';
import type { BoundingBox } from '../geometry/bounding-box';
import type {
  ButtonVariantSpec,
  CardVariantSpec,
  InputVariantSpec,
  TextVariantSpec,
} from '../components';

/**
 * Status of a variant review
 * - pending: Not yet reviewed
 * - accepted: User confirmed the extraction is correct
 * - failed: User marked as incorrect extraction
 * - dne: "Does not exist" - detected component that isn't actually a variant
 */
export type VariantReviewStatus = 'pending' | 'accepted' | 'failed' | 'dne';

/**
 * Union type for all variant specs
 */
export type AnyVariantSpec =
  | ButtonVariantSpec
  | CardVariantSpec
  | InputVariantSpec
  | TextVariantSpec;

/**
 * Represents a single variant that needs review
 */
export interface VariantReview {
  /** Type of primitive component */
  componentType: PrimitiveComponentType;

  /** Unique identifier for this variant */
  variantId: string;

  /** Human-readable name for the variant (e.g., "Primary Button") */
  variantName: string;

  /** Current review status */
  status: VariantReviewStatus;

  /** Extracted style specification */
  extractedSpec: AnyVariantSpec;

  /** CSS selector used to find the original element */
  originalSelector: string;

  /** Position and size of original element on page */
  originalBoundingBox: BoundingBox;

  /** Confidence score from extraction (0-1) */
  matchScore?: number;

  /** When this variant was reviewed */
  reviewedAt?: Date;

  /** User feedback to pass to LLM on retry extraction */
  reviewComment?: string;
}

/**
 * Summary of review progress
 */
export interface VariantReviewSummary {
  total: number;
  pending: number;
  accepted: number;
  failed: number;
  dne: number;
}

/**
 * Calculates a summary of variant review statuses
 */
export function getVariantReviewSummary(reviews: VariantReview[]): VariantReviewSummary {
  return reviews.reduce(
    (acc, review) => {
      acc.total++;
      acc[review.status]++;
      return acc;
    },
    { total: 0, pending: 0, accepted: 0, failed: 0, dne: 0 }
  );
}

/**
 * Gets variants that need retry extraction
 */
export function getFailedVariants(reviews: VariantReview[]): VariantReview[] {
  return reviews.filter(r => r.status === 'failed');
}

/**
 * Gets variants grouped by component type
 */
export function groupVariantsByType(
  reviews: VariantReview[]
): Record<PrimitiveComponentType, VariantReview[]> {
  return reviews.reduce(
    (acc, review) => {
      acc[review.componentType].push(review);
      return acc;
    },
    {
      button: [],
      card: [],
      input: [],
      text: [],
    } as Record<PrimitiveComponentType, VariantReview[]>
  );
}
