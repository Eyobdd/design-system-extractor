import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @langchain/google-genai
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn(),
  })),
}));

// Mock @langchain/core/messages
vi.mock('@langchain/core/messages', () => ({
  HumanMessage: vi.fn().mockImplementation(content => ({ content })),
  SystemMessage: vi.fn().mockImplementation(content => ({ content })),
}));

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  identifyComponents,
  filterComponentsByConfidence,
  groupComponentsByType,
} from './identify';
import {
  COMPONENT_IDENTIFICATION_SYSTEM_PROMPT,
  COMPONENT_IDENTIFICATION_USER_PROMPT,
  SUPPORTED_COMPONENT_TYPES,
} from './prompts';
import type { ComponentIdentification } from '../checkpoint/types';
import { CheckpointStore } from '../checkpoint/store';

describe('Vision Prompts', () => {
  it('has system prompt defined', () => {
    expect(COMPONENT_IDENTIFICATION_SYSTEM_PROMPT).toBeDefined();
    expect(COMPONENT_IDENTIFICATION_SYSTEM_PROMPT).toContain('UI component');
  });

  it('has user prompt defined', () => {
    expect(COMPONENT_IDENTIFICATION_USER_PROMPT).toBeDefined();
    expect(COMPONENT_IDENTIFICATION_USER_PROMPT).toContain('JSON');
  });

  it('has supported component types', () => {
    expect(SUPPORTED_COMPONENT_TYPES).toContain('button');
    expect(SUPPORTED_COMPONENT_TYPES).toContain('card');
    expect(SUPPORTED_COMPONENT_TYPES).toContain('input');
    expect(SUPPORTED_COMPONENT_TYPES).toContain('text');
  });
});

describe('identifyComponents', () => {
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke = vi.fn();
    vi.mocked(ChatGoogleGenerativeAI).mockImplementation(
      () =>
        ({
          invoke: mockInvoke,
        }) as unknown as InstanceType<typeof ChatGoogleGenerativeAI>
    );
  });

  it('throws error when no API key provided', async () => {
    const originalEnv = process.env['GOOGLE_API_KEY'];
    delete process.env['GOOGLE_API_KEY'];

    await expect(
      identifyComponents({
        checkpointId: 'test',
        screenshot: Buffer.from('test'),
      })
    ).rejects.toThrow('Google API key is required');

    process.env['GOOGLE_API_KEY'] = originalEnv;
  });

  it('parses valid component response', async () => {
    const mockResponse = {
      content: JSON.stringify([
        {
          type: 'button',
          name: 'Primary Button',
          boundingBox: { x: 100, y: 200, width: 120, height: 40 },
          confidence: 0.95,
        },
        {
          type: 'card',
          name: 'Product Card',
          boundingBox: { x: 300, y: 100, width: 280, height: 350 },
          confidence: 0.88,
        },
      ]),
    };

    mockInvoke.mockResolvedValue(mockResponse);

    const result = await identifyComponents({
      checkpointId: 'test',
      screenshot: Buffer.from('test'),
      apiKey: 'test-api-key',
    });

    expect(result.components).toHaveLength(2);
    expect(result.components[0]?.type).toBe('button');
    expect(result.components[0]?.name).toBe('Primary Button');
    expect(result.components[1]?.type).toBe('card');
  });

  it('handles response with markdown code blocks', async () => {
    const mockResponse = {
      content: `Here are the components I identified:
\`\`\`json
[
  {
    "type": "input",
    "name": "Search Input",
    "boundingBox": { "x": 50, "y": 80, "width": 300, "height": 40 },
    "confidence": 0.92
  }
]
\`\`\``,
    };

    mockInvoke.mockResolvedValue(mockResponse);

    const result = await identifyComponents({
      checkpointId: 'test',
      screenshot: Buffer.from('test'),
      apiKey: 'test-api-key',
    });

    expect(result.components).toHaveLength(1);
    expect(result.components[0]?.type).toBe('input');
  });

  it('returns empty array for invalid response', async () => {
    const mockResponse = {
      content: 'I could not identify any components in this image.',
    };

    mockInvoke.mockResolvedValue(mockResponse);

    const result = await identifyComponents({
      checkpointId: 'test',
      screenshot: Buffer.from('test'),
      apiKey: 'test-api-key',
    });

    expect(result.components).toHaveLength(0);
  });

  it('filters out invalid components', async () => {
    const mockResponse = {
      content: JSON.stringify([
        {
          type: 'button',
          name: 'Valid Button',
          boundingBox: { x: 100, y: 200, width: 120, height: 40 },
          confidence: 0.95,
        },
        {
          type: 'invalid',
          // Missing name
          boundingBox: { x: 100, y: 200, width: 120, height: 40 },
          confidence: 0.8,
        },
        {
          type: 'card',
          name: 'Missing BBox',
          confidence: 0.9,
        },
        null,
        'not an object',
      ]),
    };

    mockInvoke.mockResolvedValue(mockResponse);

    const result = await identifyComponents({
      checkpointId: 'test',
      screenshot: Buffer.from('test'),
      apiKey: 'test-api-key',
    });

    expect(result.components).toHaveLength(1);
    expect(result.components[0]?.name).toBe('Valid Button');
  });

  it('clamps confidence to 0-1 range', async () => {
    const mockResponse = {
      content: JSON.stringify([
        {
          type: 'button',
          name: 'High Confidence',
          boundingBox: { x: 100, y: 200, width: 120, height: 40 },
          confidence: 1.5,
        },
        {
          type: 'button',
          name: 'Low Confidence',
          boundingBox: { x: 100, y: 200, width: 120, height: 40 },
          confidence: -0.2,
        },
      ]),
    };

    mockInvoke.mockResolvedValue(mockResponse);

    const result = await identifyComponents({
      checkpointId: 'test',
      screenshot: Buffer.from('test'),
      apiKey: 'test-api-key',
    });

    expect(result.components[0]?.confidence).toBe(1);
    expect(result.components[1]?.confidence).toBe(0);
  });

  it('updates checkpoint on success', async () => {
    const mockResponse = {
      content: JSON.stringify([
        {
          type: 'button',
          name: 'Test',
          boundingBox: { x: 0, y: 0, width: 100, height: 50 },
          confidence: 0.9,
        },
      ]),
    };

    mockInvoke.mockResolvedValue(mockResponse);

    const mockStore = {
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as CheckpointStore;

    await identifyComponents(
      {
        checkpointId: 'test-checkpoint',
        screenshot: Buffer.from('test'),
        apiKey: 'test-api-key',
      },
      mockStore
    );

    expect(mockStore.update).toHaveBeenCalledWith('test-checkpoint', {
      status: 'vision',
      progress: 50,
      identifiedComponents: expect.any(Array),
    });
  });

  it('updates checkpoint on error', async () => {
    mockInvoke.mockRejectedValue(new Error('API Error'));

    const mockStore = {
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as CheckpointStore;

    await expect(
      identifyComponents(
        {
          checkpointId: 'test-checkpoint',
          screenshot: Buffer.from('test'),
          apiKey: 'test-api-key',
        },
        mockStore
      )
    ).rejects.toThrow('API Error');

    expect(mockStore.update).toHaveBeenCalledWith('test-checkpoint', {
      status: 'failed',
      error: 'API Error',
    });
  });
});

