'use client';

import { useState } from 'react';
import { useWizard } from '@/hooks/use-wizard';
import { TokenMappings } from './token-mappings';
import type { ExtractedVariant } from '@/lib/wizard-types';

interface VariantDetailProps {
  variant: ExtractedVariant;
}

export function VariantDetail({ variant }: VariantDetailProps) {
  const { renameVariant } = useWizard();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(variant.name);

  const handleRename = () => {
    if (nameInput.trim()) {
      renameVariant(nameInput.trim());
      setIsRenaming(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600 border-gray-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    editing: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    editing: 'Editing',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-lg font-semibold dark:border-gray-600 dark:bg-gray-800"
                autoFocus
              />
              <button
                type="button"
                onClick={handleRename}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRenaming(false);
                  setNameInput(variant.name);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h3
              className="cursor-pointer text-lg font-semibold text-gray-900 hover:text-blue-600 dark:text-white"
              onClick={() => setIsRenaming(true)}
            >
              {variant.name || 'Unnamed Variant'}
            </h3>
          )}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[variant.status]}`}
          >
            {statusLabels[variant.status]}
          </span>
        </div>
        {variant.isManual && <span className="text-xs text-gray-500">Manually created</span>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h4 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">Original</h4>
          {variant.instances && variant.instances.length > 0 ? (
            <div className="flex min-h-[150px] items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
              {variant.instances[0]?.croppedScreenshot ? (
                <img
                  src={variant.instances[0].croppedScreenshot}
                  alt="Original component"
                  className="max-h-[150px] object-contain"
                />
              ) : (
                <span className="text-sm text-gray-400">No screenshot available</span>
              )}
            </div>
          ) : (
            <div className="flex min-h-[150px] items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400 dark:bg-gray-800">
              {variant.isManual ? 'Manually created' : 'No screenshot'}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h4 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
            Your Render (Live)
          </h4>
          <div className="flex min-h-[150px] items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
            <VariantPreview variant={variant} />
          </div>
        </div>
      </div>

      {variant.instances && variant.instances.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            Location on Page
          </h4>
          <p className="font-mono text-xs text-gray-500">
            Selector: {variant.instances[0]?.selector}
          </p>
          <p className="text-xs text-gray-500">Instances: {variant.instances.length} found</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h4 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          Token Mappings
        </h4>
        <TokenMappings
          spec={variant.spec}
          {...(variant.rawStyles && { rawStyles: variant.rawStyles })}
        />
      </div>
    </div>
  );
}

function VariantPreview({ variant }: { variant: ExtractedVariant }) {
  const { state } = useWizard();
  const spec = variant.spec;

  const resolveColor = (key: string): string => {
    const token = state.tokens.colors[key];
    return token?.value || key;
  };

  const resolveValue = (category: string, key: string): string => {
    const tokens = state.tokens[category as keyof typeof state.tokens];
    if (typeof tokens === 'object' && tokens !== null) {
      if (category === 'colors') {
        const colorToken = tokens as Record<string, { value: string }>;
        return colorToken[key]?.value || key;
      }
      const simpleTokens = tokens as Record<string, string>;
      return simpleTokens[key] || key;
    }
    return key;
  };

  if ('fontSize' in spec && 'lineHeight' in spec && !('padding' in spec)) {
    const textSpec = spec as {
      color: string;
      fontSize: string;
      fontWeight: string;
      fontFamily: string;
      lineHeight: string;
    };
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

  if ('background' in spec && 'padding' in spec) {
    const hasColor = 'color' in spec;
    const buttonSpec = spec as {
      background: string;
      color?: string;
      borderColor: string;
      borderWidth: string;
      borderRadius: string;
      padding: [string] | [string, string];
      fontSize?: string;
      fontWeight?: string;
      shadow: string;
    };

    const paddingY = buttonSpec.padding[0] || '8px';
    const paddingX = buttonSpec.padding[1] || buttonSpec.padding[0] || '16px';

    if (hasColor) {
      return (
        <button
          type="button"
          style={{
            backgroundColor: resolveColor(buttonSpec.background),
            color: resolveColor(buttonSpec.color || 'foreground'),
            borderColor: resolveColor(buttonSpec.borderColor),
            borderWidth: resolveValue('spacing', buttonSpec.borderWidth),
            borderStyle: 'solid',
            borderRadius: resolveValue('radii', buttonSpec.borderRadius),
            paddingTop: resolveValue('spacing', paddingY),
            paddingBottom: resolveValue('spacing', paddingY),
            paddingLeft: resolveValue('spacing', paddingX),
            paddingRight: resolveValue('spacing', paddingX),
            fontSize: buttonSpec.fontSize
              ? resolveValue('fontSizes', buttonSpec.fontSize)
              : undefined,
            fontWeight: buttonSpec.fontWeight
              ? resolveValue('fontWeights', buttonSpec.fontWeight)
              : undefined,
            boxShadow: resolveValue('shadows', buttonSpec.shadow),
          }}
        >
          Button Text
        </button>
      );
    }

    return (
      <div
        style={{
          backgroundColor: resolveColor(buttonSpec.background),
          borderColor: resolveColor(buttonSpec.borderColor),
          borderWidth: resolveValue('spacing', buttonSpec.borderWidth),
          borderStyle: 'solid',
          borderRadius: resolveValue('radii', buttonSpec.borderRadius),
          paddingTop: resolveValue('spacing', paddingY),
          paddingBottom: resolveValue('spacing', paddingY),
          paddingLeft: resolveValue('spacing', paddingX),
          paddingRight: resolveValue('spacing', paddingX),
          boxShadow: resolveValue('shadows', buttonSpec.shadow),
        }}
        className="min-w-[120px]"
      >
        <div className="mb-2 text-sm font-medium">Card Title</div>
        <div className="text-xs text-gray-600">Card content</div>
      </div>
    );
  }

  return <span className="text-sm text-gray-400">Preview unavailable</span>;
}
