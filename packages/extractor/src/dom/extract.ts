import type { Page, ElementHandle } from 'puppeteer';
import type { ExtractedStyles, ElementInfo, ExtractionConfig } from './types';
import { DEFAULT_STYLE_PROPERTIES } from './types';

export async function extractElementStyles(
  page: Page,
  selector: string,
  config: ExtractionConfig = {}
): Promise<ExtractedStyles | null> {
  const {
    includeComputedStyles = true,
    includePseudoStyles = true,
    styleProperties = [...DEFAULT_STYLE_PROPERTIES],
  } = config;

  try {
    const element = await page.$(selector);
    if (!element) {
      return null;
    }

    const result: ExtractedStyles = {
      selector,
      computedStyles: {},
    };

    if (includeComputedStyles) {
      result.computedStyles = await getComputedStyles(page, element, styleProperties);
    }

    if (includePseudoStyles) {
      result.pseudoStyles = await getPseudoStyles(page, element, styleProperties);
    }

    return result;
  } catch {
    return null;
  }
}

export async function extractMultipleElementStyles(
  page: Page,
  selectors: string[],
  config: ExtractionConfig = {}
): Promise<ExtractedStyles[]> {
  const results: ExtractedStyles[] = [];

  for (const selector of selectors) {
    const styles = await extractElementStyles(page, selector, config);
    if (styles) {
      results.push(styles);
    }
  }

  return results;
}

export async function getElementInfo(page: Page, selector: string): Promise<ElementInfo | null> {
  try {
    const element = await page.$(selector);
    if (!element) {
      return null;
    }

    const info = await page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (!el) return null;

      const rect = el.getBoundingClientRect();
      return {
        tagName: el.tagName.toLowerCase(),
        selector: sel,
        className: el.className,
        id: el.id,
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      };
    }, selector);

    return info;
  } catch {
    return null;
  }
}

export async function findElementsByType(page: Page, componentType: string): Promise<string[]> {
  const selectorMap: Record<string, string[]> = {
    button: ['button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]'],
    input: ['input[type="text"]', 'input[type="email"]', 'input[type="password"]', 'textarea'],
    link: ['a[href]'],
    heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    card: ['[class*="card"]', '[data-component="card"]'],
    text: ['p', 'span', 'label'],
  };

  const selectors = selectorMap[componentType] || [];
  const results: string[] = [];

  for (const selector of selectors) {
    const elements = await page.$$(selector);
    for (let i = 0; i < elements.length; i++) {
      results.push(`${selector}:nth-of-type(${i + 1})`);
    }
  }

  return results;
}

async function getComputedStyles(
  page: Page,
  element: ElementHandle,
  properties: string[]
): Promise<Record<string, string>> {
  return page.evaluate(
    (el, props) => {
      const computed = window.getComputedStyle(el as Element);
      const styles: Record<string, string> = {};

      for (const prop of props) {
        const value = computed.getPropertyValue(prop);
        if (value) {
          styles[prop] = value;
        }
      }

      return styles;
    },
    element,
    properties
  );
}

async function getPseudoStyles(
  page: Page,
  element: ElementHandle,
  properties: string[]
): Promise<ExtractedStyles['pseudoStyles']> {
  const pseudoClasses = ['hover', 'focus', 'active', 'disabled'] as const;
  const result: ExtractedStyles['pseudoStyles'] = {};

  for (const pseudo of pseudoClasses) {
    const styles = await page.evaluate(
      (el, props, pseudoClass) => {
        const computed = window.getComputedStyle(el as Element, `:${pseudoClass}`);
        const styles: Record<string, string> = {};

        for (const prop of props) {
          const value = computed.getPropertyValue(prop);
          if (value) {
            styles[prop] = value;
          }
        }

        return Object.keys(styles).length > 0 ? styles : null;
      },
      element,
      properties,
      pseudo
    );

    if (styles) {
      result[pseudo] = styles;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function diffStyles(
  base: Record<string, string>,
  target: Record<string, string>
): Record<string, { from: string; to: string }> {
  const diff: Record<string, { from: string; to: string }> = {};

  for (const [key, value] of Object.entries(target)) {
    if (base[key] !== value) {
      diff[key] = {
        from: base[key] || '',
        to: value,
      };
    }
  }

  return diff;
}

export function normalizeColor(color: string): string {
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]!, 10).toString(16).padStart(2, '0');
      const g = parseInt(match[2]!, 10).toString(16).padStart(2, '0');
      const b = parseInt(match[3]!, 10).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`.toLowerCase();
    }
  }
  return color.toLowerCase();
}

export function extractColorTokens(styles: ExtractedStyles[]): Record<string, string[]> {
  const colorProperties = ['color', 'background-color', 'border-color', 'outline-color'];
  const colors: Record<string, string[]> = {};

  for (const style of styles) {
    for (const prop of colorProperties) {
      const value = style.computedStyles[prop];
      if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
        const normalized = normalizeColor(value);
        if (!colors[normalized]) {
          colors[normalized] = [];
        }
        if (!colors[normalized].includes(style.selector)) {
          colors[normalized].push(style.selector);
        }
      }
    }
  }

  return colors;
}

export function extractTypographyTokens(
  styles: ExtractedStyles[]
): Record<
  string,
  { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string }
> {
  const typography: Record<
    string,
    { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string }
  > = {};

  for (const style of styles) {
    const key = `${style.computedStyles['font-family'] || ''}_${style.computedStyles['font-size'] || ''}_${style.computedStyles['font-weight'] || ''}`;

    if (!typography[key] && style.computedStyles['font-family']) {
      typography[key] = {
        fontFamily: style.computedStyles['font-family'] || '',
        fontSize: style.computedStyles['font-size'] || '',
        fontWeight: style.computedStyles['font-weight'] || '',
        lineHeight: style.computedStyles['line-height'] || '',
      };
    }
  }

  return typography;
}
