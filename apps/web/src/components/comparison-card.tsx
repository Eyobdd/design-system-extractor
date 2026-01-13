'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export interface ComparisonData {
  componentId: string;
  ssimScore: number;
  colorScore: number;
  combinedScore: number;
  passed: boolean;
  originalImageUrl?: string;
  generatedImageUrl?: string;
}

interface ComparisonCardProps {
  comparison: ComparisonData;
  onFeedback?: (componentId: string, feedback: 'approve' | 'reject') => void;
}

function ScoreBar({
  label,
  score,
  threshold = 0.85,
}: {
  label: string;
  score: number;
  threshold?: number;
}) {
  const percentage = Math.round(score * 100);
  const isPassing = score >= threshold;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`font-medium ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
          {percentage}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${isPassing ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function ComparisonCard({ comparison, onFeedback }: ComparisonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        comparison.passed
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {comparison.passed ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          )}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {comparison.componentId}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Combined score: {Math.round(comparison.combinedScore * 100)}%
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="space-y-3">
            <ScoreBar label="Structural Similarity (SSIM)" score={comparison.ssimScore} />
            <ScoreBar label="Color Accuracy" score={comparison.colorScore} />
            <ScoreBar label="Combined Score" score={comparison.combinedScore} />
          </div>

          {(comparison.originalImageUrl || comparison.generatedImageUrl) && (
            <div className="grid grid-cols-2 gap-4">
              {comparison.originalImageUrl && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Original
                  </p>
                  <img
                    src={comparison.originalImageUrl}
                    alt={`Original ${comparison.componentId}`}
                    className="rounded border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
              {comparison.generatedImageUrl && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Generated
                  </p>
                  <img
                    src={comparison.generatedImageUrl}
                    alt={`Generated ${comparison.componentId}`}
                    className="rounded border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>
          )}

          {onFeedback && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onFeedback(comparison.componentId, 'approve')}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => onFeedback(comparison.componentId, 'reject')}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
