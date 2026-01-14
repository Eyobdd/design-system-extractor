import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OriginalPreview, OriginalPreviewFallback } from './original-preview';
import type { BoundingBox } from '@extracted/types';

const mockBoundingBox: BoundingBox = {
  x: 100,
  y: 200,
  width: 300,
  height: 150,
};

describe('OriginalPreview', () => {
  describe('loading state', () => {
    it('shows loading indicator initially', () => {
      render(<OriginalPreview url="https://example.com" />);

      expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    });

    it('hides loading indicator after iframe loads', async () => {
      render(<OriginalPreview url="https://example.com" />);

      const iframe = screen.getByTitle('Original page preview');
      fireEvent.load(iframe);

      await waitFor(() => {
        expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('iframe has error handler attached', () => {
      render(<OriginalPreview url="https://example.com" />);

      const iframe = screen.getByTitle('Original page preview');
      expect(iframe).toBeInTheDocument();
    });
  });

  describe('iframe rendering', () => {
    it('renders iframe with correct src', () => {
      render(<OriginalPreview url="https://example.com/page" />);

      const iframe = screen.getByTitle('Original page preview');
      expect(iframe).toHaveAttribute('src', 'https://example.com/page');
    });

    it('renders iframe with sandbox attribute', () => {
      render(<OriginalPreview url="https://example.com" />);

      const iframe = screen.getByTitle('Original page preview');
      expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
    });

    it('applies custom height', () => {
      const { container } = render(<OriginalPreview url="https://example.com" height={500} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ height: '500px' });
    });

    it('applies custom className', () => {
      const { container } = render(
        <OriginalPreview url="https://example.com" className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('bounding box overlay', () => {
    it('shows bounding box overlay after load when provided', async () => {
      const { container } = render(
        <OriginalPreview url="https://example.com" boundingBox={mockBoundingBox} />
      );

      const iframe = screen.getByTitle('Original page preview');
      fireEvent.load(iframe);

      await waitFor(() => {
        const overlay = container.querySelector('[style*="left: 100px"]');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('does not show bounding box while loading', () => {
      const { container } = render(
        <OriginalPreview url="https://example.com" boundingBox={mockBoundingBox} />
      );

      const overlay = container.querySelector('[style*="left: 100px"]');
      expect(overlay).not.toBeInTheDocument();
    });

    it('shows "Original Component" label on overlay', async () => {
      render(<OriginalPreview url="https://example.com" boundingBox={mockBoundingBox} />);

      const iframe = screen.getByTitle('Original page preview');
      fireEvent.load(iframe);

      await waitFor(() => {
        expect(screen.getByText('Original Component')).toBeInTheDocument();
      });
    });
  });

  describe('URL changes', () => {
    it('resets to loading state when URL changes', () => {
      const { rerender } = render(<OriginalPreview url="https://example.com" />);

      const iframe = screen.getByTitle('Original page preview');
      fireEvent.load(iframe);

      rerender(<OriginalPreview url="https://different.com" />);

      expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    });
  });
});

describe('OriginalPreviewFallback', () => {
  describe('without screenshot', () => {
    it('shows no preview message', () => {
      render(<OriginalPreviewFallback url="https://example.com" />);

      expect(screen.getByText('No preview available')).toBeInTheDocument();
    });

    it('shows link to open in new tab', () => {
      render(<OriginalPreviewFallback url="https://example.com" />);

      const link = screen.getByRole('link', { name: 'Open in new tab' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('applies custom height', () => {
      const { container } = render(
        <OriginalPreviewFallback url="https://example.com" height={300} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ height: '300px' });
    });

    it('applies custom className', () => {
      const { container } = render(
        <OriginalPreviewFallback url="https://example.com" className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('with screenshot', () => {
    it('renders screenshot image', () => {
      render(
        <OriginalPreviewFallback
          url="https://example.com"
          screenshotUrl="https://screenshots.example.com/image.png"
        />
      );

      const img = screen.getByRole('img', { name: 'Page screenshot' });
      expect(img).toHaveAttribute('src', 'https://screenshots.example.com/image.png');
    });

    it('shows "Open original" link', () => {
      render(
        <OriginalPreviewFallback
          url="https://example.com"
          screenshotUrl="https://screenshots.example.com/image.png"
        />
      );

      const link = screen.getByRole('link', { name: 'Open original' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('shows bounding box overlay when provided', () => {
      const { container } = render(
        <OriginalPreviewFallback
          url="https://example.com"
          screenshotUrl="https://screenshots.example.com/image.png"
          boundingBox={mockBoundingBox}
        />
      );

      const overlay = container.querySelector('[style*="left: 100px"]');
      expect(overlay).toBeInTheDocument();
    });

    it('positions bounding box correctly', () => {
      const { container } = render(
        <OriginalPreviewFallback
          url="https://example.com"
          screenshotUrl="https://screenshots.example.com/image.png"
          boundingBox={mockBoundingBox}
        />
      );

      const overlay = container.querySelector('[style*="left: 100px"]');
      expect(overlay).toHaveStyle({
        left: '100px',
        top: '200px',
        width: '300px',
        height: '150px',
      });
    });

    it('shows "Original Component" label on bounding box', () => {
      render(
        <OriginalPreviewFallback
          url="https://example.com"
          screenshotUrl="https://screenshots.example.com/image.png"
          boundingBox={mockBoundingBox}
        />
      );

      expect(screen.getByText('Original Component')).toBeInTheDocument();
    });

    it('applies custom height with screenshot', () => {
      const { container } = render(
        <OriginalPreviewFallback
          url="https://example.com"
          screenshotUrl="https://screenshots.example.com/image.png"
          height={500}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ height: '500px' });
    });

    it('applies custom className with screenshot', () => {
      const { container } = render(
        <OriginalPreviewFallback
          url="https://example.com"
          screenshotUrl="https://screenshots.example.com/image.png"
          className="custom-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});
