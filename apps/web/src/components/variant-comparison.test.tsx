import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VariantComparison, VariantComparisonList } from './variant-comparison';
import type { VariantReview, ButtonVariantSpec } from '@extracted/types';

function createMockReview(overrides: Partial<VariantReview> = {}): VariantReview {
  return {
    variantId: 'variant-1',
    componentType: 'button',
    variantName: 'Primary',
    status: 'pending',
    extractedSpec: {
      surface: 'primary',
      text: 'white',
      paddingX: 16,
      paddingY: 8,
      radius: 'md',
      fontSize: 'base',
      fontWeight: 'medium',
      border: null,
    } as ButtonVariantSpec,
    originalSelector: '.btn-primary',
    originalBoundingBox: { x: 100, y: 200, width: 200, height: 50 },
    ...overrides,
  };
}

describe('VariantComparison', () => {
  const defaultProps = {
    review: createMockReview(),
    sourceUrl: 'https://example.com',
  };

  describe('header display', () => {
    it('displays component type', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByText('button')).toBeInTheDocument();
    });

    it('displays variant name', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByText('Primary')).toBeInTheDocument();
    });

    it('displays match score when provided', () => {
      render(
        <VariantComparison {...defaultProps} review={createMockReview({ matchScore: 0.85 })} />
      );

      expect(screen.getByText('85% match')).toBeInTheDocument();
    });

    it('does not display match score when not provided', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.queryByText(/% match/)).not.toBeInTheDocument();
    });
  });

  describe('status badge', () => {
    it.each([
      ['pending', 'Pending'],
      ['accepted', 'Accepted'],
      ['failed', 'Failed'],
      ['dne', 'DNE'],
    ] as const)('displays %s status as "%s"', (status, label) => {
      render(<VariantComparison {...defaultProps} review={createMockReview({ status })} />);

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('renders Accept button', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    });

    it('renders Reject button', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('renders Not a Variant button', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByRole('button', { name: /not a variant/i })).toBeInTheDocument();
    });

    it('calls onStatusChange with accepted status when Accept clicked', () => {
      const onStatusChange = vi.fn();
      render(<VariantComparison {...defaultProps} onStatusChange={onStatusChange} />);

      fireEvent.click(screen.getByRole('button', { name: /accept/i }));

      expect(onStatusChange).toHaveBeenCalledWith('variant-1', 'accepted', undefined);
    });

    it('calls onStatusChange with failed status when Reject clicked', () => {
      const onStatusChange = vi.fn();
      render(<VariantComparison {...defaultProps} onStatusChange={onStatusChange} />);

      fireEvent.click(screen.getByRole('button', { name: /reject/i }));

      expect(onStatusChange).toHaveBeenCalledWith('variant-1', 'failed', undefined);
    });

    it('calls onStatusChange with dne status when Not a Variant clicked', () => {
      const onStatusChange = vi.fn();
      render(<VariantComparison {...defaultProps} onStatusChange={onStatusChange} />);

      fireEvent.click(screen.getByRole('button', { name: /not a variant/i }));

      expect(onStatusChange).toHaveBeenCalledWith('variant-1', 'dne', undefined);
    });

    it('does not throw when onStatusChange is undefined', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /accept/i }));
      }).not.toThrow();
    });
  });

  describe('comment functionality', () => {
    it('renders Comment toggle button', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument();
    });

    it('shows comment textarea when toggle clicked', () => {
      render(<VariantComparison {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /comment/i }));

      expect(
        screen.getByPlaceholderText(/add a comment to help improve extraction/i)
      ).toBeInTheDocument();
    });

    it('hides comment textarea when toggle clicked again', () => {
      render(<VariantComparison {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /comment/i }));
      fireEvent.click(screen.getByRole('button', { name: /comment/i }));

      expect(
        screen.queryByPlaceholderText(/add a comment to help improve extraction/i)
      ).not.toBeInTheDocument();
    });

    it('includes comment in onStatusChange callback', () => {
      const onStatusChange = vi.fn();
      render(<VariantComparison {...defaultProps} onStatusChange={onStatusChange} />);

      fireEvent.click(screen.getByRole('button', { name: /comment/i }));

      const textarea = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(textarea, { target: { value: 'Needs adjustment' } });

      fireEvent.click(screen.getByRole('button', { name: /accept/i }));

      expect(onStatusChange).toHaveBeenCalledWith('variant-1', 'accepted', 'Needs adjustment');
    });

    it('initializes comment from review.reviewComment', () => {
      render(
        <VariantComparison
          {...defaultProps}
          review={createMockReview({ reviewComment: 'Existing comment' })}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /comment/i }));

      const textarea = screen.getByPlaceholderText(/add a comment/i);
      expect(textarea).toHaveValue('Existing comment');
    });
  });

  describe('preview sections', () => {
    it('renders Original section', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByText('Original')).toBeInTheDocument();
    });

    it('renders Extracted section', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByText('Extracted')).toBeInTheDocument();
    });

    it('renders VariantRenderer in Extracted section', () => {
      render(<VariantComparison {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Button Text' })).toBeInTheDocument();
    });
  });
});

