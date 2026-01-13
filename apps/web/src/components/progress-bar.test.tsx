import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  describe('Progress Display', () => {
    it('renders progress percentage', () => {
      render(<ProgressBar progress={50} status="screenshot" />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders 0% for zero progress', () => {
      render(<ProgressBar progress={0} status="pending" />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders 100% for complete progress', () => {
      render(<ProgressBar progress={100} status="complete" />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Status Labels', () => {
    it('renders pending status label', () => {
      render(<ProgressBar progress={0} status="pending" />);
      expect(screen.getByText('Starting extraction...')).toBeInTheDocument();
    });

    it('renders screenshot status label', () => {
      render(<ProgressBar progress={30} status="screenshot" />);
      expect(screen.getByText('Capturing screenshots...')).toBeInTheDocument();
    });

    it('renders vision status label', () => {
      render(<ProgressBar progress={50} status="vision" />);
      expect(screen.getByText('Analyzing components...')).toBeInTheDocument();
    });

    it('renders extraction status label', () => {
      render(<ProgressBar progress={70} status="extraction" />);
      expect(screen.getByText('Extracting design tokens...')).toBeInTheDocument();
    });

    it('renders comparison status label', () => {
      render(<ProgressBar progress={85} status="comparison" />);
      expect(screen.getByText('Comparing results...')).toBeInTheDocument();
    });

    it('renders complete status label', () => {
      render(<ProgressBar progress={100} status="complete" />);
      expect(screen.getByText('Extraction complete!')).toBeInTheDocument();
    });

    it('renders failed status label', () => {
      render(<ProgressBar progress={50} status="failed" />);
      expect(screen.getByText('Extraction failed')).toBeInTheDocument();
    });

    it('falls back to generic label for unknown status', () => {
      render(<ProgressBar progress={50} status="unknown" />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies blue color for in-progress states', () => {
      render(<ProgressBar progress={50} status="screenshot" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('bg-blue-500');
    });

    it('applies green color for complete state', () => {
      render(<ProgressBar progress={100} status="complete" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('bg-green-500');
    });

    it('applies red color for failed state', () => {
      render(<ProgressBar progress={50} status="failed" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('bg-red-500');
    });

    it('applies custom className to container', () => {
      const { container } = render(
        <ProgressBar progress={50} status="screenshot" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Progress Clamping', () => {
    it('clamps negative progress to 0%', () => {
      render(<ProgressBar progress={-10} status="pending" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveStyle({ width: '0%' });
    });

    it('clamps progress over 100 to 100%', () => {
      render(<ProgressBar progress={150} status="complete" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveStyle({ width: '100%' });
    });

    it('displays unclamped value in aria-valuenow', () => {
      render(<ProgressBar progress={150} status="complete" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '150');
    });
  });

  describe('Accessibility', () => {
    it('has progressbar role', () => {
      render(<ProgressBar progress={50} status="extraction" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has correct aria-valuenow', () => {
      render(<ProgressBar progress={75} status="extraction" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    });

    it('has aria-valuemin of 0', () => {
      render(<ProgressBar progress={50} status="extraction" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemax of 100', () => {
      render(<ProgressBar progress={50} status="extraction" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('has descriptive aria-label', () => {
      render(<ProgressBar progress={75} status="extraction" />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Extraction progress: 75%');
    });
  });
});
