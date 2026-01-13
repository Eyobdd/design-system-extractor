import { NextRequest, NextResponse } from 'next/server';
import { getCheckpointStore } from '../extract/extraction';

export type ExportFormat = 'json' | 'css' | 'tailwind' | 'scss';

interface ExportOptions {
  checkpointId: string;
  format: ExportFormat;
}

function toCssVariables(tokens: Record<string, unknown>, prefix = ''): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(tokens)) {
    const varName = prefix ? `${prefix}-${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(toCssVariables(value as Record<string, unknown>, varName));
    } else {
      lines.push(`  --${varName}: ${value};`);
    }
  }

  return lines.join('\n');
}

function toScssVariables(tokens: Record<string, unknown>, prefix = ''): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(tokens)) {
    const varName = prefix ? `${prefix}-${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(toScssVariables(value as Record<string, unknown>, varName));
    } else {
      lines.push(`$${varName}: ${value};`);
    }
  }

  return lines.join('\n');
}

function toTailwindConfig(tokens: Record<string, unknown>): string {
  const config: Record<string, unknown> = {
    theme: {
      extend: {},
    },
  };

  const extend = config['theme'] as { extend: Record<string, unknown> };

  if (tokens['colors']) {
    extend.extend['colors'] = tokens['colors'];
  }

  if (tokens['spacing']) {
    extend.extend['spacing'] = tokens['spacing'];
  }

  if (tokens['typography']) {
    const typography = tokens['typography'] as Record<string, unknown>;
    if (typography['fontFamily']) {
      extend.extend['fontFamily'] = {
        sans: [typography['fontFamily']],
      };
    }
    if (typography['fontSize']) {
      extend.extend['fontSize'] = typography['fontSize'];
    }
  }

  return `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(config, null, 2)};`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkpointId = searchParams.get('checkpointId');
    const format = (searchParams.get('format') || 'json') as ExportFormat;

    if (!checkpointId) {
      return NextResponse.json({ error: 'checkpointId is required' }, { status: 400 });
    }

    if (!['json', 'css', 'tailwind', 'scss'].includes(format)) {
      return NextResponse.json(
        { error: 'format must be one of: json, css, tailwind, scss' },
        { status: 400 }
      );
    }

    const store = getCheckpointStore();
    const checkpoint = await store.load(checkpointId);

    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    if (checkpoint.status !== 'complete') {
      return NextResponse.json({ error: 'Extraction not complete' }, { status: 400 });
    }

    const tokens = checkpoint.extractedTokens || {};

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'css':
        content = `:root {\n${toCssVariables(tokens)}\n}`;
        contentType = 'text/css';
        filename = 'design-tokens.css';
        break;

      case 'scss':
        content = toScssVariables(tokens);
        contentType = 'text/x-scss';
        filename = 'design-tokens.scss';
        break;

      case 'tailwind':
        content = toTailwindConfig(tokens);
        contentType = 'application/javascript';
        filename = 'tailwind.config.js';
        break;

      case 'json':
      default:
        content = JSON.stringify(tokens, null, 2);
        contentType = 'application/json';
        filename = 'design-tokens.json';
        break;
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export tokens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExportOptions;

    if (!body.checkpointId) {
      return NextResponse.json({ error: 'checkpointId is required' }, { status: 400 });
    }

    const format = body.format || 'json';

    if (!['json', 'css', 'tailwind', 'scss'].includes(format)) {
      return NextResponse.json(
        { error: 'format must be one of: json, css, tailwind, scss' },
        { status: 400 }
      );
    }

    const store = getCheckpointStore();
    const checkpoint = await store.load(body.checkpointId);

    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    if (checkpoint.status !== 'complete') {
      return NextResponse.json({ error: 'Extraction not complete' }, { status: 400 });
    }

    const tokens = checkpoint.extractedTokens || {};

    let content: string;

    switch (format) {
      case 'css':
        content = `:root {\n${toCssVariables(tokens)}\n}`;
        break;

      case 'scss':
        content = toScssVariables(tokens);
        break;

      case 'tailwind':
        content = toTailwindConfig(tokens);
        break;

      case 'json':
      default:
        content = JSON.stringify(tokens, null, 2);
        break;
    }

    return NextResponse.json({
      format,
      content,
      checkpointId: body.checkpointId,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export tokens' }, { status: 500 });
  }
}
