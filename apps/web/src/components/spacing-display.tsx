'use client';

interface SpacingDisplayProps {
  spacing: Record<string, string>;
  title?: string;
}

export function SpacingDisplay({ spacing, title = 'Spacing' }: SpacingDisplayProps) {
  if (Object.keys(spacing).length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">No spacing extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div className="space-y-3">
          {Object.entries(spacing).map(([name, value]) => (
            <div key={name} className="flex items-center gap-4">
              <span className="w-12 flex-shrink-0 text-sm font-medium text-gray-600 dark:text-gray-400">
                {name}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="h-6 rounded bg-blue-500"
                  style={{ width: value }}
                  aria-label={`Spacing ${name}: ${value}`}
                />
                <span className="text-sm text-gray-500">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
