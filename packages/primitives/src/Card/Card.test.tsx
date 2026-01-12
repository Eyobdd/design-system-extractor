import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';

describe('Card primitive', () => {
  it('renders children', () => {
    render(<Card variant="default">Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeDefined();
  });

  it('applies variant as data attribute', () => {
    render(<Card variant="elevated">Card Content</Card>);
    const card = screen.getByText('Card Content');
    expect(card).toHaveAttribute('data-variant', 'elevated');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Card variant="default" ref={ref}>
        Test
      </Card>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('fires onClick handler', () => {
    const handleClick = vi.fn();
    render(
      <Card variant="default" onClick={handleClick}>
        Click me
      </Card>
    );
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('passes through aria attributes', () => {
    render(
      <Card variant="default" aria-label="Card container" role="region">
        Content
      </Card>
    );
    const card = screen.getByLabelText('Card container');
    expect(card).toHaveAttribute('role', 'region');
  });
});

describe('Card primitive types', () => {
  it('should not allow forbidden props', () => {
    // @ts-expect-error - className is forbidden
    <Card variant="default" className="override">
      Test
    </Card>;

    // @ts-expect-error - style is forbidden
    <Card variant="default" style={{ color: 'red' }}>
      Test
    </Card>;

    // @ts-expect-error - id is forbidden
    <Card variant="default" id="my-card">
      Test
    </Card>;
  });

  it('requires variant prop', () => {
    // @ts-expect-error - variant is required
    <Card>No variant</Card>;
  });
});
