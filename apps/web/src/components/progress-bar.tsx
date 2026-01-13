'use client';

interface ProgressBarProps {
  progress: number;
  status: string;
  className?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Starting extraction...',
  screenshot: 'Capturing screenshots...',
  vision: 'Analyzing components...',
  extraction: 'Extracting design tokens...',
  comparison: 'Comparing results...',
  complete: 'Extraction complete!',
  failed: 'Extraction failed',
};

export function ProgressBar({ progress, status, className = '' }: ProgressBarProps) {
  const label = statusLabels[status] ?? 'Processing...';
  const isComplete = status === 'complete';
  const isFailed = status === 'failed';

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{progress}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isFailed ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Extraction progress: ${progress}%`}
        />
      </div>
    </div>
  );
}
