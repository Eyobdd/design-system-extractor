import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarTools } from './sidebar-tools';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState } from '@/lib/wizard-types';
import { getInitialWizardState } from '@/lib/wizard-types';

vi.mock('./tokens/token-category-nav', () => ({
  TokenCategoryNav: () => <div data-testid="token-category-nav">Token Category Nav</div>,
}));

vi.mock('./variants/component-tree', () => ({
  ComponentTree: () => <div data-testid="component-tree">Component Tree</div>,
}));

vi.mock('./review/review-sections-nav', () => ({
  ReviewSectionsNav: () => <div data-testid="review-sections-nav">Review Sections Nav</div>,
}));

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState = { ...getInitialWizardState(), ...overrides };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

describe('SidebarTools', () => {
  it('renders nothing for step 1 (Extract)', () => {
    const { container } = render(<SidebarTools />, {
      wrapper: createWrapper({ currentStep: 1 }),
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders TokenCategoryNav for step 2 (Tokens)', () => {
    render(<SidebarTools />, {
      wrapper: createWrapper({ currentStep: 2 }),
    });

    expect(screen.getByTestId('token-category-nav')).toBeInTheDocument();
  });

  it('renders ComponentTree for step 3 (Variants)', () => {
    render(<SidebarTools />, {
      wrapper: createWrapper({ currentStep: 3 }),
    });

    expect(screen.getByTestId('component-tree')).toBeInTheDocument();
  });

  it('renders ReviewSectionsNav for step 4 (Review)', () => {
    render(<SidebarTools />, {
      wrapper: createWrapper({ currentStep: 4 }),
    });

    expect(screen.getByTestId('review-sections-nav')).toBeInTheDocument();
  });

  it('renders nothing for step 5 (Export)', () => {
    const { container } = render(<SidebarTools />, {
      wrapper: createWrapper({ currentStep: 5 }),
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for invalid step', () => {
    const { container } = render(<SidebarTools />, {
      wrapper: createWrapper({ currentStep: 99 as never }),
    });

    expect(container.firstChild).toBeNull();
  });
});
