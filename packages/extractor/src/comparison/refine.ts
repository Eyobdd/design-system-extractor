import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ComparisonResult } from './compare';

export interface RefinementSuggestion {
  category: 'color' | 'spacing' | 'typography' | 'layout' | 'border' | 'shadow' | 'other';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  cssProperty?: string;
  suggestedValue?: string;
}

export interface RefinementResult {
  componentId: string;
  suggestions: RefinementSuggestion[];
  summary: string;
  confidence: number;
}

export interface RefinementOptions {
  apiKey?: string;
  model?: string;
  maxSuggestions?: number;
}

const DEFAULT_MODEL = 'gemini-2.0-flash';

const REFINEMENT_PROMPT = `You are a visual design system expert. Analyze the two component screenshots provided:
1. The ORIGINAL component screenshot (from the source website)
2. The GENERATED component screenshot (our recreation attempt)

Your task is to identify specific visual differences and provide actionable CSS refinement suggestions.

For each difference found, provide:
- category: one of "color", "spacing", "typography", "layout", "border", "shadow", "other"
- severity: "critical" (major visual difference), "major" (noticeable), "minor" (subtle)
- description: Clear explanation of the difference
- cssProperty: The CSS property to modify (if applicable)
- suggestedValue: The suggested CSS value (if determinable)

Comparison scores:
- SSIM Score: {ssimScore} (structural similarity, 1.0 = identical)
- Color Score: {colorScore} (color histogram similarity, 1.0 = identical)
- Combined Score: {combinedScore}

Respond with a JSON object containing:
{
  "suggestions": [...array of suggestions...],
  "summary": "Brief overall summary of differences",
  "confidence": 0.0-1.0 (how confident you are in your analysis)
}

Focus on actionable, specific improvements. If components appear very similar, provide fewer suggestions.`;

export async function getRefinementSuggestions(
  componentId: string,
  originalImage: Buffer,
  generatedImage: Buffer,
  comparisonResult: ComparisonResult,
  options: RefinementOptions = {}
): Promise<RefinementResult> {
  const {
    apiKey = process.env['GEMINI_API_KEY'],
    model = DEFAULT_MODEL,
    maxSuggestions = 10,
  } = options;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for refinement suggestions');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });

  const prompt = REFINEMENT_PROMPT.replace('{ssimScore}', comparisonResult.ssimScore.toFixed(3))
    .replace('{colorScore}', comparisonResult.colorScore.toFixed(3))
    .replace('{combinedScore}', comparisonResult.combinedScore.toFixed(3));

  const result = await genModel.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/png',
        data: originalImage.toString('base64'),
      },
    },
    'Original component screenshot above.',
    {
      inlineData: {
        mimeType: 'image/png',
        data: generatedImage.toString('base64'),
      },
    },
    'Generated component screenshot above.',
  ]);

  const response = result.response.text();
  const parsed = parseRefinementResponse(response);

  return {
    componentId,
    suggestions: parsed.suggestions.slice(0, maxSuggestions),
    summary: parsed.summary,
    confidence: parsed.confidence,
  };
}

function parseRefinementResponse(response: string): {
  suggestions: RefinementSuggestion[];
  summary: string;
  confidence: number;
} {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        suggestions: [],
        summary: 'Unable to parse LLM response',
        confidence: 0,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      suggestions?: unknown[];
      summary?: string;
      confidence?: number;
    };

    const suggestions: RefinementSuggestion[] = [];

    if (Array.isArray(parsed.suggestions)) {
      for (const item of parsed.suggestions) {
        if (isValidSuggestion(item)) {
          suggestions.push(item);
        }
      }
    }

    return {
      suggestions,
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'No summary provided',
      confidence:
        typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    };
  } catch {
    return {
      suggestions: [],
      summary: 'Failed to parse refinement response',
      confidence: 0,
    };
  }
}

function isValidSuggestion(item: unknown): item is RefinementSuggestion {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const obj = item as Record<string, unknown>;

  const validCategories = ['color', 'spacing', 'typography', 'layout', 'border', 'shadow', 'other'];
  const validSeverities = ['critical', 'major', 'minor'];

  return (
    typeof obj['category'] === 'string' &&
    validCategories.includes(obj['category']) &&
    typeof obj['severity'] === 'string' &&
    validSeverities.includes(obj['severity']) &&
    typeof obj['description'] === 'string'
  );
}

export async function getRefinementSuggestionsBatch(
  items: Array<{
    componentId: string;
    originalImage: Buffer;
    generatedImage: Buffer;
    comparisonResult: ComparisonResult;
  }>,
  options: RefinementOptions = {}
): Promise<RefinementResult[]> {
  const results = await Promise.all(
    items.map(item =>
      getRefinementSuggestions(
        item.componentId,
        item.originalImage,
        item.generatedImage,
        item.comparisonResult,
        options
      )
    )
  );

  return results;
}

export function prioritizeSuggestions(suggestions: RefinementSuggestion[]): RefinementSuggestion[] {
  const severityOrder = { critical: 0, major: 1, minor: 2 };

  return [...suggestions].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function filterSuggestionsByCategory(
  suggestions: RefinementSuggestion[],
  categories: RefinementSuggestion['category'][]
): RefinementSuggestion[] {
  return suggestions.filter(s => categories.includes(s.category));
}
