'use client';

import { useState } from 'react';
import type { VariantReview, VariantReviewStatus } from '@extracted/types';
import { OriginalPreviewFallback } from './original-preview';
import { VariantRenderer } from './variant-renderer';
import { Check, X, HelpCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface VariantComparisonProps {
  review: VariantReview;
  sourceUrl: string;
  screenshotUrl?: string | undefined;
  onStatusChange?:
    | ((variantId: string, status: VariantReviewStatus, comment?: string) => void)
    | undefined;
}

/**
 * Side-by-side comparison of original component and rendered variant
 */
export function VariantComparison({
  review,
  sourceUrl,
  screenshotUrl,
  onStatusChange,
}: VariantComparisonProps) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState(review.reviewComment ?? '');

  const handleStatusChange = (status: VariantReviewStatus) => {
    onStatusChange?.(review.variantId, status, comment || undefined);
  };

  const statusColors: Record<VariantReviewStatus, string> = {
    pending: 'bg-gray-100 text-gray-600 border-gray-200',
    accepted: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    dne: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className={`rounded-lg border-2 ${statusColors[review.status]} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white/50 px-4 py-3 dark:bg-gray-800/50">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide opacity-60">
            {review.componentType}
          </span>
          <h3 className="font-semibold">{review.variantName}</h3>
        </div>
        <div className="flex items-center gap-2">
          {review.matchScore !== undefined && (
            <span className="text-xs opacity-60">{Math.round(review.matchScore * 100)}% match</span>
          )}
          <StatusBadge status={review.status} />
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid gap-4 p-4 md:grid-cols-2">
        {/* Original */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Original</h4>
          <OriginalPreviewFallback
            url={sourceUrl}
            screenshotUrl={screenshotUrl}
            boundingBox={review.originalBoundingBox}
            height={200}
          />
        </div>

        {/* Rendered */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Extracted</h4>
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <VariantRenderer componentType={review.componentType} spec={review.extractedSpec} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t bg-white/50 px-4 py-3 dark:bg-gray-800/50">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleStatusChange('accepted')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              review.status === 'accepted'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <Check className="h-4 w-4" />
            Accept
          </button>

          <button
            onClick={() => handleStatusChange('failed')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              review.status === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <X className="h-4 w-4" />
            Reject
          </button>

          <button
            onClick={() => handleStatusChange('dne')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              review.status === 'dne'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Not a Variant
          </button>

          <button
            onClick={() => setShowComment(!showComment)}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <MessageSquare className="h-4 w-4" />
            Comment
            {showComment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Comment input */}
        {showComment && (
          <div className="mt-3">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment to help improve extraction on retry..."
              className="w-full rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              rows={2}
            />
            <p className="mt-1 text-xs text-gray-500">
              This comment will be passed to the AI on retry extraction.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VariantReviewStatus }) {
  const styles: Record<VariantReviewStatus, string> = {
    pending: 'bg-gray-200 text-gray-700',
    accepted: 'bg-green-200 text-green-800',
    failed: 'bg-red-200 text-red-800',
    dne: 'bg-amber-200 text-amber-800',
  };

  const labels: Record<VariantReviewStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    failed: 'Failed',
    dne: 'DNE',
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

interface VariantComparisonListProps {
  reviews: VariantReview[];
  sourceUrl: string;
  screenshotUrl?: string | undefined;
  onStatusChange?:
    | ((variantId: string, status: VariantReviewStatus, comment?: string) => void)
    | undefined;
}

/**
 * List of variant comparisons grouped by component type
 */
export function VariantComparisonList({
  reviews,
  sourceUrl,
  screenshotUrl,
  onStatusChange,
}: VariantComparisonListProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(['button', 'card', 'input', 'text'])
  );

  const groupedReviews = reviews.reduce<Record<string, VariantReview[]>>((acc, review) => {
    const type = review.componentType;
    const existing = acc[type] ?? [];
    return { ...acc, [type]: [...existing, review] };
  }, {});

  const toggleType = (type: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const componentTypes = Object.keys(groupedReviews);

  if (componentTypes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500">No variants to review</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {componentTypes.map(type => (
        <div key={type} className="rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Accordion Header */}
          <button
            onClick={() => toggleType(type)}
            className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold capitalize">{type}</span>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium dark:bg-gray-700">
                {groupedReviews[type]?.length ?? 0} variants
              </span>
            </div>
            {expandedTypes.has(type) ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {/* Accordion Content */}
          {expandedTypes.has(type) && (
            <div className="space-y-4 p-4">
              {(groupedReviews[type] ?? []).map(review => (
                <VariantComparison
                  key={review.variantId}
                  review={review}
                  sourceUrl={sourceUrl}
                  screenshotUrl={screenshotUrl}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
