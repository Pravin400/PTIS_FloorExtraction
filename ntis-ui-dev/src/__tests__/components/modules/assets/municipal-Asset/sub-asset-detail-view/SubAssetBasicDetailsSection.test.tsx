/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { SubAssetBasicDetailsSection } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/SubAssetBasicDetailsSection';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('SubAssetBasicDetailsSection', () => {
  it('renders correctly', () => {
    const mockData = {
      usage: 'Retail',
      floor: 'Ground',
      totalArea: '1200 Sq Ft'
    } as any;
    render(<SubAssetBasicDetailsSection data={mockData} />);
    expect(screen.getByText(/Retail/i)).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<SubAssetBasicDetailsSection data={{} as any} />);
    expect(screen.getByText(/subAssetBasicDetails/i)).toBeInTheDocument();
  });
});
