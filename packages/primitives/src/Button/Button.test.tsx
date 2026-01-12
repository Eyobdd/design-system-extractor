import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button primitive', () => {
  it('renders children', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant as data attribute', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'primary');
  });

  it('defaults to type="button"', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button variant="primary" ref={ref}>
        Test
      </Button>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('fires onClick handler', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Click me
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick} disabled>
        Click me
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('is keyboard accessible with Enter key', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Click me
      </Button>
    );
    const button = screen.getByRole('button');
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    fireEvent.keyUp(button, { key: 'Enter', code: 'Enter' });
    expect(button).toHaveFocus();
  });

  it('passes through aria attributes', () => {
    render(
      <Button variant="primary" aria-label="Submit form" aria-pressed={true}>
        Submit
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports button type attribute', () => {
    render(
      <Button variant="primary" type="submit">
        Submit
      </Button>
    );
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});

// Type-level tests: TypeScript prevents forbidden props (className, style, id)
describe('Button primitive types', () => {
  it('should not allow forbidden props', () => {
    // @ts-expect-error - className is forbidden
    <Button variant="primary" className="foo">
      Test
    </Button>;

    // @ts-expect-error - style is forbidden
    <Button variant="primary" style={{ color: 'red' }}>
      Test
    </Button>;

    // @ts-expect-error - id is forbidden
    <Button variant="primary" id="my-button">
      Test
    </Button>;
  });

  it('requires variant prop', () => {
    // @ts-expect-error - variant is required
    <Button>No variant</Button>;
  });
});
