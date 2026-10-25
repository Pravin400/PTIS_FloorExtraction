/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { RevenueCollectionSection } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/RevenueCollectionSection';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('RevenueCollectionSection', () => {
  it('renders correctly', () => {
    const mockData = {
      totalCollection: 50000,
      totalDemand: 10000,
      totalArrears: 5000
    } as any;
    render(<RevenueCollectionSection data={mockData} />);
    expect(screen.getByText(/50,000/i)).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<RevenueCollectionSection data={{} as any} />);
    expect(screen.getByText(/totalCollectionLabel/i)).toBeInTheDocument();
  });
});
