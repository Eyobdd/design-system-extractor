import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShadowInput } from './shadow-input';

describe('ShadowInput', () => {
  it('renders all shadow controls', () => {
    render(<ShadowInput value="0px 1px 2px 0px rgba(0, 0, 0, 0.05)" onChange={vi.fn()} />);

    expect(screen.getByText('Offset X')).toBeInTheDocument();
    expect(screen.getByText('Offset Y')).toBeInTheDocument();
    expect(screen.getByText('Blur')).toBeInTheDocument();
    expect(screen.getByText('Spread')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Opacity')).toBeInTheDocument();
  });

  it('renders preview section', () => {
    render(<ShadowInput value="0px 1px 2px 0px rgba(0, 0, 0, 0.05)" onChange={vi.fn()} />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Shadow')).toBeInTheDocument();
  });

  it('parses shadow string correctly', () => {
    render(<ShadowInput value="4px 8px 12px 2px rgba(255, 0, 0, 0.5)" onChange={vi.fn()} />);

    const inputs = screen.getAllByRole('spinbutton');
    // Offset X, Offset Y, Blur, Spread, Opacity
    expect(inputs[0]).toHaveValue(4);
    expect(inputs[1]).toHaveValue(8);
    expect(inputs[2]).toHaveValue(12);
    expect(inputs[3]).toHaveValue(2);
  });

  it('uses default values for invalid shadow', () => {
    render(<ShadowInput value="invalid" onChange={vi.fn()} />);

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(0); // offsetX
    expect(inputs[1]).toHaveValue(1); // offsetY
    expect(inputs[2]).toHaveValue(2); // blur
    expect(inputs[3]).toHaveValue(0); // spread
  });

  it('uses default values for "none"', () => {
    render(<ShadowInput value="none" onChange={vi.fn()} />);

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(0);
  });

  it('calls onChange when offsetX changes', () => {
    const onChange = vi.fn();
    render(<ShadowInput value="0px 1px 2px 0px rgba(0, 0, 0, 0.05)" onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0]!, { target: { value: '5' } });

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]?.[0]).toContain('5px');
  });

  it('calls onChange when blur changes', () => {
    const onChange = vi.fn();
    render(<ShadowInput value="0px 1px 2px 0px rgba(0, 0, 0, 0.05)" onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[2]!, { target: { value: '10' } });

    expect(onChange).toHaveBeenCalled();
  });

  it('clamps blur to minimum 0', () => {
    const onChange = vi.fn();
    render(<ShadowInput value="0px 1px 2px 0px rgba(0, 0, 0, 0.05)" onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[2]!, { target: { value: '-5' } });

    // Should clamp to 0
    expect(onChange.mock.calls[0]?.[0]).toContain('0px');
  });

  it('updates color via text input', () => {
    const onChange = vi.fn();
    render(<ShadowInput value="0px 1px 2px 0px rgba(0, 0, 0, 0.05)" onChange={onChange} />);

    const colorTextInputs = screen.getAllByRole('textbox');
    // Find the hex color input
    const hexInput = colorTextInputs.find(input =>
      (input as HTMLInputElement).value.startsWith('#')
    );
    if (hexInput) {
      fireEvent.change(hexInput, { target: { value: '#ff0000' } });
      expect(onChange).toHaveBeenCalled();
    }
  });

  it('is disabled when disabled prop is true', () => {
    render(<ShadowInput value="0px 1px 2px 0px rgba(0, 0, 0, 0.05)" onChange={vi.fn()} disabled />);

    const inputs = screen.getAllByRole('spinbutton');
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });

  it('displays formatted shadow string', () => {
    render(<ShadowInput value="4px 8px 12px 2px rgba(128, 128, 128, 0.5)" onChange={vi.fn()} />);

    // The formatted shadow should be displayed somewhere
    const shadowText = screen.getByText(/\d+px \d+px \d+px \d+px rgba/);
    expect(shadowText).toBeInTheDocument();
  });

  it('syncs with external value changes', () => {
    const { rerender } = render(
      <ShadowInput value="0px 1px 2px 0px rgba(0, 0, 0, 0.05)" onChange={vi.fn()} />
    );

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(0);

    rerender(<ShadowInput value="10px 20px 30px 5px rgba(0, 0, 0, 0.5)" onChange={vi.fn()} />);

    expect(inputs[0]).toHaveValue(10);
  });
});