describe('VariantComparisonList', () => {
  const defaultProps = {
    reviews: [
      createMockReview({ variantId: 'btn-1', componentType: 'button', variantName: 'Primary' }),
      createMockReview({ variantId: 'btn-2', componentType: 'button', variantName: 'Secondary' }),
      createMockReview({ variantId: 'card-1', componentType: 'card', variantName: 'Default' }),
    ],
    sourceUrl: 'https://example.com',
  };

  describe('empty state', () => {
    it('shows empty message when no reviews', () => {
      render(<VariantComparisonList reviews={[]} sourceUrl="https://example.com" />);

      expect(screen.getByText('No variants to review')).toBeInTheDocument();
    });
  });

  describe('grouping', () => {
    it('groups reviews by component type', () => {
      render(<VariantComparisonList {...defaultProps} />);

      const accordionHeaders = screen.getAllByRole('button', { name: /variants/i });
      expect(accordionHeaders).toHaveLength(2);
    });

    it('shows variant count per type', () => {
      render(<VariantComparisonList {...defaultProps} />);

      expect(screen.getByText(/2 variants/i)).toBeInTheDocument();
      expect(screen.getByText(/1 variants/i)).toBeInTheDocument();
    });
  });

  describe('accordion behavior', () => {
    it('shows all component types expanded by default', () => {
      render(<VariantComparisonList {...defaultProps} />);

      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('collapses section when header clicked', () => {
      render(<VariantComparisonList {...defaultProps} />);

      const accordionHeaders = screen.getAllByRole('button', { name: /variants/i });
      fireEvent.click(accordionHeaders[0]!);

      expect(screen.queryByText('Primary')).not.toBeInTheDocument();
      expect(screen.queryByText('Secondary')).not.toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('expands section when collapsed header clicked', () => {
      render(<VariantComparisonList {...defaultProps} />);

      const accordionHeaders = screen.getAllByRole('button', { name: /variants/i });
      fireEvent.click(accordionHeaders[0]!);
      fireEvent.click(accordionHeaders[0]!);

      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });
  });

  describe('status change propagation', () => {
    it('passes onStatusChange to child VariantComparison', () => {
      const onStatusChange = vi.fn();
      render(<VariantComparisonList {...defaultProps} onStatusChange={onStatusChange} />);

      const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
      fireEvent.click(acceptButtons[0]!);

      expect(onStatusChange).toHaveBeenCalledWith('btn-1', 'accepted', undefined);
    });
  });

  describe('screenshot URL propagation', () => {
    it('passes screenshotUrl to child components', () => {
      render(
        <VariantComparisonList
          {...defaultProps}
          screenshotUrl="https://screenshots.example.com/image.png"
        />
      );

      const images = screen.getAllByRole('img', { name: 'Page screenshot' });
      expect(images.length).toBeGreaterThan(0);
    });
  });
});
