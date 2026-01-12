import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Design System Extractor');
  });

  it('renders the description', () => {
    render(<HomePage />);
    expect(screen.getByText(/Extract design tokens/i)).toBeInTheDocument();
  });

  it('renders the URL input', () => {
    render(<HomePage />);
    expect(screen.getByRole('textbox', { name: /website url/i })).toBeInTheDocument();
  });

  it('renders the extract button', () => {
    render(<HomePage />);
    expect(screen.getByRole('button', { name: /extract/i })).toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<HomePage />);
    expect(screen.getByText(/Enter any website URL/i)).toBeInTheDocument();
  });
});
