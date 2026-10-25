import { render, screen } from '@testing-library/react';
import { QuickActionsSection } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/QuickActionsSection';
import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock the child components to avoid testing their internal logic here
vi.mock('@/components/modules/assets/municipal-Asset/sub-asset-detail-view/CollectionHistoryDrawer', () => ({
  CollectionHistoryDrawer: () => <div data-testid="mock-collection-drawer"></div>,
}));

describe('QuickActionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<QuickActionsSection subAssetId={123} />);
    expect(screen.getByText(/collectionHistoryBtn/i)).toBeInTheDocument();
    expect(screen.getByText(/auditBtn/i)).toBeInTheDocument();
  });
});
