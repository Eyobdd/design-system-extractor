import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DesignSystemView, DesignTokens } from './design-system-view';

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

function createMockTokens(overrides: Partial<DesignTokens> = {}): DesignTokens {
  return {
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      background: '#ffffff',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: {
        base: '16px',
        lg: '18px',
      },
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
    },
    ...overrides,
  };
}

describe('DesignSystemView', () => {
  describe('empty state', () => {
    it('shows empty message when no tokens', () => {
      render(<DesignSystemView tokens={{}} />);
      expect(screen.getByText('No design tokens extracted yet.')).toBeInTheDocument();
    });

    it('shows empty message when tokens are empty objects', () => {
      render(<DesignSystemView tokens={{ colors: {}, spacing: {} }} />);
      expect(screen.getByText('No design tokens extracted yet.')).toBeInTheDocument();
    });
  });

  describe('URL Display', () => {
    it('displays source URL when provided', () => {
      render(<DesignSystemView tokens={createMockTokens()} url="https://example.com" />);
      expect(screen.getByText('Source URL')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute(
        'href',
        'https://example.com'
      );
    });

    it('opens URL in new tab with security attributes', () => {
      render(<DesignSystemView tokens={createMockTokens()} url="https://example.com" />);
      const link = screen.getByRole('link', { name: 'https://example.com' });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not display URL section when not provided', () => {
      render(<DesignSystemView tokens={createMockTokens()} />);
      expect(screen.queryByText('Source URL')).not.toBeInTheDocument();
    });
  });

  describe('colors', () => {
    it('displays color palette', () => {
      render(<DesignSystemView tokens={createMockTokens()} />);
      expect(screen.getByText('Colors')).toBeInTheDocument();
      expect(screen.getByText('primary')).toBeInTheDocument();
      expect(screen.getByText('#3b82f6')).toBeInTheDocument();
    });

    it('does not display colors section when empty', () => {
      render(<DesignSystemView tokens={{ typography: { fontFamily: 'Inter, sans-serif' } }} />);
      expect(screen.queryByText('Colors')).not.toBeInTheDocument();
    });
  });

  describe('typography', () => {
    it('displays typography section', () => {
      render(<DesignSystemView tokens={createMockTokens()} />);
      expect(screen.getByText('Typography')).toBeInTheDocument();
      expect(screen.getByText('Font Family')).toBeInTheDocument();
      expect(screen.getByText('Inter, sans-serif')).toBeInTheDocument();
    });

    it('displays font sizes', () => {
      render(<DesignSystemView tokens={createMockTokens()} />);
      expect(screen.getByText('Font Sizes')).toBeInTheDocument();
      expect(screen.getByText('base')).toBeInTheDocument();
      expect(screen.getAllByText('16px').length).toBeGreaterThan(0);
    });
  });

  describe('spacing', () => {
    it('displays spacing section', () => {
      render(<DesignSystemView tokens={createMockTokens()} />);
      expect(screen.getByText('Spacing')).toBeInTheDocument();
      expect(screen.getByText('xs')).toBeInTheDocument();
      expect(screen.getByText('4px')).toBeInTheDocument();
    });

    it('does not display spacing section when empty', () => {
      render(<DesignSystemView tokens={{ colors: { primary: '#3b82f6' } }} />);
      expect(screen.queryByText('Spacing')).not.toBeInTheDocument();
    });
  });

  describe('partial tokens', () => {
    it('displays only available sections', () => {
      render(<DesignSystemView tokens={{ colors: { primary: '#3b82f6' } }} />);
      expect(screen.getByText('Colors')).toBeInTheDocument();
      expect(screen.queryByText('Typography')).not.toBeInTheDocument();
      expect(screen.queryByText('Spacing')).not.toBeInTheDocument();
    });
  });
});
