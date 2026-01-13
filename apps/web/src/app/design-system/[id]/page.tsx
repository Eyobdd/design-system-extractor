'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { useExtractionStatus } from '@/hooks/use-extraction-status';
import { DesignSystemView } from '@/components/design-system-view';
import { useState } from 'react';

type ExportFormat = 'json' | 'css' | 'scss' | 'tailwind';

export default function DesignSystemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params['id'] as string;
  const { data, isLoading, error } = useExtractionStatus(id);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export?checkpointId=${id}&format=${exportFormat}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const filename =
        response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
        `design-tokens.${exportFormat}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading design system...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  if (!data || data.status !== 'complete') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            {data ? 'Extraction not yet complete' : 'Design system not found'}
          </p>
          <button
            onClick={() => router.push(`/extract/${id}`)}
            className="mt-4 text-blue-600 hover:underline"
          >
            View extraction progress
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/extract/${id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to extraction
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as ExportFormat)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="json">JSON</option>
              <option value="css">CSS Variables</option>
              <option value="scss">SCSS Variables</option>
              <option value="tailwind">Tailwind Config</option>
            </select>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Design System</h1>

        <DesignSystemView
          tokens={{
            colors: data.extractedTokens?.['colors'] as Record<string, string>,
            typography: data.extractedTokens?.['typography'] as {
              fontFamily?: string;
              fontSize?: Record<string, string>;
              fontWeight?: Record<string, string | number>;
              lineHeight?: Record<string, string>;
            },
            spacing: data.extractedTokens?.['spacing'] as Record<string, string>,
          }}
          url={data.url}
        />
      </div>
    </main>
  );
}
