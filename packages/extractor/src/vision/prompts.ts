export const COMPONENT_IDENTIFICATION_SYSTEM_PROMPT = `You are a UI component identification expert. Your task is to analyze screenshots of web pages and identify distinct UI components.

For each component you identify, provide:
1. **type**: The component type (button, card, input, text, navigation, header, footer, modal, dropdown, etc.)
2. **name**: A descriptive name for this specific component (e.g., "Primary CTA Button", "Product Card", "Search Input")
3. **boundingBox**: The approximate location and size as {x, y, width, height} in pixels from top-left
4. **confidence**: Your confidence level from 0.0 to 1.0

Focus on:
- Interactive elements (buttons, inputs, links)
- Container components (cards, modals, sections)
- Typography components (headings, paragraphs, labels)
- Navigation elements (navbars, sidebars, breadcrumbs)

Do NOT identify:
- Individual text characters or words (group them as text components)
- Decorative elements without semantic meaning
- Background images or patterns

Return your response as a valid JSON array of component objects.`;

export const COMPONENT_IDENTIFICATION_USER_PROMPT = `Analyze this webpage screenshot and identify all distinct UI components.

Return a JSON array with this exact structure:
[
  {
    "type": "button",
    "name": "Primary CTA Button",
    "boundingBox": { "x": 100, "y": 200, "width": 120, "height": 40 },
    "confidence": 0.95
  }
]

Be thorough but avoid duplicates. Focus on components that would be useful to extract for a design system.`;

export const COMPONENT_IDENTIFICATION_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Component type (button, card, input, text, etc.)',
      },
      name: {
        type: 'string',
        description: 'Descriptive name for this component',
      },
      boundingBox: {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'X position from left in pixels' },
          y: { type: 'number', description: 'Y position from top in pixels' },
          width: { type: 'number', description: 'Width in pixels' },
          height: { type: 'number', description: 'Height in pixels' },
        },
        required: ['x', 'y', 'width', 'height'],
      },
      confidence: {
        type: 'number',
        description: 'Confidence score from 0.0 to 1.0',
        minimum: 0,
        maximum: 1,
      },
    },
    required: ['type', 'name', 'boundingBox', 'confidence'],
  },
};

export const SUPPORTED_COMPONENT_TYPES = [
  'button',
  'card',
  'input',
  'text',
  'heading',
  'link',
  'navigation',
  'header',
  'footer',
  'sidebar',
  'modal',
  'dropdown',
  'menu',
  'tab',
  'accordion',
  'badge',
  'avatar',
  'icon',
  'image',
  'divider',
  'list',
  'table',
  'form',
  'checkbox',
  'radio',
  'toggle',
  'slider',
  'tooltip',
  'alert',
  'toast',
  'progress',
  'spinner',
  'breadcrumb',
  'pagination',
] as const;

export type SupportedComponentType = (typeof SUPPORTED_COMPONENT_TYPES)[number];
