'use client';

import { useWizard } from '@/hooks/use-wizard';
import { TokenCategoryNav } from './tokens/token-category-nav';
import { ComponentTree } from './variants/component-tree';
import { ReviewSectionsNav } from './review/review-sections-nav';

export function SidebarTools() {
  const { state } = useWizard();

  switch (state.currentStep) {
    case 1:
      return null;

    case 2:
      return <TokenCategoryNav />;

    case 3:
      return <ComponentTree />;

    case 4:
      return <ReviewSectionsNav />;

    case 5:
      return null;

    default:
      return null;
  }
}
