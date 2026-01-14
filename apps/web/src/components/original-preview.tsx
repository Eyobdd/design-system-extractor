'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { BoundingBox } from '@extracted/types';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface OriginalPreviewProps {
  /** URL of the page to display */
  url: string;
  /** Bounding box of the component to highlight */
  boundingBox?: BoundingBox;
  /** Optional class name for styling */
  className?: string;
  /** Height of the preview container */
  height?: number;
}

export function OriginalPreview({
  url,
  boundingBox,
  className = '',
  height = 400,
}: OriginalPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);

    // Try to scroll to the component if we have a bounding box
    if (boundingBox && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.scrollTo({
          top: Math.max(0, boundingBox.y - 50),
          left: Math.max(0, boundingBox.x - 50),
          behavior: 'smooth',
        });
      } catch {
        // Cross-origin restriction - expected for most external sites
        setIframeBlocked(true);
      }
    }
  }, [boundingBox]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load page preview');
  }, []);

  useEffect(() => {
    // Reset state when URL changes
    setIsLoading(true);
    setError(null);
    setIframeBlocked(false);
  }, [url]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 ${className}`}
      style={{ height }}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading preview...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Cross-origin notice */}
      {iframeBlocked && !error && (
        <div className="absolute left-2 top-2 z-20 rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          Cross-origin restrictions apply
        </div>
      )}

      {/* Component highlight overlay */}
      {boundingBox && !isLoading && !error && (
        <div
          className="pointer-events-none absolute z-10 border-2 border-blue-500 bg-blue-500/10"
          style={{
            left: boundingBox.x,
            top: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
          }}
        >
          <div className="absolute -top-6 left-0 rounded bg-blue-500 px-2 py-0.5 text-xs text-white">
            Original Component
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={url}
        title="Original page preview"
        className="h-full w-full border-0"
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

interface OriginalPreviewFallbackProps {
  url: string;
  screenshotUrl?: string | undefined;
  boundingBox?: BoundingBox | undefined;
  className?: string | undefined;
  height?: number | undefined;
}

/**
 * Fallback component that shows a screenshot when iframe is blocked
 */
export function OriginalPreviewFallback({
  url,
  screenshotUrl,
  boundingBox,
  className = '',
  height = 400,
}: OriginalPreviewFallbackProps) {
  if (!screenshotUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-sm text-gray-500">No preview available</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Open in new tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 ${className}`}
      style={{ height }}
    >
      {/* Screenshot image */}
      <img
        src={screenshotUrl}
        alt="Page screenshot"
        className="h-full w-full object-cover object-top"
      />

      {/* Component highlight overlay */}
      {boundingBox && (
        <div
          className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/10"
          style={{
            left: boundingBox.x,
            top: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
          }}
        >
          <div className="absolute -top-6 left-0 rounded bg-blue-500 px-2 py-0.5 text-xs text-white">
            Original Component
          </div>
        </div>
      )}

      {/* Link to original */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
      >
        Open original
      </a>
    </div>
  );
}
