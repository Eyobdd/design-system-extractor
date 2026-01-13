'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ExtractionStatus {
  id: string;
  url: string;
  status: string;
  progress: number;
  startedAt: string;
  updatedAt: string;
  identifiedComponents?: Array<{
    type: string;
    name: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>;
  extractedTokens?: Record<string, unknown>;
  error?: string;
  hasScreenshots?: boolean;
  comparisons?: Array<{
    componentId: string;
    ssimScore: number;
    colorScore: number;
    combinedScore: number;
    passed: boolean;
  }>;
}

interface UseExtractionStatusOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

interface UseExtractionStatusResult {
  data: ExtractionStatus | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useExtractionStatus(
  checkpointId: string | null,
  options: UseExtractionStatusOptions = {}
): UseExtractionStatusResult {
  const { pollingInterval = 2000, enabled = true } = options;

  const [data, setData] = useState<ExtractionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!checkpointId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/extract/status/${checkpointId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch status');
      }

      const statusData = await response.json();
      setData(statusData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [checkpointId]);

  useEffect(() => {
    if (!checkpointId || !enabled) return;

    fetchStatus();

    const isTerminal = data?.status === 'complete' || data?.status === 'failed';
    if (isTerminal) return;

    const intervalId = setInterval(fetchStatus, pollingInterval);

    return () => clearInterval(intervalId);
  }, [checkpointId, enabled, pollingInterval, fetchStatus, data?.status]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchStatus,
  };
}
