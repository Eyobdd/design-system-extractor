'use client';

import { useState, useEffect } from 'react';

interface ShadowInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface ShadowValues {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

function parseShadow(value: string): ShadowValues {
  const defaults: ShadowValues = {
    offsetX: 0,
    offsetY: 1,
    blur: 2,
    spread: 0,
    color: '#000000',
    opacity: 0.05,
  };

  if (value === 'none' || !value) return defaults;

  // Try to parse shadow string: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)"
  const rgbaMatch = value.match(
    /(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/
  );
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[5] ?? '0', 10);
    const g = parseInt(rgbaMatch[6] ?? '0', 10);
    const b = parseInt(rgbaMatch[7] ?? '0', 10);
    return {
      offsetX: parseInt(rgbaMatch[1] ?? '0', 10),
      offsetY: parseInt(rgbaMatch[2] ?? '0', 10),
      blur: parseInt(rgbaMatch[3] ?? '0', 10),
      spread: parseInt(rgbaMatch[4] ?? '0', 10),
      color: rgbToHex(r, g, b),
      opacity: parseFloat(rgbaMatch[8] ?? '0.05'),
    };
  }

  return defaults;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1] ?? '0', 16),
        g: parseInt(result[2] ?? '0', 16),
        b: parseInt(result[3] ?? '0', 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function formatShadow(values: ShadowValues): string {
  const { r, g, b } = hexToRgb(values.color);
  return `${values.offsetX}px ${values.offsetY}px ${values.blur}px ${values.spread}px rgba(${r}, ${g}, ${b}, ${values.opacity})`;
}

export function ShadowInput({ value, onChange, disabled = false }: ShadowInputProps) {
  const [values, setValues] = useState<ShadowValues>(() => parseShadow(value));

  useEffect(() => {
    setValues(parseShadow(value));
  }, [value]);

  const updateValue = (key: keyof ShadowValues, newValue: number | string) => {
    const updated = { ...values, [key]: newValue };
    setValues(updated);
    onChange(formatShadow(updated));
  };

  const shadowStyle = formatShadow(values);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
            Offset X
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={values.offsetX}
              onChange={e => updateValue('offsetX', parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-16 rounded-l px-2 py-1.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRight: 'none',
                color: 'var(--foreground)',
              }}
            />
            <span
              className="rounded-r px-2 py-1.5 text-sm"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
              }}
            >
              px
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
            Offset Y
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={values.offsetY}
              onChange={e => updateValue('offsetY', parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-16 rounded-l px-2 py-1.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRight: 'none',
                color: 'var(--foreground)',
              }}
            />
            <span
              className="rounded-r px-2 py-1.5 text-sm"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
              }}
            >
              px
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
            Blur
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              value={values.blur}
              onChange={e => updateValue('blur', Math.max(0, parseInt(e.target.value) || 0))}
              disabled={disabled}
              className="w-16 rounded-l px-2 py-1.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRight: 'none',
                color: 'var(--foreground)',
              }}
            />
            <span
              className="rounded-r px-2 py-1.5 text-sm"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
              }}
            >
              px
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
            Spread
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={values.spread}
              onChange={e => updateValue('spread', parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="w-16 rounded-l px-2 py-1.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRight: 'none',
                color: 'var(--foreground)',
              }}
            />
            <span
              className="rounded-r px-2 py-1.5 text-sm"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
              }}
            >
              px
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
            Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={values.color}
              onChange={e => updateValue('color', e.target.value)}
              disabled={disabled}
              className="h-8 w-8 cursor-pointer rounded border-none"
              style={{ backgroundColor: values.color }}
            />
            <input
              type="text"
              value={values.color}
              onChange={e => updateValue('color', e.target.value)}
              disabled={disabled}
              className="w-24 rounded px-2 py-1.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
            Opacity
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={values.opacity}
            onChange={e =>
              updateValue('opacity', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))
            }
            disabled={disabled}
            className="w-24 rounded px-2 py-1.5 text-sm outline-none"
            style={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <label className="mb-2 block text-xs" style={{ color: 'var(--muted)' }}>
          Preview
        </label>
        <div
          className="flex h-16 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
        >
          <div
            className="rounded-lg px-6 py-3 text-sm"
            style={{
              backgroundColor: 'white',
              boxShadow: shadowStyle,
              color: 'var(--foreground)',
            }}
          >
            Shadow
          </div>
        </div>
        <p className="mt-2 text-xs font-mono" style={{ color: 'var(--muted)' }}>
          {shadowStyle}
        </p>
      </div>
    </div>
  );
}
