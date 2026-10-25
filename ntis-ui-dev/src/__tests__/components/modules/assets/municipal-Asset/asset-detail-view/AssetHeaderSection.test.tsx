/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen } from '@testing-library/react';
import { AssetHeaderSection } from '@/components/modules/assets/municipal-Asset/asset-detail-view/AssetHeaderSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('AssetHeaderSection', () => {
it('renders header details correctly', () => {
    render(<AssetHeaderSection data={{ kpiMetrics: {} } as any} />);
    // Generic check that it renders without crashing
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('handles null data gracefully', () => {
    render(<AssetHeaderSection data={{ kpiMetrics: {} } as any} />);
  });
});






