'use client';

interface TypographyDisplayProps {
  typography: {
    fontFamily?: string;
    fontSize?: Record<string, string>;
    fontWeight?: Record<string, string | number>;
    lineHeight?: Record<string, string>;
  };
  title?: string;
}

export function TypographyDisplay({ typography, title = 'Typography' }: TypographyDisplayProps) {
  const hasContent =
    typography.fontFamily ||
    (typography.fontSize && Object.keys(typography.fontSize).length > 0) ||
    (typography.fontWeight && Object.keys(typography.fontWeight).length > 0) ||
    (typography.lineHeight && Object.keys(typography.lineHeight).length > 0);

  if (!hasContent) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">No typography extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>

      {typography.fontFamily && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Font Family</h3>
          <p
            className="text-xl text-gray-900 dark:text-gray-100"
            style={{ fontFamily: typography.fontFamily }}
          >
            {typography.fontFamily}
          </p>
          <p
            className="mt-2 text-gray-600 dark:text-gray-400"
            style={{ fontFamily: typography.fontFamily }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      )}

      {typography.fontSize && Object.keys(typography.fontSize).length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">Font Sizes</h3>
          <div className="space-y-3">
            {Object.entries(typography.fontSize).map(([name, size]) => (
              <div key={name} className="flex items-baseline gap-4">
                <span className="w-16 flex-shrink-0 text-sm text-gray-600 dark:text-gray-400">
                  {name}
                </span>
                <span
                  className="text-gray-900 dark:text-gray-100"
                  style={{ fontSize: size, fontFamily: typography.fontFamily }}
                >
                  Aa
                </span>
                <span className="text-sm text-gray-500">{size}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {typography.fontWeight && Object.keys(typography.fontWeight).length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
            Font Weights
          </h3>
          <div className="space-y-3">
            {Object.entries(typography.fontWeight).map(([name, weight]) => (
              <div key={name} className="flex items-baseline gap-4">
                <span className="w-16 flex-shrink-0 text-sm text-gray-600 dark:text-gray-400">
                  {name}
                </span>
                <span
                  className="text-gray-900 dark:text-gray-100"
                  style={{
                    fontWeight:
                      typeof weight === 'number' ? weight : parseInt(weight as string, 10),
                    fontFamily: typography.fontFamily,
                  }}
                >
                  The quick brown fox
                </span>
                <span className="text-sm text-gray-500">{weight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {typography.lineHeight && Object.keys(typography.lineHeight).length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
            Line Heights
          </h3>
          <div className="space-y-4">
            {Object.entries(typography.lineHeight).map(([name, height]) => (
              <div key={name} className="flex items-start gap-4">
                <span className="w-16 flex-shrink-0 pt-1 text-sm text-gray-600 dark:text-gray-400">
                  {name}
                </span>
                <div
                  className="flex-1 rounded bg-gray-100 p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  style={{ lineHeight: height, fontFamily: typography.fontFamily }}
                >
                  The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor
                  jugs.
                </div>
                <span className="pt-1 text-sm text-gray-500">{height}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
