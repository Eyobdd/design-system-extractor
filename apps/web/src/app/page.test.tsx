import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { WizardProvider } from '@/contexts/wizard-context';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

function renderWithProvider() {
  return render(
    <WizardProvider>
      <HomePage />
    </WizardProvider>
  );
}

describe('HomePage', () => {
  it('renders the main heading', () => {
    renderWithProvider();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Design System Extractor');
  });

  it('renders the description', () => {
    renderWithProvider();
    expect(screen.getByText(/Enter a website URL to extract/i)).toBeInTheDocument();
  });

  it('renders the URL input', () => {
    renderWithProvider();
    expect(screen.getByRole('textbox', { name: /website url/i })).toBeInTheDocument();
  });

  it('renders extract-related buttons', () => {
    renderWithProvider();
    // Multiple buttons with "Extract" text exist (sidebar step + form submit)
    const extractButtons = screen.getAllByRole('button', { name: /extract/i });
    expect(extractButtons.length).toBeGreaterThan(0);
  });
});
