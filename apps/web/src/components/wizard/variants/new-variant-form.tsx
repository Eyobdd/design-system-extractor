'use client';

import { useState } from 'react';
import { useWizard } from '@/hooks/use-wizard';
import type {
  ButtonVariantSpec,
  TextVariantSpec,
  CardVariantSpec,
  ExtractedVariant,
} from '@/lib/wizard-types';

export function NewVariantForm() {
  const { state, cancelNewVariant, saveNewVariant } = useWizard();
  const [name, setName] = useState('');

  const componentType = state.currentComponent;

  const getDefaultSpec = (): ButtonVariantSpec | TextVariantSpec | CardVariantSpec => {
    const colorKeys = Object.keys(state.tokens.colors);
    const spacingKeys = Object.keys(state.tokens.spacing);
    const radiiKeys = Object.keys(state.tokens.radii);
    const shadowKeys = Object.keys(state.tokens.shadows);
    const fontSizeKeys = Object.keys(state.tokens.fontSizes);
    const fontWeightKeys = Object.keys(state.tokens.fontWeights);
    const fontFamilyKeys = Object.keys(state.tokens.fontFamilies);
    const lineHeightKeys = Object.keys(state.tokens.lineHeights);

    const defaultColor = colorKeys[0] || 'primary';
    const defaultSpacing = spacingKeys[0] || '4';
    const defaultRadius = radiiKeys[0] || 'md';
    const defaultShadow = shadowKeys[0] || 'none';
    const defaultFontSize = fontSizeKeys[0] || 'base';
    const defaultFontWeight = fontWeightKeys[0] || 'normal';
    const defaultFontFamily = fontFamilyKeys[0] || 'sans';
    const defaultLineHeight = lineHeightKeys[0] || 'normal';

    switch (componentType) {
      case 'buttons':
        return {
          background: defaultColor,
          color: colorKeys[1] || defaultColor,
          borderColor: defaultColor,
          borderWidth: '0',
          borderRadius: defaultRadius,
          padding: [defaultSpacing, defaultSpacing] as [string, string],
          fontSize: defaultFontSize,
          fontWeight: defaultFontWeight,
          fontFamily: defaultFontFamily,
          shadow: defaultShadow,
        };
      case 'text':
        return {
          color: defaultColor,
          fontSize: defaultFontSize,
          fontWeight: defaultFontWeight,
          fontFamily: defaultFontFamily,
          lineHeight: defaultLineHeight,
        };
      case 'cards':
        return {
          background: defaultColor,
          borderColor: defaultColor,
          borderWidth: '0',
          borderRadius: defaultRadius,
          padding: [defaultSpacing] as [string],
          shadow: defaultShadow,
        };
    }
  };

  const [spec, setSpec] = useState(getDefaultSpec());

  const handleSave = () => {
    if (!name.trim()) return;

    const newVariant: ExtractedVariant = {
      id: `manual-${Date.now()}`,
      name: name.trim(),
      status: 'approved',
      spec,
      isManual: true,
    };

    saveNewVariant(newVariant);
  };

  const componentLabels: Record<string, string> = {
    buttons: 'Button',
    text: 'Text',
    cards: 'Card',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          New {componentLabels[componentType]} Variant
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Create a new variant by selecting token values for each property.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Variant Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={`e.g., ${componentType === 'buttons' ? 'outline' : componentType === 'text' ? 'caption' : 'bordered'}`}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-3 text-center text-sm font-medium text-gray-500">
            No Original (Manually Created)
          </h4>
          <div className="flex h-[120px] items-center justify-center text-gray-400">
            Manual variant
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h4 className="mb-3 text-center text-sm font-medium text-gray-500">Live Preview</h4>
          <div className="flex h-[120px] items-center justify-center">
            <LivePreview componentType={componentType} spec={spec} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h4 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          Token Mappings
        </h4>
        <SpecEditor componentType={componentType} spec={spec} onChange={setSpec} />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={cancelNewVariant}
          className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Save New Variant
        </button>
      </div>
    </div>
  );
}

