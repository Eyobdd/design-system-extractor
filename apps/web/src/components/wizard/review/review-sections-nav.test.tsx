import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewSectionsNav } from './review-sections-nav';

describe('ReviewSectionsNav', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders all section buttons', () => {
    render(<ReviewSectionsNav />);

    expect(screen.getByRole('button', { name: /Tokens/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Variants/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Usage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Code/i })).toBeInTheDocument();
  });

  it('renders Sections heading', () => {
    render(<ReviewSectionsNav />);
    expect(screen.getByText('Sections')).toBeInTheDocument();
  });

  it('has Tokens as default active section', () => {
    render(<ReviewSectionsNav />);

    const tokensButton = screen.getByRole('button', { name: /Tokens/i });
    expect(tokensButton.textContent).toContain('→');
  });

  it('changes active section on click', () => {
    render(<ReviewSectionsNav />);

    const variantsButton = screen.getByRole('button', { name: /Variants/i });
    fireEvent.click(variantsButton);

    expect(variantsButton.textContent).toContain('→');
  });

  it('calls scrollIntoView when section is clicked', () => {
    const mockElement = document.createElement('div');
    mockElement.id = 'review-section-variants';
    document.body.appendChild(mockElement);

    render(<ReviewSectionsNav />);

    const variantsButton = screen.getByRole('button', { name: /Variants/i });
    fireEvent.click(variantsButton);

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    document.body.removeChild(mockElement);
  });

  it('renders icons for each section', () => {
    render(<ReviewSectionsNav />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('renders as navigation element', () => {
    render(<ReviewSectionsNav />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
