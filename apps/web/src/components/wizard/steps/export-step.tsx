'use client';

import { useState, useEffect } from 'react';
import { Download, Package, RefreshCw, AlertCircle } from 'lucide-react';
import { useWizard } from '@/hooks/use-wizard';

function getDefaultPackageName(sourceUrl: string): string {
  try {
    const domain = new URL(sourceUrl).hostname.replace('www.', '').replace(/\./g, '-');
    return `@${domain}/extracted-design-system`;
  } catch {
    return '@my-org/extracted-design-system';
  }
}

function validatePackageName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Package name is required' };
  }
  if (!name.startsWith('@')) {
    return { valid: false, error: 'Package name must start with @ (npm scoped package format)' };
  }
  if (!/^@[a-z0-9-]+\/[a-z0-9-_]+$/.test(name)) {
    return {
      valid: false,
      error: 'Package name must be a valid npm scope (e.g., @org/package-name)',
    };
  }
  return { valid: true };
}

export function ExportStep() {
  const { state, resetWizard } = useWizard();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [packageName, setPackageName] = useState(() => getDefaultPackageName(state.sourceUrl));
  const [packageNameError, setPackageNameError] = useState<string | null>(null);

  useEffect(() => {
    const validation = validatePackageName(packageName);
    setPackageNameError(validation.valid ? null : validation.error || null);
  }, [packageName]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch(
        `/api/export?checkpointId=${state.checkpointId}&format=typescript`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const filename =
        response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ||
        'extracted-design-system.zip';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const approvedCount =
    state.variants.buttons.filter(v => v.status === 'approved').length +
    state.variants.text.filter(v => v.status === 'approved').length +
    state.variants.cards.filter(v => v.status === 'approved').length;

  const tokenCount =
    Object.keys(state.tokens.colors).length +
    Object.keys(state.tokens.fontFamilies).length +
    Object.keys(state.tokens.fontSizes).length +
    Object.keys(state.tokens.fontWeights).length +
    Object.keys(state.tokens.lineHeights).length +
    Object.keys(state.tokens.spacing).length +
    Object.keys(state.tokens.radii).length +
    Object.keys(state.tokens.shadows).length;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
        Export Package
      </h2>
      <p className="mb-8" style={{ color: 'var(--muted)' }}>
        Your design system is ready to download!
      </p>

      {/* Package Name Input */}
      <div className="mb-8 space-y-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Package Name
        </label>
        <input
          type="text"
          value={packageName}
          onChange={e => setPackageName(e.target.value)}
          className="w-full rounded-lg px-4 py-3 text-sm outline-none"
          style={{
            backgroundColor: 'var(--background)',
            border: `1px solid ${packageNameError ? '#ef4444' : 'var(--border)'}`,
            color: 'var(--foreground)',
          }}
          placeholder="@org/package-name"
        />
        {packageNameError ? (
          <p className="flex items-center gap-1 text-xs" style={{ color: '#ef4444' }}>
            <AlertCircle className="h-3 w-3" />
            {packageNameError}
          </p>
        ) : (
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Default: {getDefaultPackageName(state.sourceUrl)}
          </p>
        )}
      </div>

      <div
        className="mb-8 rounded-xl p-8 text-center"
        style={{ border: '2px dashed var(--border)', backgroundColor: 'var(--background)' }}
      >
        <Package className="mx-auto mb-4 h-16 w-16" style={{ color: 'var(--accent)' }} />
        <h3 className="mb-1 text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
          {packageName.split('/')[1] || 'extracted-design-system'}.zip
        </h3>
        <p className="mb-2 text-sm" style={{ color: 'var(--muted)' }}>
          {tokenCount} tokens • {approvedCount} variants
        </p>
        <p className="mb-6 text-xs" style={{ color: 'var(--muted)' }}>
          Estimated size: ~24 KB
        </p>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || !!packageNameError}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {isExporting ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Download Package
            </>
          )}
        </button>

        {exportError && (
          <p className="mt-4 text-sm" style={{ color: '#ef4444' }}>
            {exportError}
          </p>
        )}
      </div>

      <div className="mb-8 rounded-lg p-6" style={{ border: '1px solid var(--border)' }}>
        <h3 className="mb-4 text-lg font-medium" style={{ color: 'var(--foreground)' }}>
          Installation
        </h3>

        <ol
          className="mb-6 list-inside list-decimal space-y-2 text-sm"
          style={{ color: 'var(--muted)' }}
        >
          <li>Extract the zip to your project</li>
          <li>Import and use the components:</li>
        </ol>

        <pre
          className="overflow-x-auto rounded-lg p-4 text-sm"
          style={{ backgroundColor: '#1a1a1a', color: '#e5e5e5' }}
        >
          <code>{`import { Button, Text, Card } from '${packageName}';

<Button variant="primary">Click me</Button>`}</code>
        </pre>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={resetWizard}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RefreshCw className="h-4 w-4" />
          Start New Extraction
        </button>
      </div>
    </div>
  );
}
