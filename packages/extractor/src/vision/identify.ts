import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ComponentIdentification } from '../checkpoint/types';
import type { CheckpointStore } from '../checkpoint/store';
import {
  COMPONENT_IDENTIFICATION_SYSTEM_PROMPT,
  COMPONENT_IDENTIFICATION_USER_PROMPT,
} from './prompts';

export interface IdentifyOptions {
  checkpointId: string;
  screenshot: Buffer;
  apiKey?: string;
  model?: string;
}

export interface IdentifyResult {
  components: ComponentIdentification[];
  rawResponse: string;
}

export async function identifyComponents(
  options: IdentifyOptions,
  checkpointStore?: CheckpointStore
): Promise<IdentifyResult> {
  const {
    checkpointId,
    screenshot,
    apiKey = process.env['GOOGLE_API_KEY'],
    model = 'gemini-2.0-flash',
  } = options;

  if (!apiKey) {
    throw new Error(
      'Google API key is required. Set GOOGLE_API_KEY environment variable or pass apiKey option.'
    );
  }

  try {
    const llm = new ChatGoogleGenerativeAI({
      apiKey,
      model,
      temperature: 0.1,
    });

    const base64Image = screenshot.toString('base64');

    const response = await llm.invoke([
      new SystemMessage(COMPONENT_IDENTIFICATION_SYSTEM_PROMPT),
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: COMPONENT_IDENTIFICATION_USER_PROMPT,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
        ],
      }),
    ]);

    const rawResponse =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    const components = parseComponentResponse(rawResponse);

    if (checkpointStore) {
      await checkpointStore.update(checkpointId, {
        status: 'vision',
        progress: 50,
        identifiedComponents: components,
      });
    }

    return {
      components,
      rawResponse,
    };
  } catch (error) {
    if (checkpointStore) {
      await checkpointStore.update(checkpointId, {
        status: 'failed',
        error:
          error instanceof Error ? error.message : 'Unknown error during component identification',
      });
    }
    throw error;
  }
}

function parseComponentResponse(response: string): ComponentIdentification[] {
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('No JSON array found in response, returning empty array');
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      console.warn('Parsed response is not an array, returning empty array');
      return [];
    }

    return parsed.filter(isValidComponent).map(comp => ({
      type: String(comp.type),
      name: String(comp.name),
      boundingBox: {
        x: Number(comp.boundingBox.x),
        y: Number(comp.boundingBox.y),
        width: Number(comp.boundingBox.width),
        height: Number(comp.boundingBox.height),
      },
      confidence: Math.min(1, Math.max(0, Number(comp.confidence))),
    }));
  } catch (error) {
    console.warn('Failed to parse component response:', error);
    return [];
  }
}

function isValidComponent(comp: unknown): comp is {
  type: string;
  name: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
} {
  if (typeof comp !== 'object' || comp === null) {
    return false;
  }

  const c = comp as Record<string, unknown>;

  if (typeof c['type'] !== 'string' || typeof c['name'] !== 'string') {
    return false;
  }

  if (typeof c['boundingBox'] !== 'object' || c['boundingBox'] === null) {
    return false;
  }

  const bbox = c['boundingBox'] as Record<string, unknown>;
  if (
    typeof bbox['x'] !== 'number' ||
    typeof bbox['y'] !== 'number' ||
    typeof bbox['width'] !== 'number' ||
    typeof bbox['height'] !== 'number'
  ) {
    return false;
  }

  if (typeof c['confidence'] !== 'number') {
    return false;
  }

  return true;
}

export function filterComponentsByConfidence(
  components: ComponentIdentification[],
  minConfidence: number = 0.7
): ComponentIdentification[] {
  return components.filter(c => c.confidence >= minConfidence);
}

export function groupComponentsByType(
  components: ComponentIdentification[]
): Record<string, ComponentIdentification[]> {
  return components.reduce(
    (acc, component) => {
      const type = component.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(component);
      return acc;
    },
    {} as Record<string, ComponentIdentification[]>
  );
}
