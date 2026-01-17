'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useWizard } from '@/hooks/use-wizard';
import type { TokenCategory } from '@/lib/wizard-types';
import { UnitInput, UnitlessInput } from './unit-input';
import { ShadowInput } from './shadow-input';

interface SimpleTokenTableProps {
  category: Exclude<TokenCategory, 'colors'>;
  title: string;
  tokens: Record<string, string>;
  placeholder?: string;
}

type Unit = 'px' | 'rem' | 'em' | '%';

const CATEGORY_UNITS: Record<string, Unit[]> = {
  spacing: ['px', 'rem', 'em', '%'],
  radii: ['px', 'rem', 'em', '%'],
  fontSizes: ['px', 'rem', 'em'],
};

const CATEGORY_DEFAULTS: Record<string, string> = {
  spacing: '16px',
  radii: '8px',
  fontSizes: '16px',
  fontWeights: '400',
  fontFamilies: 'system-ui, sans-serif',
  lineHeights: '1.5',
  shadows: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
};

export function SimpleTokenTable({
  category,
  title,
  tokens,
  placeholder = 'Value',
}: SimpleTokenTableProps) {
  void placeholder; // Satisfies linter - placeholder is used in the interface but not in this component
  const { state, updateSimpleToken, addSimpleToken, deleteSimpleToken } = useWizard();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<{ name: string; value: string }>({
    name: '',
    value: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newToken, setNewToken] = useState({ name: '', value: CATEGORY_DEFAULTS[category] || '' });
  const isLocked = state.tokensLocked;

  // Render appropriate input based on category
  const renderValueInput = (value: string, onChange: (v: string) => void) => {
    if (category === 'shadows') {
      return <ShadowInput value={value} onChange={onChange} disabled={isLocked} />;
    }
    if (category === 'lineHeights') {
      return <UnitlessInput value={value} onChange={onChange} disabled={isLocked} />;
    }
    if (['spacing', 'radii', 'fontSizes'].includes(category)) {
      return (
        <UnitInput
          value={value}
          onChange={onChange}
          units={CATEGORY_UNITS[category] || ['px', 'rem', 'em', '%']}
          disabled={isLocked}
        />
      );
    }
    // Default: plain text input for fontFamilies, fontWeights
    return (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={isLocked}
        className="w-full rounded px-2 py-1 text-sm outline-none"
        style={{
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        }}
      />
    );
  };

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue({ name: key, value });
  };

  const handleSaveEdit = () => {
    if (!editingKey || !editValue.name.trim() || !editValue.value.trim()) return;

    if (editValue.name !== editingKey) {
      deleteSimpleToken(category, editingKey);
      addSimpleToken(category, editValue.name, editValue.value);
    } else {
      updateSimpleToken(category, editingKey, editValue.value);
    }

    setEditingKey(null);
    setEditValue({ name: '', value: '' });
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue({ name: '', value: '' });
  };

  const handleAdd = () => {
    if (!newToken.name.trim() || !newToken.value.trim()) return;

    addSimpleToken(category, newToken.name, newToken.value);
    setNewToken({ name: '', value: '' });
    setIsAdding(false);
  };

  const handleDelete = (key: string) => {
    deleteSimpleToken(category, key);
  };

  const tokenEntries = Object.entries(tokens);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>
        {!isLocked && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Value
              </th>
              {!isLocked && (
                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {tokenEntries.map(([key, value]) => (
              <tr key={key}>
                {editingKey === key ? (
                  <>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={editValue.name}
                        onChange={e => setEditValue(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {renderValueInput(editValue.value, v =>
                        setEditValue(prev => ({ ...prev, value: v }))
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="mr-2 text-xs text-blue-600 hover:text-blue-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                      {key}
                    </td>
                    <td className="px-3 py-2 font-mono text-sm text-gray-600 dark:text-gray-400">
                      {value}
                    </td>
                    {!isLocked && (
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(key, value)}
                          className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(key)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}

            {isAdding && (
              <tr>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={newToken.name}
                    onChange={e => setNewToken(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Name"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </td>
                <td className="px-3 py-2">
                  {renderValueInput(newToken.value, (v: string) =>
                    setNewToken(prev => ({ ...prev, value: v }))
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="mr-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewToken({ name: '', value: '' });
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}

            {tokenEntries.length === 0 && !isAdding && (
              <tr>
                <td
                  colSpan={isLocked ? 2 : 3}
                  className="px-3 py-6 text-center text-sm text-gray-500"
                >
                  No tokens. Click &quot;Add&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
