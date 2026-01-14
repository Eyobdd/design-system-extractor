'use client';

import type {
  PrimitiveComponentType,
  ButtonVariantSpec,
  CardVariantSpec,
  InputVariantSpec,
  TextVariantSpec,
  AnyVariantSpec,
} from '@extracted/types';

/**
 * Token to CSS value mappings
 * These would ideally come from the extracted design system
 */
const tokenMaps = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    white: '#ffffff',
    black: '#000000',
    'gray-50': '#f9fafb',
    'gray-100': '#f3f4f6',
    'gray-200': '#e5e7eb',
    'gray-700': '#374151',
    'gray-900': '#111827',
    transparent: 'transparent',
  } as Record<string, string>,
  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  } as Record<string, string>,
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  } as Record<string, string>,
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  } as Record<string, string>,
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as Record<string, string>,
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  } as Record<string, string>,
  shadow: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  } as Record<string, string>,
};

function resolveToken(
  map: Record<string, string>,
  key: string | null | undefined
): string | undefined {
  if (!key) return undefined;
  return map[key] ?? key;
}

interface VariantRendererProps {
  componentType: PrimitiveComponentType;
  spec: AnyVariantSpec;
  className?: string;
}

/**
 * Renders a primitive component with the given variant spec
 */
export function VariantRenderer({ componentType, spec, className = '' }: VariantRendererProps) {
  switch (componentType) {
    case 'button':
      return <ButtonRenderer spec={spec as ButtonVariantSpec} className={className} />;
    case 'card':
      return <CardRenderer spec={spec as CardVariantSpec} className={className} />;
    case 'input':
      return <InputRenderer spec={spec as InputVariantSpec} className={className} />;
    case 'text':
      return <TextRenderer spec={spec as TextVariantSpec} className={className} />;
    default:
      return <div className="text-sm text-gray-500">Unknown component type: {componentType}</div>;
  }
}

interface ButtonRendererProps {
  spec: ButtonVariantSpec;
  className?: string;
}

function ButtonRenderer({ spec, className = '' }: ButtonRendererProps) {
  const style: React.CSSProperties = {
    backgroundColor: resolveToken(tokenMaps.colors, spec.surface),
    color: resolveToken(tokenMaps.colors, spec.text),
    paddingLeft: spec.paddingX,
    paddingRight: spec.paddingX,
    paddingTop: spec.paddingY,
    paddingBottom: spec.paddingY,
    borderRadius: resolveToken(tokenMaps.radius, spec.radius),
    borderColor: resolveToken(tokenMaps.colors, spec.border ?? undefined),
    borderWidth: spec.border ? '1px' : '0',
    borderStyle: spec.border ? 'solid' : 'none',
    fontSize: resolveToken(tokenMaps.fontSize, spec.fontSize),
    fontWeight: resolveToken(tokenMaps.fontWeight, spec.fontWeight),
  };

  return (
    <button type="button" style={style} className={`transition-colors ${className}`}>
      Button Text
    </button>
  );
}

interface CardRendererProps {
  spec: CardVariantSpec;
  className?: string;
}

function CardRenderer({ spec, className = '' }: CardRendererProps) {
  const style: React.CSSProperties = {
    backgroundColor: resolveToken(tokenMaps.colors, spec.surface),
    padding: resolveToken(tokenMaps.spacing, spec.padding),
    borderRadius: resolveToken(tokenMaps.radius, spec.radius),
    borderColor: resolveToken(tokenMaps.colors, spec.border ?? undefined),
    borderWidth: spec.border ? '1px' : '0',
    borderStyle: spec.border ? 'solid' : 'none',
    boxShadow: resolveToken(tokenMaps.shadow, spec.shadow ?? undefined),
  };

  return (
    <div style={style} className={className}>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>Card Header</div>
      <div>Card body content goes here. This is sample text to demonstrate the card styling.</div>
    </div>
  );
}

interface InputRendererProps {
  spec: InputVariantSpec;
  className?: string;
}

function InputRenderer({ spec, className = '' }: InputRendererProps) {
  const style: React.CSSProperties = {
    backgroundColor: resolveToken(tokenMaps.colors, spec.surface),
    color: resolveToken(tokenMaps.colors, spec.text),
    paddingLeft: resolveToken(tokenMaps.spacing, spec.paddingX),
    paddingRight: resolveToken(tokenMaps.spacing, spec.paddingX),
    paddingTop: resolveToken(tokenMaps.spacing, spec.paddingY),
    paddingBottom: resolveToken(tokenMaps.spacing, spec.paddingY),
    borderRadius: resolveToken(tokenMaps.radius, spec.radius),
    borderColor: resolveToken(tokenMaps.colors, spec.border),
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: resolveToken(tokenMaps.fontSize, spec.fontSize),
    width: '100%',
    outline: 'none',
  };

  return (
    <input type="text" placeholder="Input text" style={style} className={className} readOnly />
  );
}

interface TextRendererProps {
  spec: TextVariantSpec;
  className?: string;
}

function TextRenderer({ spec, className = '' }: TextRendererProps) {
  const style: React.CSSProperties = {
    color: resolveToken(tokenMaps.colors, spec.color),
    fontSize: resolveToken(tokenMaps.fontSize, spec.size),
    fontWeight: resolveToken(tokenMaps.fontWeight, spec.weight),
    lineHeight: resolveToken(tokenMaps.lineHeight, spec.lineHeight),
  };

  return (
    <p style={style} className={className}>
      Sample text content demonstrating the typography style.
    </p>
  );
}

interface VariantPreviewCardProps {
  componentType: PrimitiveComponentType;
  variantName: string;
  spec: AnyVariantSpec;
  status?: 'pending' | 'accepted' | 'failed' | 'dne';
}

/**
 * Card showing a rendered variant with its name and status
 */
export function VariantPreviewCard({
  componentType,
  variantName,
  spec,
  status = 'pending',
}: VariantPreviewCardProps) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dne: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const statusLabels = {
    pending: 'Pending Review',
    accepted: 'Accepted',
    failed: 'Failed',
    dne: 'Does Not Exist',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
            {componentType}
          </span>
          <h3 className="font-medium text-gray-900 dark:text-white">{variantName}</h3>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
      <div className="flex min-h-[60px] items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <VariantRenderer componentType={componentType} spec={spec} />
      </div>
    </div>
  );
}
