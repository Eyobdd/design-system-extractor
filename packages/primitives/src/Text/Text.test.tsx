import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Text } from './Text';

describe('Text primitive', () => {
  it('renders children', () => {
    render(<Text variant="body">Hello World</Text>);
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('applies variant as data attribute', () => {
    render(<Text variant="heading-lg">Headline</Text>);
    const text = screen.getByText('Headline');
    expect(text).toHaveAttribute('data-variant', 'heading-lg');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Text variant="body" ref={ref}>
        Test
      </Text>
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('fires onClick handler', () => {
    const handleClick = vi.fn();
    render(
      <Text variant="body" onClick={handleClick}>
        Clickable Text
      </Text>
    );
    fireEvent.click(screen.getByText('Clickable Text'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('passes through aria attributes', () => {
    render(
      <Text variant="body" aria-label="Description text" role="status">
        Status
      </Text>
    );
    const text = screen.getByLabelText('Description text');
    expect(text).toHaveAttribute('role', 'status');
  });
});

describe('Text primitive types', () => {
  it('should not allow forbidden props', () => {
    // @ts-expect-error - className is forbidden
    <Text variant="body" className="override">
      Test
    </Text>;

    // @ts-expect-error - style is forbidden
    <Text variant="body" style={{ color: 'red' }}>
      Test
    </Text>;

    // @ts-expect-error - id is forbidden
    <Text variant="body" id="my-text">
      Test
    </Text>;
  });

  it('requires variant prop', () => {
    // @ts-expect-error - variant is required
    <Text>No variant</Text>;
  });
});
