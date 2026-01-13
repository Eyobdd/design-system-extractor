import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparisonCard, ComparisonData } from './comparison-card';

function createMockComparison(overrides: Partial<ComparisonData> = {}): ComparisonData {
  return {
    componentId: 'button-primary',
    ssimScore: 0.92,
    colorScore: 0.88,
    combinedScore: 0.9,
    passed: true,
    ...overrides,
  };
}

describe('ComparisonCard', () => {
  describe('Rendering', () => {
    it('renders component ID', () => {
      render(<ComparisonCard comparison={createMockComparison()} />);
      expect(screen.getByText('button-primary')).toBeInTheDocument();
    });

    it('renders combined score as percentage', () => {
      render(<ComparisonCard comparison={createMockComparison({ combinedScore: 0.9 })} />);
      expect(screen.getByText('Combined score: 90%')).toBeInTheDocument();
    });

    it('rounds combined score to nearest integer', () => {
      render(<ComparisonCard comparison={createMockComparison({ combinedScore: 0.876 })} />);
      expect(screen.getByText('Combined score: 88%')).toBeInTheDocument();
    });

    it('applies green styling for passing comparison', () => {
      const { container } = render(
        <ComparisonCard comparison={createMockComparison({ passed: true })} />
      );
      expect(container.firstChild).toHaveClass('border-green-200', 'bg-green-50');
    });

    it('applies red styling for failing comparison', () => {
      const { container } = render(
        <ComparisonCard comparison={createMockComparison({ passed: false })} />
      );
      expect(container.firstChild).toHaveClass('border-red-200', 'bg-red-50');
    });

    it('has expand details button with accessible label', () => {
      render(<ComparisonCard comparison={createMockComparison()} />);
      expect(screen.getByRole('button', { name: /expand details/i })).toBeInTheDocument();
    });
  });

  describe('Expansion', () => {
    it('is collapsed by default', () => {
      render(<ComparisonCard comparison={createMockComparison()} />);
      expect(screen.queryByText('Structural Similarity (SSIM)')).not.toBeInTheDocument();
    });

    it('expands when toggle button is clicked', async () => {
      render(<ComparisonCard comparison={createMockComparison()} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.getByText('Structural Similarity (SSIM)')).toBeInTheDocument();
      expect(screen.getByText('Color Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Combined Score')).toBeInTheDocument();
    });

    it('updates button label to collapse when expanded', async () => {
      render(<ComparisonCard comparison={createMockComparison()} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.getByRole('button', { name: /collapse details/i })).toBeInTheDocument();
    });

    it('collapses when toggle button is clicked again', async () => {
      render(<ComparisonCard comparison={createMockComparison()} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));
      expect(screen.getByText('Structural Similarity (SSIM)')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /collapse details/i }));
      expect(screen.queryByText('Structural Similarity (SSIM)')).not.toBeInTheDocument();
    });

    it('displays individual scores as percentages when expanded', async () => {
      render(
        <ComparisonCard comparison={createMockComparison({ ssimScore: 0.92, colorScore: 0.88 })} />
      );

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('88%')).toBeInTheDocument();
    });
  });

  describe('Score Bar Colors', () => {
    it('shows green for scores at or above threshold (0.85)', async () => {
      render(<ComparisonCard comparison={createMockComparison({ ssimScore: 0.85 })} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      const ssimText = screen.getByText('85%');
      expect(ssimText).toHaveClass('text-green-600');
    });

    it('shows red for scores below threshold (0.85)', async () => {
      render(<ComparisonCard comparison={createMockComparison({ ssimScore: 0.84 })} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      const ssimText = screen.getByText('84%');
      expect(ssimText).toHaveClass('text-red-600');
    });
  });

  describe('Images', () => {
    it('displays both images when URLs are provided', async () => {
      render(
        <ComparisonCard
          comparison={createMockComparison({
            originalImageUrl: '/images/original.png',
            generatedImageUrl: '/images/generated.png',
          })}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.getByAltText('Original button-primary')).toHaveAttribute(
        'src',
        '/images/original.png'
      );
      expect(screen.getByAltText('Generated button-primary')).toHaveAttribute(
        'src',
        '/images/generated.png'
      );
    });

    it('displays only original image when only original URL provided', async () => {
      render(
        <ComparisonCard
          comparison={createMockComparison({ originalImageUrl: '/images/original.png' })}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.queryByText('Generated')).not.toBeInTheDocument();
    });

    it('displays only generated image when only generated URL provided', async () => {
      render(
        <ComparisonCard
          comparison={createMockComparison({ generatedImageUrl: '/images/generated.png' })}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.queryByText('Original')).not.toBeInTheDocument();
      expect(screen.getByText('Generated')).toBeInTheDocument();
    });

    it('does not display image section when no URLs provided', async () => {
      render(<ComparisonCard comparison={createMockComparison()} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.queryByText('Original')).not.toBeInTheDocument();
      expect(screen.queryByText('Generated')).not.toBeInTheDocument();
    });
  });

  describe('Feedback', () => {
    it('displays feedback buttons when onFeedback is provided', async () => {
      const onFeedback = vi.fn();
      render(<ComparisonCard comparison={createMockComparison()} onFeedback={onFeedback} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    });

    it('calls onFeedback with approve when approve button clicked', async () => {
      const onFeedback = vi.fn();
      render(<ComparisonCard comparison={createMockComparison()} onFeedback={onFeedback} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));
      await userEvent.click(screen.getByRole('button', { name: /approve/i }));

      expect(onFeedback).toHaveBeenCalledWith('button-primary', 'approve');
      expect(onFeedback).toHaveBeenCalledTimes(1);
    });

    it('calls onFeedback with reject when reject button clicked', async () => {
      const onFeedback = vi.fn();
      render(<ComparisonCard comparison={createMockComparison()} onFeedback={onFeedback} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));
      await userEvent.click(screen.getByRole('button', { name: /reject/i }));

      expect(onFeedback).toHaveBeenCalledWith('button-primary', 'reject');
      expect(onFeedback).toHaveBeenCalledTimes(1);
    });

    it('does not display feedback buttons when onFeedback is not provided', async () => {
      render(<ComparisonCard comparison={createMockComparison()} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    });

    it('passes correct componentId in feedback callback', async () => {
      const onFeedback = vi.fn();
      render(
        <ComparisonCard
          comparison={createMockComparison({ componentId: 'custom-component' })}
          onFeedback={onFeedback}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));
      await userEvent.click(screen.getByRole('button', { name: /approve/i }));

      expect(onFeedback).toHaveBeenCalledWith('custom-component', 'approve');
    });
  });
});