describe('filterComponentsByConfidence', () => {
  const testComponents: ComponentIdentification[] = [
    {
      type: 'button',
      name: 'High',
      boundingBox: { x: 0, y: 0, width: 100, height: 50 },
      confidence: 0.95,
    },
    {
      type: 'card',
      name: 'Medium',
      boundingBox: { x: 0, y: 0, width: 100, height: 50 },
      confidence: 0.75,
    },
    {
      type: 'input',
      name: 'Low',
      boundingBox: { x: 0, y: 0, width: 100, height: 50 },
      confidence: 0.5,
    },
  ];

  it('filters by default threshold (0.7)', () => {
    const result = filterComponentsByConfidence(testComponents);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.name)).toEqual(['High', 'Medium']);
  });

  it('filters by custom threshold', () => {
    const result = filterComponentsByConfidence(testComponents, 0.9);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('High');
  });

  it('returns empty array when no components meet threshold', () => {
    const result = filterComponentsByConfidence(testComponents, 0.99);
    expect(result).toHaveLength(0);
  });

  it('returns all components when threshold is 0', () => {
    const result = filterComponentsByConfidence(testComponents, 0);
    expect(result).toHaveLength(3);
  });
});

describe('groupComponentsByType', () => {
  const testComponents: ComponentIdentification[] = [
    {
      type: 'button',
      name: 'Primary Button',
      boundingBox: { x: 0, y: 0, width: 100, height: 50 },
      confidence: 0.95,
    },
    {
      type: 'button',
      name: 'Secondary Button',
      boundingBox: { x: 0, y: 0, width: 100, height: 50 },
      confidence: 0.9,
    },
    {
      type: 'card',
      name: 'Product Card',
      boundingBox: { x: 0, y: 0, width: 200, height: 300 },
      confidence: 0.88,
    },
    {
      type: 'input',
      name: 'Search Input',
      boundingBox: { x: 0, y: 0, width: 300, height: 40 },
      confidence: 0.92,
    },
  ];

  it('groups components by type', () => {
    const result = groupComponentsByType(testComponents);

    expect(Object.keys(result)).toHaveLength(3);
    expect(result['button']).toHaveLength(2);
    expect(result['card']).toHaveLength(1);
    expect(result['input']).toHaveLength(1);
  });

  it('returns empty object for empty array', () => {
    const result = groupComponentsByType([]);
    expect(result).toEqual({});
  });

  it('preserves component data in groups', () => {
    const result = groupComponentsByType(testComponents);

    expect(result['button']?.[0]?.name).toBe('Primary Button');
    expect(result['button']?.[1]?.name).toBe('Secondary Button');
    expect(result['card']?.[0]?.name).toBe('Product Card');
  });
});
