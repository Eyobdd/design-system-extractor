'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface ColorPaletteProps {
  colors: Record<string, string>;
  title?: string;
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLight = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 186;
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={handleCopy}
        className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Copy ${name} color value ${value}`}
      >
        <div
          className="h-24 w-full transition-transform group-hover:scale-105"
          style={{ backgroundColor: value }}
        />
        <div className="p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium capitalize text-gray-900 dark:text-gray-100">{name}</span>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
        </div>
      </button>
      {copied && (
        <div
          className={`absolute left-1/2 top-8 -translate-x-1/2 rounded px-2 py-1 text-xs font-medium ${
            isLight(value) ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}
        >
          Copied!
        </div>
      )}
    </div>
  );
}

export function ColorPalette({ colors, title = 'Colors' }: ColorPaletteProps) {
  if (Object.keys(colors).length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">No colors extracted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Object.entries(colors).map(([name, value]) => (
          <ColorSwatch key={name} name={name} value={value} />
        ))}
      </div>
    </div>
  );
}
