'use client';

import { useState } from 'react';

const CATEGORIES = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'radii', label: 'Radii' },
  { id: 'shadows', label: 'Shadows' },
] as const;

export function TokenCategoryNav() {
  const [activeCategory, setActiveCategory] = useState<string>('colors');

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`token-category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      <p
        className="mb-4 text-xs font-medium uppercase tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        Tokens
      </p>
      <nav className="space-y-0.5">
        {CATEGORIES.map(category => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => scrollToCategory(category.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-all hover:opacity-70"
              style={{
                color: isActive ? 'var(--foreground)' : 'var(--muted)',
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {isActive && <span style={{ color: 'var(--accent)' }}>→</span>}
              {category.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
