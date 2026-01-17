'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useWizard } from '@/hooks/use-wizard';
import type { TokenValue } from '@/lib/wizard-types';

export function ColorTable() {
  const { state, updateToken, addToken, deleteToken } = useWizard();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<{ name: string; value: string }>({
    name: '',
    value: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newToken, setNewToken] = useState({ name: '', value: '#000000' });

  const colors = state.tokens.colors;
  const isLocked = state.tokensLocked;

  const handleEdit = (key: string, token: TokenValue) => {
    setEditingKey(key);
    setEditValue({ name: key, value: token.value });
  };

  const handleSaveEdit = () => {
    if (!editingKey || !editValue.name.trim() || !editValue.value.trim()) return;

    if (editValue.name !== editingKey) {
      deleteToken('colors', editingKey);
      addToken('colors', editValue.name, {
        ...colors[editingKey]!,
        value: editValue.value,
      });
    } else {
      updateToken('colors', editingKey, {
        ...colors[editingKey]!,
        value: editValue.value,
      });
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

    addToken('colors', newToken.name, {
      value: newToken.value,
      source: 'manual',
      usageCount: 0,
    });

    setNewToken({ name: '', value: '#000000' });
    setIsAdding(false);
  };

  const handleDelete = (key: string) => {
    deleteToken('colors', key);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
          Colors
        </h3>
        {!isLocked && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Usage
              </th>
              {!isLocked && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {Object.entries(colors).map(([key, token]) => (
              <tr key={key}>
                {editingKey === key ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editValue.name}
                        onChange={e => setEditValue(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editValue.value}
                          onChange={e => setEditValue(prev => ({ ...prev, value: e.target.value }))}
                          className="h-8 w-8 cursor-pointer rounded border-0"
                        />
                        <input
                          type="text"
                          value={editValue.value}
                          onChange={e => setEditValue(prev => ({ ...prev, value: e.target.value }))}
                          className="w-24 rounded border border-gray-300 px-2 py-1 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{token.source}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{token.usageCount}x</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="mr-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {key}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: token.value }}
                        />
                        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                          {token.value}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {token.cssVarName || token.source}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {token.usageCount}x
                    </td>
                    {!isLocked && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(key, token)}
                          className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(key)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}

            {isAdding && (
              <tr>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newToken.name}
                    onChange={e => setNewToken(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Token name"
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newToken.value}
                      onChange={e => setNewToken(prev => ({ ...prev, value: e.target.value }))}
                      className="h-8 w-8 cursor-pointer rounded border-0"
                    />
                    <input
                      type="text"
                      value={newToken.value}
                      onChange={e => setNewToken(prev => ({ ...prev, value: e.target.value }))}
                      className="w-24 rounded border border-gray-300 px-2 py-1 font-mono text-sm dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">manual</td>
                <td className="px-4 py-3 text-sm text-gray-500">0x</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="mr-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewToken({ name: '', value: '#000000' });
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}

            {Object.keys(colors).length === 0 && !isAdding && (
              <tr>
                <td
                  colSpan={isLocked ? 4 : 5}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No colors extracted. Click &quot;Add Color&quot; to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
