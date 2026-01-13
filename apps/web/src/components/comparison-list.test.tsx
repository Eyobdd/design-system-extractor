import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparisonList } from './comparison-list';
import { ComparisonData } from './comparison-card';

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

function createMockComparisons(count: number, passingCount: number): ComparisonData[] {
  return Array.from({ length: count }, (_, i) => ({
    componentId: `component-${i}`,
    ssimScore: 0.9,
    colorScore: 0.9,
    combinedScore: 0.9,
    passed: i < passingCount,
  }));
}

describe('ComparisonList', () => {
  describe('Empty State', () => {
    it('shows empty message when no comparisons', () => {
      render(<ComparisonList comparisons={[]} />);
      expect(screen.getByText('No comparisons available yet.')).toBeInTheDocument();
    });

    it('does not show summary when empty', () => {
      render(<ComparisonList comparisons={[]} />);
      expect(screen.queryByText('Comparison Summary')).not.toBeInTheDocument();
    });
  });

  describe('Summary Statistics', () => {
    it('displays total component count', () => {
      render(<ComparisonList comparisons={createMockComparisons(5, 3)} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Total Components')).toBeInTheDocument();
    });

    it('displays passing count with label', () => {
      render(<ComparisonList comparisons={createMockComparisons(5, 3)} />);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Passing')).toBeInTheDocument();
    });

    it('displays failing count with label', () => {
      render(<ComparisonList comparisons={createMockComparisons(5, 3)} />);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Failing')).toBeInTheDocument();
    });

    it('displays Comparison Summary heading', () => {
      render(<ComparisonList comparisons={createMockComparisons(3, 2)} />);
      expect(screen.getByText('Comparison Summary')).toBeInTheDocument();
    });
  });

  describe('Pass Rate Display', () => {
    it('displays overall pass rate label', () => {
      render(<ComparisonList comparisons={createMockComparisons(3, 2)} />);
      expect(screen.getByText('Overall Pass Rate')).toBeInTheDocument();
    });

    it('calculates pass rate as percentage', () => {
      render(<ComparisonList comparisons={createMockComparisons(3, 2)} />);
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('shows 100% when all pass', () => {
      render(<ComparisonList comparisons={createMockComparisons(3, 3)} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('shows 0% when all fail', () => {
      render(<ComparisonList comparisons={createMockComparisons(3, 0)} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('rounds pass rate to nearest integer', () => {
      render(<ComparisonList comparisons={createMockComparisons(3, 1)} />);
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('Pass Rate Bar Color', () => {
    it('shows green bar when pass rate is 80% or above', () => {
      const { container } = render(<ComparisonList comparisons={createMockComparisons(5, 4)} />);
      const progressBar = container.querySelector('[style*="width: 80%"]');
      expect(progressBar).toHaveClass('bg-green-500');
    });

    it('shows yellow bar when pass rate is between 50% and 80%', () => {
      const { container } = render(<ComparisonList comparisons={createMockComparisons(10, 6)} />);
      const progressBar = container.querySelector('[style*="width: 60%"]');
      expect(progressBar).toHaveClass('bg-yellow-500');
    });

    it('shows red bar when pass rate is below 50%', () => {
      const { container } = render(<ComparisonList comparisons={createMockComparisons(10, 3)} />);
      const progressBar = container.querySelector('[style*="width: 30%"]');
      expect(progressBar).toHaveClass('bg-red-500');
    });
  });

  describe('Component Cards', () => {
    it('renders all comparison cards', () => {
      const comparisons = [
        createMockComparison({ componentId: 'button-primary' }),
        createMockComparison({ componentId: 'card-header', passed: false }),
        createMockComparison({ componentId: 'nav-item' }),
      ];
      render(<ComparisonList comparisons={comparisons} />);

      expect(screen.getByText('button-primary')).toBeInTheDocument();
      expect(screen.getByText('card-header')).toBeInTheDocument();
      expect(screen.getByText('nav-item')).toBeInTheDocument();
    });

    it('displays Component Details heading', () => {
      render(<ComparisonList comparisons={[createMockComparison()]} />);
      expect(screen.getByText('Component Details')).toBeInTheDocument();
    });
  });

  describe('Feedback Propagation', () => {
    it('passes onFeedback to comparison cards', async () => {
      const onFeedback = vi.fn();
      const comparisons = [createMockComparison({ componentId: 'test-component' })];
      render(<ComparisonList comparisons={comparisons} onFeedback={onFeedback} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));
      await userEvent.click(screen.getByRole('button', { name: /approve/i }));

      expect(onFeedback).toHaveBeenCalledWith('test-component', 'approve');
    });

    it('does not render feedback buttons when onFeedback not provided', async () => {
      render(<ComparisonList comparisons={[createMockComparison()]} />);

      await userEvent.click(screen.getByRole('button', { name: /expand details/i }));

      expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    });

    it('passes onFeedback to all cards', async () => {
      const onFeedback = vi.fn();
      const comparisons = [
        createMockComparison({ componentId: 'first' }),
        createMockComparison({ componentId: 'second' }),
      ];
      render(<ComparisonList comparisons={comparisons} onFeedback={onFeedback} />);

      const expandButtons = screen.getAllByRole('button', { name: /expand details/i });
      await userEvent.click(expandButtons[1]!);
      await userEvent.click(screen.getByRole('button', { name: /reject/i }));

      expect(onFeedback).toHaveBeenCalledWith('second', 'reject');
    });
  });
});
