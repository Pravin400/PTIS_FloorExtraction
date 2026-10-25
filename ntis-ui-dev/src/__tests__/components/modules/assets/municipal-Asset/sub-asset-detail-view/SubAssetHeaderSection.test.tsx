/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { SubAssetHeaderSection } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/SubAssetHeaderSection';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('SubAssetHeaderSection', () => {
  it('renders correctly with full data', () => {
    const mockData = {
      subAssetId: 'SA-001',
      assetCategoryName: 'Commercial',
      assetTypeName: 'Shop',
      healthScore: 85,
      valuation: '₹ 10,00,000'
    } as any;
    render(<SubAssetHeaderSection data={mockData} />);
    expect(screen.getByText(/SA-001/i)).toBeInTheDocument();
  });

  it('handles null or empty data gracefully', () => {
    render(<SubAssetHeaderSection data={{ valuation: '-' } as any} />);
    expect(screen.getByText(/Valuation/i)).toBeInTheDocument();
  });
});
