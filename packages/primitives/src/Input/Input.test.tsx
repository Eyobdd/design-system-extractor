import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input primitive', () => {
  it('renders with placeholder', () => {
    render(<Input variant="default" placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeDefined();
  });

  it('applies variant as data attribute', () => {
    render(<Input variant="error" placeholder="test" />);
    const input = screen.getByPlaceholderText('test');
    expect(input).toHaveAttribute('data-variant', 'error');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input variant="default" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('fires onChange handler', () => {
    const handleChange = vi.fn();
    render(<Input variant="default" onChange={handleChange} placeholder="test" />);
    const input = screen.getByPlaceholderText('test');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Input variant="default" disabled placeholder="test" />);
    const input = screen.getByPlaceholderText('test');
    expect(input).toBeDisabled();
  });

  it('passes through aria attributes', () => {
    render(<Input variant="default" aria-label="Search" placeholder="test" />);
    const input = screen.getByLabelText('Search');
    expect(input).toBeDefined();
  });
});

describe('Input primitive types', () => {
  it('should not allow forbidden props', () => {
    // @ts-expect-error - className is forbidden
    <Input variant="default" className="override" />;

    // @ts-expect-error - style is forbidden
    <Input variant="default" style={{ color: 'red' }} />;

    // @ts-expect-error - id is forbidden
    <Input variant="default" id="my-input" />;
  });

  it('requires variant prop', () => {
    // @ts-expect-error - variant is required
    <Input placeholder="test" />;
  });
});
