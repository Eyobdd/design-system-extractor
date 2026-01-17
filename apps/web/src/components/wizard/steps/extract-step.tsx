'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { useWizard } from '@/hooks/use-wizard';
import { normalizeUrl, isValidUrlInput } from '@/lib/url-utils';
import { useExtractionStatus } from '@/hooks/use-extraction-status';
import type { ExtractedTokens, VariantsMap, TokenValue } from '@/lib/wizard-types';

const EXTRACTION_MESSAGES = [
  'Capturing screenshot...',
  'Extracting CSS variables...',
  'Scanning DOM...',
  'Clustering colors...',
  'Identifying variants...',
  'Generating previews...',
];

const AUTO_ADVANCE_DELAY = 1000; // 1 second delay after completion

export function ExtractStep() {
  const {
    state,
    setSourceUrl,
    startExtraction,
    updateExtractionProgress,
    completeExtraction,
    setExtractionError,
    nextStep,
  } = useWizard();

  const hasAutoAdvanced = useRef(false);

  const [urlInput, setUrlInput] = useState(state.sourceUrl);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [includeSubpages, setIncludeSubpages] = useState(false);

  const { data: extractionData } = useExtractionStatus(state.checkpointId, {
    enabled: state.extractionStatus === 'extracting' && !!state.checkpointId,
    pollingInterval: 1500,
  });

  useEffect(() => {
    if (!extractionData) return;

    updateExtractionProgress(extractionData.progress);

    if (extractionData.status === 'complete' && extractionData.extractedTokens) {
      const tokens = convertToWizardTokens(extractionData.extractedTokens);
      const variants = convertToWizardVariants(extractionData.extractedTokens);
      completeExtraction(extractionData.id, tokens, variants);
    } else if (extractionData.status === 'failed') {
      setExtractionError(extractionData.error || 'Extraction failed');
    }
  }, [extractionData, updateExtractionProgress, completeExtraction, setExtractionError]);

  // Auto-advance to Token Editor after extraction completes
  useEffect(() => {
    if (state.extractionStatus === 'complete' && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      const timer = setTimeout(() => {
        nextStep();
      }, AUTO_ADVANCE_DELAY);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.extractionStatus, nextStep]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      const trimmedUrl = urlInput.trim();

      if (!trimmedUrl) {
        setValidationError('Please enter a URL');
        return;
      }

      if (!isValidUrlInput(trimmedUrl)) {
        setValidationError('Please enter a valid URL (e.g., example.com)');
        return;
      }

      const normalizedUrl = normalizeUrl(trimmedUrl);
      setSourceUrl(normalizedUrl);
      startExtraction();

      try {
        const response = await fetch('/api/extract/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalizedUrl, includeSubpages }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to start extraction');
        }

        const { checkpointId } = await response.json();
        completeExtraction(checkpointId, state.tokens, state.variants);
        updateExtractionProgress(5);
      } catch (err) {
        setExtractionError(err instanceof Error ? err.message : 'An error occurred');
      }
    },
    [
      urlInput,
      includeSubpages,
      setSourceUrl,
      startExtraction,
      completeExtraction,
      updateExtractionProgress,
      setExtractionError,
      state.tokens,
      state.variants,
    ]
  );

  const isExtracting = state.extractionStatus === 'extracting';
  const isComplete = state.extractionStatus === 'complete';
  const hasError = state.extractionStatus === 'error';

  const getCurrentStep = () => {
    const progress = state.extractionProgress;
    if (progress < 10) return 0;
    if (progress < 25) return 1;
    if (progress < 45) return 2;
    if (progress < 65) return 3;
    if (progress < 85) return 4;
    return 5;
  };

  const currentMessage = EXTRACTION_MESSAGES[getCurrentStep()] || 'Processing...';

  return (
    <div className="mx-auto max-w-xl pt-12">
      <h1
        className="mb-4 text-center text-3xl font-semibold"
        style={{ color: 'var(--foreground)' }}
      >
        Design System Extractor Tool
      </h1>
      <p className="mb-8 text-center text-lg" style={{ color: 'var(--muted)' }}>
        Enter a website URL to extract its design system
      </p>

      <form onSubmit={handleSubmit}>
        {/* Rounded URL input with button inside */}
        <div
          className="relative flex items-center rounded-full px-6 py-3 transition-all"
          style={{
            border: `1.5px solid ${validationError || hasError ? '#ef4444' : 'var(--border)'}`,
            backgroundColor: 'var(--background)',
          }}
        >
          <input
            type="text"
            value={urlInput}
            onChange={e => {
              setUrlInput(e.target.value);
              setValidationError(null);
            }}
            placeholder="https://example.com"
            disabled={isExtracting}
            className="flex-1 bg-transparent text-base outline-none placeholder:font-light"
            style={{
              color: 'var(--foreground)',
              opacity: isExtracting ? 0.6 : 1,
            }}
            aria-label="Website URL"
            aria-invalid={!!validationError}
          />

          <button
            type="submit"
            disabled={isExtracting || isComplete || !urlInput.trim()}
            className="ml-3 flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)' }}
            aria-label="Extract"
          >
            {isExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : isComplete ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <ArrowRight className="h-4 w-4 text-white" />
            )}
          </button>
        </div>

        {validationError && (
          <p className="mt-3 text-center text-sm" style={{ color: '#ef4444' }}>
            {validationError}
          </p>
        )}

        {/* Subpages checkbox */}
        <label
          className="mt-6 flex items-center justify-center gap-2 text-sm"
          style={{ color: 'var(--muted)' }}
        >
          <input
            type="checkbox"
            checked={includeSubpages}
            onChange={e => setIncludeSubpages(e.target.checked)}
            disabled={isExtracting}
            className="h-4 w-4 rounded"
            style={{ accentColor: 'var(--accent)' }}
          />
          Include subpages (crawl depth: 1)
        </label>
      </form>

      {/* Minimal progress indicator */}
      {isExtracting && (
        <div className="mt-12 text-center">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {currentMessage}
          </p>
        </div>
      )}

      {isComplete && (
        <div className="mt-12 text-center">
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            Extraction complete
          </p>
        </div>
      )}

      {hasError && state.extractionError && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm" style={{ color: '#ef4444' }}>
            <AlertCircle className="h-4 w-4" />
            {state.extractionError}
          </div>
        </div>
      )}
    </div>
  );
}

