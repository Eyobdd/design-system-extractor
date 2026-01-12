import type { ExtractionCheckpoint } from '../checkpoint/types';

export interface ExtractorConfig {
  url: string;
  outputDir?: string | undefined;
  dryRun?: boolean | undefined;
  skipVision?: boolean | undefined;
  skipDomExtraction?: boolean | undefined;
  viewportWidth?: number | undefined;
  viewportHeight?: number | undefined;
  timeout?: number | undefined;
  apiKey?: string | undefined;
}

export interface ExtractorResult {
  checkpoint: ExtractionCheckpoint;
  dryRun: boolean;
  duration: number;
  steps: ExtractorStep[];
}

export interface ExtractorStep {
  name: string;
  status: 'success' | 'skipped' | 'failed';
  duration: number;
  error?: string | undefined;
  data?: unknown | undefined;
}

export type ExtractorEventType =
  | 'start'
  | 'screenshot'
  | 'vision'
  | 'extraction'
  | 'complete'
  | 'error';

export interface ExtractorEvent {
  type: ExtractorEventType;
  checkpoint: ExtractionCheckpoint;
  step?: ExtractorStep | undefined;
  error?: Error | undefined;
}

export type ExtractorEventHandler = (event: ExtractorEvent) => void;
