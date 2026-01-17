import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnitInput, UnitlessInput } from './unit-input';

describe('UnitInput', () => {
  it('renders with default value', () => {
    render(<UnitInput value="16px" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('16');
  });

  it('renders unit selector', () => {
    render(<UnitInput value="16px" onChange={vi.fn()} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('px');
  });

  it('calls onChange when number changes', () => {
    const onChange = vi.fn();
    render(<UnitInput value="16px" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '24' } });

    expect(onChange).toHaveBeenCalledWith('24px');
  });

  it('calls onChange when unit changes', () => {
    const onChange = vi.fn();
    render(<UnitInput value="16px" onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'rem' } });

    expect(onChange).toHaveBeenCalledWith('16rem');
  });

  it('renders all default units', () => {
    render(<UnitInput value="16px" onChange={vi.fn()} />);
    const select = screen.getByRole('combobox');

    expect(select).toContainHTML('<option value="px">px</option>');
    expect(select).toContainHTML('<option value="rem">rem</option>');
    expect(select).toContainHTML('<option value="em">em</option>');
    expect(select).toContainHTML('<option value="%">%</option>');
  });

  it('renders custom units', () => {
    render(<UnitInput value="16px" onChange={vi.fn()} units={['px', 'rem']} />);
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(2);
  });

  it('allows decimals by default', () => {
    const onChange = vi.fn();
    render(<UnitInput value="16px" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1.5' } });

    expect(onChange).toHaveBeenCalledWith('1.5px');
  });

  it('prevents decimals when allowDecimals is false', () => {
    const onChange = vi.fn();
    render(<UnitInput value="16px" onChange={onChange} allowDecimals={false} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1.5' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<UnitInput value="16px" onChange={vi.fn()} disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('parses unitless values as px', () => {
    render(<UnitInput value="16" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('16');
    expect(screen.getByRole('combobox')).toHaveValue('px');
  });

  it('handles empty value gracefully', () => {
    render(<UnitInput value="" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('syncs with external value changes', () => {
    const { rerender } = render(<UnitInput value="16px" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('16');

    rerender(<UnitInput value="24rem" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('24');
    expect(screen.getByRole('combobox')).toHaveValue('rem');
  });
});

describe('UnitlessInput', () => {
  it('renders with value', () => {
    render(<UnitlessInput value="1.5" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('1.5');
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(<UnitlessInput value="1.5" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2' } });

    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('allows decimal values', () => {
    const onChange = vi.fn();
    render(<UnitlessInput value="1" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1.75' } });

    expect(onChange).toHaveBeenCalledWith('1.75');
  });

  it('prevents non-numeric input', () => {
    const onChange = vi.fn();
    render(<UnitlessInput value="1.5" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<UnitlessInput value="1.5" onChange={vi.fn()} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('shows placeholder', () => {
    render(<UnitlessInput value="" onChange={vi.fn()} placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('syncs with external value changes', () => {
    const { rerender } = render(<UnitlessInput value="1.5" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('1.5');

    rerender(<UnitlessInput value="2.0" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('2.0');
  });
});
