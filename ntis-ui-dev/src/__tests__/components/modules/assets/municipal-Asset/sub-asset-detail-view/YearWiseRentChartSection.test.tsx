/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { YearWiseRentChartSection } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/YearWiseRentChartSection';
import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('YearWiseRentChartSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with data', () => {
    const mockData = {
      yearlyRent: [
        { year: 2022, amount: 1000 },
        { year: 2023, amount: 2000 },
      ]
    } as any;
    render(<YearWiseRentChartSection data={mockData} />);
    expect(screen.getByText(/2023/)).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<YearWiseRentChartSection data={{ yearlyRent: [] } as any} />);
    expect(screen.getByText(/noDataAvailableStr/i)).toBeInTheDocument();
  });
});
