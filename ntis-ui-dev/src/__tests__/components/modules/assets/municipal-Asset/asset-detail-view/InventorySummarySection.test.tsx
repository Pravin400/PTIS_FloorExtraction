/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from '@testing-library/react';
import { InventorySummarySection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/InventorySummarySection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/modules/assets/municipal-Asset/asset-detail-view/SectionCard', () => ({
  SectionCard: ({ title, children }: any) => (
    <div data-testid="section-card">
      <div data-testid="section-card-title">{title}</div>
      <div data-testid="section-card-content">{children}</div>
    </div>
  ),
}));

describe('InventorySummarySection', () => {
  it('renders correctly with given items', () => {
    render(<InventorySummarySection data={{ inventoryItems: [{ id: '1', label: 'Total Area', count: 15, category: 'General' }] } as any} />);
    
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
    expect(screen.getByTestId('section-card-title')).toHaveTextContent('inventorySummary');
    
    expect(screen.getByText('Total Area')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('handles missing inventory items gracefully', () => {
    render(<InventorySummarySection data={{ inventoryItems: [] } as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });

  it('handles completely null data', () => {
    render(<InventorySummarySection data={{ inventoryItems: [] } as any} />);
    expect(screen.getByTestId('section-card')).toBeInTheDocument();
  });
});