function convertToWizardTokens(extractedTokens: Record<string, unknown>): ExtractedTokens {
  const colors: Record<string, TokenValue> = {};

  if (extractedTokens['colors'] && typeof extractedTokens['colors'] === 'object') {
    Object.entries(extractedTokens['colors'] as Record<string, string[]>).forEach(
      ([hexValue, usedIn]) => {
        const name = generateColorName(hexValue, Object.keys(colors).length);
        colors[name] = {
          value: hexValue,
          source: 'computed',
          usageCount: Array.isArray(usedIn) ? usedIn.length : 1,
        };
      }
    );
  }

  const typography = extractedTokens['typography'] as
    | Record<
        string,
        { fontFamily?: string; fontSize?: string; fontWeight?: string; lineHeight?: string }
      >
    | undefined;

  const fontFamilies: Record<string, string> = {};
  const fontSizes: Record<string, string> = {};
  const fontWeights: Record<string, string> = {};
  const lineHeights: Record<string, string> = {};

  if (typography) {
    Object.values(typography).forEach(style => {
      if (style.fontFamily && !Object.values(fontFamilies).includes(style.fontFamily)) {
        const name = `family${Object.keys(fontFamilies).length + 1}`;
        fontFamilies[name] = style.fontFamily;
      }
      if (style.fontSize && !Object.values(fontSizes).includes(style.fontSize)) {
        const name = `size${Object.keys(fontSizes).length + 1}`;
        fontSizes[name] = style.fontSize;
      }
      if (style.fontWeight && !Object.values(fontWeights).includes(style.fontWeight)) {
        const name = `weight${Object.keys(fontWeights).length + 1}`;
        fontWeights[name] = style.fontWeight;
      }
      if (style.lineHeight && !Object.values(lineHeights).includes(style.lineHeight)) {
        const name = `lh${Object.keys(lineHeights).length + 1}`;
        lineHeights[name] = style.lineHeight;
      }
    });
  }

  return {
    colors,
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    spacing: {
      '0': '0px',
      '1': '4px',
      '2': '8px',
      '3': '12px',
      '4': '16px',
      '6': '24px',
      '8': '32px',
    },
    radii: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    shadows: {
      none: 'none',
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 15px rgba(0,0,0,0.1)',
    },
  };
}

function convertToWizardVariants(_extractedTokens: Record<string, unknown>): VariantsMap {
  return {
    buttons: [],
    text: [],
    cards: [],
  };
}

function generateColorName(_hex: string, index: number): string {
  const colorNames = [
    'primary',
    'secondary',
    'accent',
    'background',
    'foreground',
    'muted',
    'border',
    'surface',
  ];
  if (index < colorNames.length) {
    return colorNames[index] ?? `color${index + 1}`;
  }
  return `color${index + 1}`;
}
