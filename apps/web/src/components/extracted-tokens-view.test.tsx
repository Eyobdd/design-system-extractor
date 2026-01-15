import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExtractedTokensView } from './extracted-tokens-view';

describe('ExtractedTokensView', () => {
  describe('empty state', () => {
    it('shows "No tokens extracted" when tokens are empty', () => {
      render(<ExtractedTokensView tokens={{}} />);

      expect(screen.getByText('No tokens extracted')).toBeInTheDocument();
    });

    it('shows "No tokens extracted" when colors and typography are empty', () => {
      render(<ExtractedTokensView tokens={{ colors: {}, typography: {} }} />);

      expect(screen.getByText('No tokens extracted')).toBeInTheDocument();
    });
  });

  describe('colors display', () => {
    it('renders colors section with count', () => {
      const tokens = {
        colors: {
          '#3b82f6': ['button'],
          '#ef4444': ['error'],
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.getByText('Colors (2)')).toBeInTheDocument();
    });

    it('displays color hex values', () => {
      const tokens = {
        colors: {
          '#3b82f6': ['button'],
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.getByText('#3b82f6')).toBeInTheDocument();
    });

    it('displays color usage information', () => {
      const tokens = {
        colors: {
          '#3b82f6': ['button', 'link'],
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.getByText(/Used in:.*button.*link/)).toBeInTheDocument();
    });

    it('renders color swatch with correct background', () => {
      const tokens = {
        colors: {
          '#ff0000': ['error'],
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      const hexLabel = screen.getByText('#ff0000');
      const colorSwatch = hexLabel.closest('div[style*="background-color"]');
      expect(colorSwatch).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('hides colors section when no colors', () => {
      const tokens = {
        typography: {
          body: {
            fontFamily: 'Arial',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
          },
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.queryByText(/Colors/)).not.toBeInTheDocument();
    });
  });

  describe('typography display', () => {
    it('renders typography section with count', () => {
      const tokens = {
        typography: {
          heading: {
            fontFamily: 'Inter',
            fontSize: '24px',
            fontWeight: '700',
            lineHeight: '1.5',
          },
          body: {
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.6',
          },
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.getByText('Typography (2)')).toBeInTheDocument();
    });

    it('displays font size and weight badges', () => {
      const tokens = {
        typography: {
          heading: {
            fontFamily: 'Georgia',
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '1.2',
          },
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.getAllByText('32px').length).toBeGreaterThan(0);
      expect(screen.getAllByText('700').length).toBeGreaterThan(0);
    });

    it('displays typography preview text', () => {
      const tokens = {
        typography: {
          body: {
            fontFamily: 'Arial',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
          },
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.getByText('The quick brown fox jumps over the lazy dog')).toBeInTheDocument();
    });

    it('displays clean font name', () => {
      const tokens = {
        typography: {
          body: {
            fontFamily: '__DM_Sans_abc123, sans-serif',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
          },
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.getByText(/DM/)).toBeInTheDocument();
    });

    it('hides typography section when no typography', () => {
      const tokens = {
        colors: {
          '#000': ['text'],
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.queryByText(/Typography/)).not.toBeInTheDocument();
    });
  });

  describe('combined display', () => {
    it('shows both colors and typography sections', () => {
      const tokens = {
        colors: {
          '#3b82f6': ['button'],
        },
        typography: {
          body: {
            fontFamily: 'Arial',
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
          },
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.getByText('Colors (1)')).toBeInTheDocument();
      expect(screen.getByText('Typography (1)')).toBeInTheDocument();
    });

    it('does not show empty message when tokens exist', () => {
      const tokens = {
        colors: {
          '#000': ['text'],
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      expect(screen.queryByText('No tokens extracted')).not.toBeInTheDocument();
    });
  });

  describe('color contrast', () => {
    it('uses dark text on light colors', () => {
      const tokens = {
        colors: {
          '#ffffff': ['background'],
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      const hexLabel = screen.getByText('#ffffff');
      expect(hexLabel).toHaveClass('text-black');
    });

    it('uses light text on dark colors', () => {
      const tokens = {
        colors: {
          '#000000': ['text'],
        },
      };

      render(<ExtractedTokensView tokens={tokens} />);

      const hexLabel = screen.getByText('#000000');
      expect(hexLabel).toHaveClass('text-white');
    });
  });
});
