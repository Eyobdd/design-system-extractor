'use client';

import { useState, useEffect } from 'react';

type Unit = 'px' | 'rem' | 'em' | '%';

interface UnitInputProps {
  value: string;
  onChange: (value: string) => void;
  units?: Unit[];
  allowDecimals?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

function parseValue(value: string): { number: string; unit: Unit } {
  const match = value.match(/^([\d.]+)(px|rem|em|%)$/);
  if (match) {
    return { number: match[1] ?? '', unit: (match[2] ?? 'px') as Unit };
  }
  // Try to parse as just a number (for unitless values)
  const numMatch = value.match(/^([\d.]+)$/);
  if (numMatch) {
    return { number: numMatch[1] ?? '', unit: 'px' };
  }
  return { number: '', unit: 'px' };
}

export function UnitInput({
  value,
  onChange,
  units = ['px', 'rem', 'em', '%'],
  allowDecimals = true,
  placeholder = '0',
  disabled = false,
}: UnitInputProps) {
  const parsed = parseValue(value);
  const [numberValue, setNumberValue] = useState(parsed.number);
  const [unit, setUnit] = useState<Unit>(parsed.unit);

  // Sync with external value changes
  useEffect(() => {
    const parsed = parseValue(value);
    setNumberValue(parsed.number);
    setUnit(parsed.unit);
  }, [value]);

  const handleNumberChange = (newNumber: string) => {
    // Allow empty, digits, and optionally decimal point
    const regex = allowDecimals ? /^[\d.]*$/ : /^\d*$/;
    if (!regex.test(newNumber)) return;

    setNumberValue(newNumber);
    if (newNumber) {
      onChange(`${newNumber}${unit}`);
    }
  };

  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
    if (numberValue) {
      onChange(`${numberValue}${newUnit}`);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        value={numberValue}
        onChange={e => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-20 rounded-l px-3 py-1.5 text-sm outline-none"
        style={{
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRight: 'none',
          color: 'var(--foreground)',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <select
        value={unit}
        onChange={e => handleUnitChange(e.target.value as Unit)}
        disabled={disabled}
        className="rounded-r px-2 py-1.5 text-sm outline-none"
        style={{
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          color: 'var(--muted)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {units.map(u => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}

interface UnitlessInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UnitlessInput({
  value,
  onChange,
  placeholder = '1.5',
  disabled = false,
}: UnitlessInputProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    // Allow empty, digits, and decimal point
    if (!/^[\d.]*$/.test(newValue)) return;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={inputValue}
      onChange={e => handleChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-24 rounded px-3 py-1.5 text-sm outline-none"
      style={{
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        color: 'var(--foreground)',
        opacity: disabled ? 0.5 : 1,
      }}
    />
  );
}
