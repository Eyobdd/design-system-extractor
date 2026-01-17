'use client';

import { useState } from 'react';
import { Palette, Layers, Code, FileCode } from 'lucide-react';

const SECTIONS = [
  { id: 'tokens', label: 'Tokens', icon: Palette },
  { id: 'variants', label: 'Variants', icon: Layers },
  { id: 'usage', label: 'Usage', icon: Code },
  { id: 'code', label: 'Code', icon: FileCode },
] as const;

export function ReviewSectionsNav() {
  const [activeSection, setActiveSection] = useState<string>('tokens');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`review-section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Sections
      </h2>
      <nav className="space-y-1">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {isActive && <span className="text-blue-600">→</span>}
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
