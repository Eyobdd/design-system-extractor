export interface ExtractedStyles {
  selector: string;
  computedStyles: Record<string, string>;
  pseudoStyles?:
    | {
        hover?: Record<string, string> | undefined;
        focus?: Record<string, string> | undefined;
        active?: Record<string, string> | undefined;
        disabled?: Record<string, string> | undefined;
      }
    | undefined;
}

export interface ElementInfo {
  tagName: string;
  selector: string;
  className: string;
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractionConfig {
  includeComputedStyles?: boolean | undefined;
  includePseudoStyles?: boolean | undefined;
  styleProperties?: string[] | undefined;
}

export const DEFAULT_STYLE_PROPERTIES = [
  // Colors
  'color',
  'background-color',
  'border-color',
  'outline-color',
  // Typography
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration',
  'text-transform',
  // Spacing
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  // Border
  'border-width',
  'border-style',
  'border-radius',
  // Layout
  'display',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  // Effects
  'opacity',
  'box-shadow',
  'transition',
  'transform',
  'cursor',
] as const;

export type StyleProperty = (typeof DEFAULT_STYLE_PROPERTIES)[number];
