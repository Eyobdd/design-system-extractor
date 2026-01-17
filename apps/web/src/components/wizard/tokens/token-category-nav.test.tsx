import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TokenCategoryNav } from './token-category-nav';

describe('TokenCategoryNav', () => {
  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders all category buttons', () => {
    render(<TokenCategoryNav />);

    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Spacing')).toBeInTheDocument();
    expect(screen.getByText('Radii')).toBeInTheDocument();
    expect(screen.getByText('Shadows')).toBeInTheDocument();
  });

  it('renders Tokens heading', () => {
    render(<TokenCategoryNav />);
    expect(screen.getByText('Tokens')).toBeInTheDocument();
  });

  it('has Colors as default active category', () => {
    render(<TokenCategoryNav />);

    // Active category should have an arrow indicator
    const colorsButton = screen.getByRole('button', { name: /Colors/ });
    expect(colorsButton.textContent).toContain('→');
  });

  it('changes active category on click', () => {
    render(<TokenCategoryNav />);

    const spacingButton = screen.getByRole('button', { name: 'Spacing' });
    fireEvent.click(spacingButton);

    // Spacing should now have the arrow
    expect(spacingButton.textContent).toContain('→');
  });

  it('calls scrollIntoView when category is clicked', () => {
    // Create a mock element
    const mockElement = document.createElement('div');
    mockElement.id = 'token-category-typography';
    document.body.appendChild(mockElement);

    render(<TokenCategoryNav />);

    const typographyButton = screen.getByRole('button', { name: 'Typography' });
    fireEvent.click(typographyButton);

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    document.body.removeChild(mockElement);
  });

  it('renders as navigation element', () => {
    render(<TokenCategoryNav />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('all buttons are clickable', () => {
    render(<TokenCategoryNav />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);

    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });
});
