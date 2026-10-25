/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { LeaseRentDetailsSection } from '@/components/modules/assets/municipal-Asset/sub-asset-detail-view/LeaseAndFinancialSections';
import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('LeaseAndFinancialSections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    const mockData = {
      leaseDurationMonths: 24,
      rentFrequency: 'Monthly',
      monthlyRent: 5000,
      annualDemand: 60000,
      subAssetStatus: 'Occupied'
    } as any;
    render(<LeaseRentDetailsSection data={mockData} />);
    expect(screen.getByText(/leaseRentDetails/i)).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<LeaseRentDetailsSection data={{} as any} />);
    expect(screen.getByText(/leaseRentDetails/i)).toBeInTheDocument();
  });
});
