'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Check, X } from 'lucide-react';
import { useWizard } from '@/hooks/use-wizard';
import type { ComponentType, VariantStatus } from '@/lib/wizard-types';
import { Tooltip } from '../tooltip';

const COMPONENT_LABELS: Record<ComponentType, string> = {
  buttons: 'Buttons',
  text: 'Text',
  cards: 'Cards',
};

export function ComponentTree() {
  const { state, selectComponent, selectVariant, startNewVariant } = useWizard();
  const [expandedComponents, setExpandedComponents] = useState<Set<ComponentType>>(
    new Set(['buttons', 'text', 'cards'])
  );

  const toggleComponent = (component: ComponentType) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(component)) {
      newExpanded.delete(component);
    } else {
      newExpanded.add(component);
    }
    setExpandedComponents(newExpanded);
  };

  const handleVariantClick = (component: ComponentType, index: number) => {
    if (state.currentComponent !== component) {
      selectComponent(component);
    }
    selectVariant(index);
  };

  const handleAddNew = (component: ComponentType) => {
    if (state.variantsLocked) return;
    startNewVariant(component);
  };

  const getStatusIcon = (status: VariantStatus) => {
    switch (status) {
      case 'approved':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'rejected':
        return <X className="h-3 w-3 text-red-500" />;
      case 'editing':
        return <span className="h-2 w-2 rounded-full bg-blue-500" />;
      default:
        return <span className="h-2 w-2 rounded-full border border-gray-400" />;
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Components
      </h2>
      <nav className="space-y-1">
        {(Object.keys(COMPONENT_LABELS) as ComponentType[]).map(component => {
          const variants = state.variants[component];
          const isExpanded = expandedComponents.has(component);
          const isCurrentComponent = state.currentComponent === component;

          return (
            <div key={component}>
              <button
                type="button"
                onClick={() => toggleComponent(component)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {COMPONENT_LABELS[component]}
                  <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                    {variants.length}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="ml-4 space-y-0.5 border-l border-gray-200 pl-2 dark:border-gray-700">
                  {variants.map((variant, index) => {
                    const isSelected =
                      isCurrentComponent &&
                      state.currentVariantIndex === index &&
                      !state.isCreatingNewVariant;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleVariantClick(component, index)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        {isSelected && <span className="text-blue-600">→</span>}
                        {getStatusIcon(variant.status)}
                        <span className="truncate">{variant.name || 'Unnamed'}</span>
                      </button>
                    );
                  })}

                  {state.isCreatingNewVariant && isCurrentComponent && (
                    <div className="flex items-center gap-2 rounded bg-blue-50 px-2 py-1.5 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      <span>→</span>
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>(new)</span>
                    </div>
                  )}

                  <Tooltip
                    content={
                      state.variantsLocked
                        ? 'Variants are locked. Unlock variants to add a new one.'
                        : `Create a new ${COMPONENT_LABELS[component]} variant`
                    }
                  >
                    <span>
                      <button
                        type="button"
                        onClick={() => handleAddNew(component)}
                        disabled={state.variantsLocked}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      >
                        <Plus className="h-3 w-3" />
                        Add new
                      </button>
                    </span>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
