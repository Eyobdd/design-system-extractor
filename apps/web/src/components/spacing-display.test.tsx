import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpacingDisplay } from './spacing-display';

function createMockSpacing(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    ...overrides,
  };
}

describe('SpacingDisplay', () => {
  describe('Empty State', () => {
    it('shows empty message when spacing is empty object', () => {
      render(<SpacingDisplay spacing={{}} />);
      expect(screen.getByText('No spacing extracted yet.')).toBeInTheDocument();
    });

    it('does not show empty message when spacing values exist', () => {
      render(<SpacingDisplay spacing={createMockSpacing()} />);
      expect(screen.queryByText('No spacing extracted yet.')).not.toBeInTheDocument();
    });
  });

  describe('Title', () => {
    it('displays default title "Spacing"', () => {
      render(<SpacingDisplay spacing={createMockSpacing()} />);
      expect(screen.getByRole('heading', { name: 'Spacing' })).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      render(<SpacingDisplay spacing={createMockSpacing()} title="Layout Spacing" />);
      expect(screen.getByRole('heading', { name: 'Layout Spacing' })).toBeInTheDocument();
    });
  });

  describe('Spacing Items', () => {
    it('renders all spacing values', () => {
      render(<SpacingDisplay spacing={createMockSpacing()} />);

      expect(screen.getByText('xs')).toBeInTheDocument();
      expect(screen.getByText('sm')).toBeInTheDocument();
      expect(screen.getByText('md')).toBeInTheDocument();
      expect(screen.getByText('lg')).toBeInTheDocument();
    });

    it('displays spacing value text', () => {
      render(<SpacingDisplay spacing={createMockSpacing()} />);

      expect(screen.getByText('4px')).toBeInTheDocument();
      expect(screen.getByText('8px')).toBeInTheDocument();
      expect(screen.getByText('16px')).toBeInTheDocument();
      expect(screen.getByText('24px')).toBeInTheDocument();
    });
  });

  describe('Visual Bar', () => {
    it('renders visual bar with correct width', () => {
      const { container } = render(<SpacingDisplay spacing={{ md: '16px' }} />);
      const bar = container.querySelector('[style*="width: 16px"]');
      expect(bar).toBeInTheDocument();
    });

    it('has accessible aria-label on visual bar', () => {
      render(<SpacingDisplay spacing={{ md: '16px' }} />);
      expect(screen.getByLabelText('Spacing md: 16px')).toBeInTheDocument();
    });

    it('renders bars for each spacing value', () => {
      render(<SpacingDisplay spacing={createMockSpacing()} />);

      expect(screen.getByLabelText('Spacing xs: 4px')).toBeInTheDocument();
      expect(screen.getByLabelText('Spacing sm: 8px')).toBeInTheDocument();
      expect(screen.getByLabelText('Spacing md: 16px')).toBeInTheDocument();
      expect(screen.getByLabelText('Spacing lg: 24px')).toBeInTheDocument();
    });
  });

  describe('Single Spacing Value', () => {
    it('renders correctly with single spacing value', () => {
      render(<SpacingDisplay spacing={{ base: '12px' }} />);

      expect(screen.getByText('base')).toBeInTheDocument();
      expect(screen.getByText('12px')).toBeInTheDocument();
      expect(screen.getByLabelText('Spacing base: 12px')).toBeInTheDocument();
    });
  });
});
