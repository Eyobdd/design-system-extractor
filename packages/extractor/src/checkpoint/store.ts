import * as fs from 'fs/promises';
import * as path from 'path';
import type { ExtractionCheckpoint, SerializedCheckpoint, ComponentComparison } from './types';

const CHECKPOINTS_DIR = '.checkpoints';

export class CheckpointStore {
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = path.join(baseDir, CHECKPOINTS_DIR);
  }

  private getCheckpointDir(id: string): string {
    return path.join(this.baseDir, id);
  }

  private getMetadataPath(id: string): string {
    return path.join(this.getCheckpointDir(id), 'metadata.json');
  }

  private async ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
  }

  async save(checkpoint: ExtractionCheckpoint): Promise<void> {
    const checkpointDir = this.getCheckpointDir(checkpoint.id);
    await this.ensureDir(checkpointDir);

    const serialized: SerializedCheckpoint = {
      id: checkpoint.id,
      url: checkpoint.url,
      status: checkpoint.status,
      progress: checkpoint.progress,
      startedAt: checkpoint.startedAt.toISOString(),
      updatedAt: checkpoint.updatedAt.toISOString(),
      identifiedComponents: checkpoint.identifiedComponents,
      extractedTokens: checkpoint.extractedTokens,
      error: checkpoint.error,
    };

    if (checkpoint.screenshots) {
      const viewportPath = path.join(checkpointDir, 'viewport.png');
      const fullPagePath = path.join(checkpointDir, 'fullpage.png');

      await fs.writeFile(viewportPath, checkpoint.screenshots.viewport);
      await fs.writeFile(fullPagePath, checkpoint.screenshots.fullPage);

      serialized.screenshotPaths = {
        viewport: 'viewport.png',
        fullPage: 'fullpage.png',
      };
    }

    if (checkpoint.comparisons) {
      serialized.comparisons = await Promise.all(
        checkpoint.comparisons.map(async (comp, index) => {
          const originalPath = `comparison_${index}_original.png`;
          const generatedPath = `comparison_${index}_generated.png`;

          await fs.writeFile(path.join(checkpointDir, originalPath), comp.originalScreenshot);
          await fs.writeFile(path.join(checkpointDir, generatedPath), comp.generatedScreenshot);

          return {
            componentId: comp.componentId,
            originalPath,
            generatedPath,
            ssimScore: comp.ssimScore,
            colorScore: comp.colorScore,
            combinedScore: comp.combinedScore,
            passed: comp.passed,
          };
        })
      );
    }

    await fs.writeFile(this.getMetadataPath(checkpoint.id), JSON.stringify(serialized, null, 2));
  }

  async load(id: string): Promise<ExtractionCheckpoint | null> {
    try {
      const metadataPath = this.getMetadataPath(id);
      const data = await fs.readFile(metadataPath, 'utf-8');
      const serialized: SerializedCheckpoint = JSON.parse(data);
      const checkpointDir = this.getCheckpointDir(id);

      const checkpoint: ExtractionCheckpoint = {
        id: serialized.id,
        url: serialized.url,
        status: serialized.status,
        progress: serialized.progress,
        startedAt: new Date(serialized.startedAt),
        updatedAt: new Date(serialized.updatedAt),
        identifiedComponents: serialized.identifiedComponents,
        extractedTokens: serialized.extractedTokens,
        error: serialized.error,
      };

      if (serialized.screenshotPaths) {
        checkpoint.screenshots = {
          viewport: await fs.readFile(
            path.join(checkpointDir, serialized.screenshotPaths.viewport)
          ),
          fullPage: await fs.readFile(
            path.join(checkpointDir, serialized.screenshotPaths.fullPage)
          ),
        };
      }

      if (serialized.comparisons) {
        checkpoint.comparisons = await Promise.all(
          serialized.comparisons.map(
            async (comp): Promise<ComponentComparison> => ({
              componentId: comp.componentId,
              originalScreenshot: await fs.readFile(path.join(checkpointDir, comp.originalPath)),
              generatedScreenshot: await fs.readFile(path.join(checkpointDir, comp.generatedPath)),
              ssimScore: comp.ssimScore,
              colorScore: comp.colorScore,
              combinedScore: comp.combinedScore,
              passed: comp.passed,
            })
          )
        );
      }

      return checkpoint;
    } catch {
      return null;
    }
  }

  async update(id: string, partial: Partial<ExtractionCheckpoint>): Promise<void> {
    const existing = await this.load(id);
    if (!existing) {
      throw new Error(`Checkpoint ${id} not found`);
    }

    const updated: ExtractionCheckpoint = {
      ...existing,
      ...partial,
      updatedAt: new Date(),
    };

    await this.save(updated);
  }

  async list(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const checkpointDir = this.getCheckpointDir(id);
    await fs.rm(checkpointDir, { recursive: true, force: true });
  }
}
