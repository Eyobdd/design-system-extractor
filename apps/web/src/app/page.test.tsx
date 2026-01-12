import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Design System Extractor');
  });

  it('renders the description', () => {
    render(<HomePage />);
    expect(screen.getByText(/Extract design tokens/i)).toBeInTheDocument();
  });

  it('renders the placeholder message', () => {
    render(<HomePage />);
    expect(screen.getByText(/URL input coming soon/i)).toBeInTheDocument();
  });
});
