'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, AlertCircle, CheckCircle2, Eye, Code } from 'lucide-react';
import { ProgressBar } from '@/components/progress-bar';
import { useExtractionStatus } from '@/hooks/use-extraction-status';
import { VariantComparisonList } from '@/components/variant-comparison';
import type { VariantReview, VariantReviewStatus } from '@extracted/types';

export default function ExtractPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data, error, isLoading } = useExtractionStatus(id);
  const [viewMode, setViewMode] = useState<'comparison' | 'tokens'>('comparison');
  const [variantReviews, setVariantReviews] = useState<VariantReview[]>([]);

  const handleStatusChange = useCallback(
    (variantId: string, status: VariantReviewStatus, comment?: string) => {
      setVariantReviews(prev =>
        prev.map(
          (review): VariantReview =>
            review.variantId === variantId
              ? {
                  ...review,
                  status,
                  reviewComment: comment ?? review.reviewComment,
                  reviewedAt: new Date(),
                }
              : review
        )
      );
    },
    []
  );

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold">Error</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data && isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading extraction status...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h1 className="mb-2 text-2xl font-bold">Extraction Not Found</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          The extraction you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  const isComplete = data.status === 'complete';
  const isFailed = data.status === 'failed';

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold">
              {isComplete
                ? 'Extraction Complete'
                : isFailed
                  ? 'Extraction Failed'
                  : 'Extracting Design System'}
            </h1>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              {data.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <ProgressBar progress={data.progress} status={data.status} className="mb-8" />

          {isFailed && data.error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">Error Details</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{data.error}</p>
                </div>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-200">
                    Design system extracted successfully!
                  </h3>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    View the extracted tokens and components below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mt-6">
              {/* View Mode Toggle */}
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'comparison'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Visual Comparison
                </button>
                <button
                  onClick={() => setViewMode('tokens')}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'tokens'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  <Code className="h-4 w-4" />
                  Raw Tokens
                </button>
              </div>

              {/* Comparison View */}
              {viewMode === 'comparison' && (
                <VariantComparisonList
                  reviews={variantReviews}
                  sourceUrl={data.url}
                  onStatusChange={handleStatusChange}
                />
              )}

              {/* Tokens View */}
              {viewMode === 'tokens' && data.extractedTokens && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold">Extracted Tokens</h2>
                  <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-sm dark:bg-gray-800">
                    {JSON.stringify(data.extractedTokens, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {isComplete && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => router.push(`/design-system/${id}`)}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                View Design System
              </button>
              <Link
                href="/"
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Extract Another
              </Link>
            </div>
          )}

          {isFailed && (
            <div className="mt-8 flex gap-4">
              <Link
                href="/"
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Try Again
              </Link>
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Checkpoint ID</dt>
                <dd className="font-mono text-gray-900 dark:text-gray-100">{data.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Started</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {new Date(data.startedAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Last Updated</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {new Date(data.updatedAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="text-gray-900 dark:text-gray-100 capitalize">{data.status}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
