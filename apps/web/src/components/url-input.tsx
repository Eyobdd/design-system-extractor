'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import { normalizeUrl, isValidUrlInput } from '@/lib/url-utils';

interface UrlInputProps {
  onSubmit?: (url: string) => Promise<void>;
}

export function UrlInput({ onSubmit }: UrlInputProps) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedUrl = url.trim();

      if (!trimmedUrl) {
        setError('Please enter a URL');
        return;
      }

      if (!isValidUrlInput(trimmedUrl)) {
        setError('Please enter a valid URL (e.g., example.com)');
        return;
      }

      // Normalize the URL (add https:// if missing)
      const normalizedUrl = normalizeUrl(trimmedUrl);

      setIsLoading(true);

      try {
        if (onSubmit) {
          await onSubmit(normalizedUrl);
        } else {
          const response = await fetch('/api/extract/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: normalizedUrl }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to start extraction');
          }

          const { checkpointId } = await response.json();
          router.push(`/extract/${checkpointId}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [url, onSubmit, router]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={url}
          onChange={e => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="https://example.com"
          disabled={isLoading}
          className={`w-full rounded-xl border-2 bg-white px-6 py-4 pr-32 text-lg shadow-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-900 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700'
          } ${isLoading ? 'cursor-not-allowed opacity-60' : ''}`}
          aria-label="Website URL"
          aria-invalid={!!error}
          aria-describedby={error ? 'url-error' : undefined}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
          ) : (
            <span className="flex items-center gap-2">
              Extract <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </button>
      </div>
      {error && (
        <p id="url-error" className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