function LivePreview({
  componentType,
  spec,
}: {
  componentType: string;
  spec: ButtonVariantSpec | TextVariantSpec | CardVariantSpec;
}) {
  const { state } = useWizard();

  const resolveColor = (key: string): string => {
    return state.tokens.colors[key]?.value || key;
  };

  const resolveValue = (category: keyof typeof state.tokens, key: string): string => {
    const tokens = state.tokens[category];
    if (category === 'colors') {
      const colorTokens = tokens as Record<string, { value: string }>;
      return colorTokens[key]?.value || key;
    }
    const simpleTokens = tokens as Record<string, string>;
    return simpleTokens[key] || key;
  };

  if (componentType === 'text') {
    const textSpec = spec as TextVariantSpec;
    return (
      <p
        style={{
          color: resolveColor(textSpec.color),
          fontSize: resolveValue('fontSizes', textSpec.fontSize),
          fontWeight: resolveValue('fontWeights', textSpec.fontWeight),
          fontFamily: resolveValue('fontFamilies', textSpec.fontFamily),
          lineHeight: resolveValue('lineHeights', textSpec.lineHeight),
        }}
      >
        Sample text preview
      </p>
    );
  }

  if (componentType === 'buttons') {
    const buttonSpec = spec as ButtonVariantSpec;
    const paddingY = buttonSpec.padding[0] || '8px';
    const paddingX = buttonSpec.padding[1] || buttonSpec.padding[0] || '16px';

    return (
      <button
        type="button"
        style={{
          backgroundColor: resolveColor(buttonSpec.background),
          color: resolveColor(buttonSpec.color),
          borderColor: resolveColor(buttonSpec.borderColor),
          borderWidth: resolveValue('spacing', buttonSpec.borderWidth),
          borderStyle: 'solid',
          borderRadius: resolveValue('radii', buttonSpec.borderRadius),
          paddingTop: resolveValue('spacing', paddingY),
          paddingBottom: resolveValue('spacing', paddingY),
          paddingLeft: resolveValue('spacing', paddingX),
          paddingRight: resolveValue('spacing', paddingX),
          fontSize: resolveValue('fontSizes', buttonSpec.fontSize),
          fontWeight: resolveValue('fontWeights', buttonSpec.fontWeight),
          boxShadow: resolveValue('shadows', buttonSpec.shadow),
        }}
      >
        Button Text
      </button>
    );
  }

  if (componentType === 'cards') {
    const cardSpec = spec as CardVariantSpec;
    const padding = cardSpec.padding[0] || '16px';

    return (
      <div
        style={{
          backgroundColor: resolveColor(cardSpec.background),
          borderColor: resolveColor(cardSpec.borderColor),
          borderWidth: resolveValue('spacing', cardSpec.borderWidth),
          borderStyle: 'solid',
          borderRadius: resolveValue('radii', cardSpec.borderRadius),
          padding: resolveValue('spacing', padding),
          boxShadow: resolveValue('shadows', cardSpec.shadow),
        }}
        className="min-w-[100px]"
      >
        <div className="mb-1 text-sm font-medium">Card</div>
        <div className="text-xs opacity-70">Content</div>
      </div>
    );
  }

  return null;
}

function SpecEditor({
  componentType,
  spec,
  onChange,
}: {
  componentType: string;
  spec: ButtonVariantSpec | TextVariantSpec | CardVariantSpec;
  onChange: (spec: ButtonVariantSpec | TextVariantSpec | CardVariantSpec) => void;
}) {
  const { state } = useWizard();

  const getTokens = (category: string): string[] => {
    const tokens = state.tokens[category as keyof typeof state.tokens];
    if (!tokens) return [];
    if (category === 'colors') {
      return Object.keys(tokens);
    }
    return Object.keys(tokens as Record<string, string>);
  };

  const updateSpec = (property: string, value: string | [string] | [string, string]) => {
    onChange({ ...spec, [property]: value } as typeof spec);
  };

  const renderSelect = (property: string, category: string, value: string) => (
    <tr key={property}>
      <td className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">{property}</td>
      <td className="px-3 py-2">
        <select
          value={value}
          onChange={e => updateSpec(property, e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        >
          {getTokens(category).map(key => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );

  const rows: React.ReactNode[] = [];

  if (componentType === 'buttons') {
    const buttonSpec = spec as ButtonVariantSpec;
    rows.push(renderSelect('background', 'colors', buttonSpec.background));
    rows.push(renderSelect('color', 'colors', buttonSpec.color));
    rows.push(renderSelect('borderColor', 'colors', buttonSpec.borderColor));
    rows.push(renderSelect('borderWidth', 'spacing', buttonSpec.borderWidth));
    rows.push(renderSelect('borderRadius', 'radii', buttonSpec.borderRadius));
    rows.push(
      <tr key="padding">
        <td className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">padding</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <select
              value={buttonSpec.padding[0]}
              onChange={e =>
                updateSpec('padding', [e.target.value, buttonSpec.padding[1] || e.target.value])
              }
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              {getTokens('spacing').map(key => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <span className="text-gray-400">,</span>
            <select
              value={buttonSpec.padding[1] || buttonSpec.padding[0]}
              onChange={e => updateSpec('padding', [buttonSpec.padding[0], e.target.value])}
              className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              {getTokens('spacing').map(key => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </td>
      </tr>
    );
    rows.push(renderSelect('fontSize', 'fontSizes', buttonSpec.fontSize));
    rows.push(renderSelect('fontWeight', 'fontWeights', buttonSpec.fontWeight));
    rows.push(renderSelect('fontFamily', 'fontFamilies', buttonSpec.fontFamily));
    rows.push(renderSelect('shadow', 'shadows', buttonSpec.shadow));
  } else if (componentType === 'text') {
    const textSpec = spec as TextVariantSpec;
    rows.push(renderSelect('color', 'colors', textSpec.color));
    rows.push(renderSelect('fontSize', 'fontSizes', textSpec.fontSize));
    rows.push(renderSelect('fontWeight', 'fontWeights', textSpec.fontWeight));
    rows.push(renderSelect('fontFamily', 'fontFamilies', textSpec.fontFamily));
    rows.push(renderSelect('lineHeight', 'lineHeights', textSpec.lineHeight));
  } else if (componentType === 'cards') {
    const cardSpec = spec as CardVariantSpec;
    rows.push(renderSelect('background', 'colors', cardSpec.background));
    rows.push(renderSelect('borderColor', 'colors', cardSpec.borderColor));
    rows.push(renderSelect('borderWidth', 'spacing', cardSpec.borderWidth));
    rows.push(renderSelect('borderRadius', 'radii', cardSpec.borderRadius));
    rows.push(
      <tr key="padding">
        <td className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">padding</td>
        <td className="px-3 py-2">
          <select
            value={cardSpec.padding[0]}
            onChange={e => updateSpec('padding', [e.target.value])}
            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            {getTokens('spacing').map(key => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </td>
      </tr>
    );
    rows.push(renderSelect('shadow', 'shadows', cardSpec.shadow));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Property
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Token
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {rows}
        </tbody>
      </table>
    </div>
  );
}
