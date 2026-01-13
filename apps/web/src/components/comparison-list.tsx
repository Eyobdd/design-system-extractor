'use client';

import { ComparisonCard, ComparisonData } from './comparison-card';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ComparisonListProps {
  comparisons: ComparisonData[];
  onFeedback?: (componentId: string, feedback: 'approve' | 'reject') => void;
}

export function ComparisonList({ comparisons, onFeedback }: ComparisonListProps) {
  const passingCount = comparisons.filter(c => c.passed).length;
  const failingCount = comparisons.length - passingCount;
  const overallPassRate = comparisons.length > 0 ? (passingCount / comparisons.length) * 100 : 0;

  if (comparisons.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">No comparisons available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">Comparison Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {comparisons.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Components</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold text-green-600">{passingCount}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Passing</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-3xl font-bold text-red-600">{failingCount}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failing</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Overall Pass Rate</span>
            <span className="font-medium">{Math.round(overallPassRate)}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${overallPassRate >= 80 ? 'bg-green-500' : overallPassRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${overallPassRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Component Details</h2>
        {comparisons.map(comparison => (
          <ComparisonCard
            key={comparison.componentId}
            comparison={comparison}
            {...(onFeedback && { onFeedback })}
          />
        ))}
      </div>
    </div>
  );
}
