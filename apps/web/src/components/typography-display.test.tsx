import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypographyDisplay } from './typography-display';

interface Typography {
  fontFamily?: string;
  fontSize?: Record<string, string>;
  fontWeight?: Record<string, string | number>;
  lineHeight?: Record<string, string>;
}

function createMockTypography(overrides: Partial<Typography> = {}): Typography {
  return {
    fontFamily: 'Inter, sans-serif',
    fontSize: { base: '16px', lg: '18px' },
    fontWeight: { normal: 400, bold: 700 },
    lineHeight: { tight: '1.25', normal: '1.5' },
    ...overrides,
  };
}

describe('TypographyDisplay', () => {
  describe('Empty State', () => {
    it('shows empty message when typography is empty object', () => {
      render(<TypographyDisplay typography={{}} />);
      expect(screen.getByText('No typography extracted yet.')).toBeInTheDocument();
    });

    it('shows empty message when all properties are empty', () => {
      render(<TypographyDisplay typography={{ fontSize: {}, fontWeight: {}, lineHeight: {} }} />);
      expect(screen.getByText('No typography extracted yet.')).toBeInTheDocument();
    });

    it('does not show empty message when typography has content', () => {
      render(<TypographyDisplay typography={createMockTypography()} />);
      expect(screen.queryByText('No typography extracted yet.')).not.toBeInTheDocument();
    });
  });

  describe('Title', () => {
    it('displays default title "Typography"', () => {
      render(<TypographyDisplay typography={createMockTypography()} />);
      expect(screen.getByRole('heading', { name: 'Typography' })).toBeInTheDocument();
    });

    it('displays custom title when provided', () => {
      render(<TypographyDisplay typography={createMockTypography()} title="Type System" />);
      expect(screen.getByRole('heading', { name: 'Type System' })).toBeInTheDocument();
    });
  });

  describe('Font Family', () => {
    it('displays font family section when provided', () => {
      render(<TypographyDisplay typography={{ fontFamily: 'Inter, sans-serif' }} />);

      expect(screen.getByText('Font Family')).toBeInTheDocument();
      expect(screen.getByText('Inter, sans-serif')).toBeInTheDocument();
    });

    it('displays sample text with font family applied', () => {
      render(<TypographyDisplay typography={{ fontFamily: 'Georgia, serif' }} />);

      const sampleText = screen.getByText('The quick brown fox jumps over the lazy dog.');
      expect(sampleText).toHaveStyle({ fontFamily: 'Georgia, serif' });
    });

    it('does not display font family section when not provided', () => {
      render(<TypographyDisplay typography={{ fontSize: { base: '16px' } }} />);
      expect(screen.queryByText('Font Family')).not.toBeInTheDocument();
    });
  });

  describe('Font Sizes', () => {
    it('displays font sizes section when provided', () => {
      render(<TypographyDisplay typography={{ fontSize: { base: '16px', lg: '18px' } }} />);

      expect(screen.getByText('Font Sizes')).toBeInTheDocument();
      expect(screen.getByText('base')).toBeInTheDocument();
      expect(screen.getByText('lg')).toBeInTheDocument();
    });

    it('displays size values', () => {
      render(<TypographyDisplay typography={{ fontSize: { sm: '14px' } }} />);
      expect(screen.getByText('14px')).toBeInTheDocument();
    });

    it('applies font size to sample text', () => {
      const { container } = render(<TypographyDisplay typography={{ fontSize: { xl: '24px' } }} />);

      const sampleText = container.querySelector('[style*="font-size: 24px"]');
      expect(sampleText).toBeInTheDocument();
    });

    it('does not display font sizes section when empty', () => {
      render(<TypographyDisplay typography={{ fontFamily: 'Inter' }} />);
      expect(screen.queryByText('Font Sizes')).not.toBeInTheDocument();
    });
  });

  describe('Font Weights', () => {
    it('displays font weights section when provided', () => {
      render(<TypographyDisplay typography={{ fontWeight: { normal: 400, bold: 700 } }} />);

      expect(screen.getByText('Font Weights')).toBeInTheDocument();
      expect(screen.getByText('normal')).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    it('displays numeric weight values', () => {
      render(<TypographyDisplay typography={{ fontWeight: { medium: 500 } }} />);
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('handles string weight values', () => {
      render(<TypographyDisplay typography={{ fontWeight: { bold: '700' } }} />);
      expect(screen.getByText('700')).toBeInTheDocument();
    });

    it('applies font weight to sample text', () => {
      const { container } = render(
        <TypographyDisplay typography={{ fontWeight: { heavy: 800 } }} />
      );

      const sampleText = container.querySelector('[style*="font-weight: 800"]');
      expect(sampleText).toBeInTheDocument();
    });

    it('does not display font weights section when empty', () => {
      render(<TypographyDisplay typography={{ fontFamily: 'Inter' }} />);
      expect(screen.queryByText('Font Weights')).not.toBeInTheDocument();
    });
  });

  describe('Line Heights', () => {
    it('displays line heights section when provided', () => {
      render(<TypographyDisplay typography={{ lineHeight: { tight: '1.25', loose: '2' } }} />);

      expect(screen.getByText('Line Heights')).toBeInTheDocument();
      expect(screen.getByText('tight')).toBeInTheDocument();
      expect(screen.getByText('loose')).toBeInTheDocument();
    });

    it('displays line height values', () => {
      render(<TypographyDisplay typography={{ lineHeight: { normal: '1.5' } }} />);
      expect(screen.getByText('1.5')).toBeInTheDocument();
    });

    it('applies line height to sample text', () => {
      const { container } = render(
        <TypographyDisplay typography={{ lineHeight: { relaxed: '1.75' } }} />
      );

      const sampleText = container.querySelector('[style*="line-height: 1.75"]');
      expect(sampleText).toBeInTheDocument();
    });

    it('does not display line heights section when empty', () => {
      render(<TypographyDisplay typography={{ fontFamily: 'Inter' }} />);
      expect(screen.queryByText('Line Heights')).not.toBeInTheDocument();
    });
  });

  describe('Partial Typography', () => {
    it('displays only font family when only that is provided', () => {
      render(<TypographyDisplay typography={{ fontFamily: 'Roboto' }} />);

      expect(screen.getByText('Font Family')).toBeInTheDocument();
      expect(screen.queryByText('Font Sizes')).not.toBeInTheDocument();
      expect(screen.queryByText('Font Weights')).not.toBeInTheDocument();
      expect(screen.queryByText('Line Heights')).not.toBeInTheDocument();
    });

    it('displays only font sizes when only that is provided', () => {
      render(<TypographyDisplay typography={{ fontSize: { base: '16px' } }} />);

      expect(screen.queryByText('Font Family')).not.toBeInTheDocument();
      expect(screen.getByText('Font Sizes')).toBeInTheDocument();
      expect(screen.queryByText('Font Weights')).not.toBeInTheDocument();
      expect(screen.queryByText('Line Heights')).not.toBeInTheDocument();
    });

    it('displays multiple sections when multiple properties provided', () => {
      render(<TypographyDisplay typography={{ fontFamily: 'Inter', fontWeight: { bold: 700 } }} />);

      expect(screen.getByText('Font Family')).toBeInTheDocument();
      expect(screen.getByText('Font Weights')).toBeInTheDocument();
      expect(screen.queryByText('Font Sizes')).not.toBeInTheDocument();
    });
  });

  describe('Font Family Inheritance', () => {
    it('applies font family to font size samples', () => {
      const { container } = render(
        <TypographyDisplay
          typography={{ fontFamily: 'Georgia, serif', fontSize: { base: '16px' } }}
        />
      );

      const fontSizeSample = container.querySelector(
        '[style*="font-size: 16px"][style*="font-family: Georgia, serif"]'
      );
      expect(fontSizeSample).toBeInTheDocument();
    });

    it('applies font family to font weight samples', () => {
      const { container } = render(
        <TypographyDisplay typography={{ fontFamily: 'Arial', fontWeight: { bold: 700 } }} />
      );

      const fontWeightSample = container.querySelector(
        '[style*="font-weight: 700"][style*="font-family: Arial"]'
      );
      expect(fontWeightSample).toBeInTheDocument();
    });

    it('applies font family to line height samples', () => {
      const { container } = render(
        <TypographyDisplay typography={{ fontFamily: 'Verdana', lineHeight: { normal: '1.5' } }} />
      );

      const lineHeightSample = container.querySelector(
        '[style*="line-height: 1.5"][style*="font-family: Verdana"]'
      );
      expect(lineHeightSample).toBeInTheDocument();
    });
  });
});
