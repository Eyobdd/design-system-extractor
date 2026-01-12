export type ExtractionStatus =
  | 'pending'
  | 'screenshot'
  | 'vision'
  | 'extraction'
  | 'comparison'
  | 'complete'
  | 'failed';

export interface ComponentIdentification {
  type: string;
  name: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface ComponentComparison {
  componentId: string;
  originalScreenshot: Buffer;
  generatedScreenshot: Buffer;
  ssimScore: number;
  colorScore: number;
  combinedScore: number;
  passed: boolean;
}

export interface SerializedComponentComparison {
  componentId: string;
  originalPath: string;
  generatedPath: string;
  ssimScore: number;
  colorScore: number;
  combinedScore: number;
  passed: boolean;
}

interface BaseCheckpoint {
  id: string;
  url: string;
  status: ExtractionStatus;
  progress: number;
  identifiedComponents?: ComponentIdentification[] | undefined;
  extractedTokens?: Record<string, unknown> | undefined;
  error?: string | undefined;
}

export interface ExtractionCheckpoint extends BaseCheckpoint {
  startedAt: Date;
  updatedAt: Date;
  screenshots?:
    | {
        viewport: Buffer;
        fullPage: Buffer;
      }
    | undefined;
  comparisons?: ComponentComparison[] | undefined;
}

export interface SerializedCheckpoint extends BaseCheckpoint {
  startedAt: string;
  updatedAt: string;
  screenshotPaths?:
    | {
        viewport: string;
        fullPage: string;
      }
    | undefined;
  comparisons?: SerializedComponentComparison[] | undefined;
}
