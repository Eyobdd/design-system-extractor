import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPalette } from './color-palette';

const mockWriteText = vi.fn().mockResolvedValue(undefined);

Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

function createMockColors(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    primary: '#3b82f6',
    secondary: '#6b7280',
    background: '#ffffff',
    ...overrides,
  };
}

describe('ColorPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Empty State', () => {
    it('shows empty message when colors is empty object', () => {
      render(<ColorPalette colors={{}} />);
      expect(screen.getByText('No colors extracted yet.')).toBeInTheDocument();
    });

    it('does not show empty message when colors exist', () => {
      render(<ColorPalette colors={createMockColors()} />);
      expect(screen.queryByText('No colors extracted yet.')).not.toBeInTheDocument();
    });
  });

  describe('Title', () => {
    it('displays default title "Colors"', () => {
      render(<ColorPalette colors={createMockColors()} />);
      expect(screen.getByRole('heading', { name: 'Colors' })).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      render(<ColorPalette colors={createMockColors()} title="Brand Colors" />);
      expect(screen.getByRole('heading', { name: 'Brand Colors' })).toBeInTheDocument();
    });
  });

  describe('Color Swatches', () => {
    it('renders a swatch for each color', () => {
      const colors = createMockColors();
      render(<ColorPalette colors={colors} />);

      expect(screen.getByText('primary')).toBeInTheDocument();
      expect(screen.getByText('secondary')).toBeInTheDocument();
      expect(screen.getByText('background')).toBeInTheDocument();
    });

    it('displays color values', () => {
      render(<ColorPalette colors={createMockColors()} />);

      expect(screen.getByText('#3b82f6')).toBeInTheDocument();
      expect(screen.getByText('#6b7280')).toBeInTheDocument();
      expect(screen.getByText('#ffffff')).toBeInTheDocument();
    });

    it('applies background color to swatch', () => {
      const { container } = render(<ColorPalette colors={{ primary: '#ff0000' }} />);
      const colorDiv = container.querySelector('[style*="background-color"]');
      expect(colorDiv).toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });

  describe('Copy Functionality', () => {
    it('has accessible copy button with aria-label', () => {
      render(<ColorPalette colors={{ primary: '#3b82f6' }} />);
      expect(
        screen.getByRole('button', { name: 'Copy primary color value #3b82f6' })
      ).toBeInTheDocument();
    });

    it('copies color value to clipboard on click', async () => {
      render(<ColorPalette colors={{ primary: '#3b82f6' }} />);

      await userEvent.click(
        screen.getByRole('button', { name: 'Copy primary color value #3b82f6' })
      );

      expect(mockWriteText).toHaveBeenCalledWith('#3b82f6');
    });

    it('shows "Copied!" message after copying', async () => {
      render(<ColorPalette colors={{ primary: '#3b82f6' }} />);

      await userEvent.click(
        screen.getByRole('button', { name: 'Copy primary color value #3b82f6' })
      );

      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    it('hides "Copied!" message after 2 seconds', async () => {
      render(<ColorPalette colors={{ primary: '#3b82f6' }} />);

      await userEvent.click(
        screen.getByRole('button', { name: 'Copy primary color value #3b82f6' })
      );

      expect(screen.getByText('Copied!')).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });
  });

  describe('Light/Dark Color Detection', () => {
    it('uses dark text on light background for copied message', async () => {
      render(<ColorPalette colors={{ light: '#ffffff' }} />);

      await userEvent.click(screen.getByRole('button', { name: 'Copy light color value #ffffff' }));

      const copiedMessage = screen.getByText('Copied!');
      expect(copiedMessage).toHaveClass('bg-gray-900', 'text-white');
    });

    it('uses light text on dark background for copied message', async () => {
      render(<ColorPalette colors={{ dark: '#000000' }} />);

      await userEvent.click(screen.getByRole('button', { name: 'Copy dark color value #000000' }));

      const copiedMessage = screen.getByText('Copied!');
      expect(copiedMessage).toHaveClass('bg-white', 'text-gray-900');
    });
  });
});
