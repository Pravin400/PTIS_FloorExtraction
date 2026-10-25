import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DemandSummaryCardSection } from '@/components/modules/assets/revenue/payment/DemandSummaryCardSection';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockRecord: LeaseRentPaymentDetail = {
  leaseRentRegistrationId: 10,
  assetId: 10,
  assetNo: 'AST-100',
  assetName: 'Asset Building 100',
  zone: 'Zone A',
  wardNo: 'Ward 1',
  category: 'Commercial',
  shopName: 'Shop 100',
  tenantName: 'Jane Smith',
  tenantMobile: '9999999999',
  monthlyRent: 5000,
  pendingDue: 2000,
  currentDemand: 3000,
  currentPaid: 0,
  currentPenalty: 0,
  currentGst: 900,
  advanceBalance: 0,
  pendingDemand: 2000,
  pendingPaid: 0,
  pendingPenalty: 0,
  pendingGst: 0,
  penalty: 0,
  gst: 900,
  totalPayable: 5900,
};

describe('DemandSummaryCardSection', () => {
  it('renders summary cards with formatted amounts', () => {
    render(
      <DemandSummaryCardSection
        hasSearched={true}
        totalOutstanding={5900}
        overdueAmount={2000}
        currentDueAmount={3900}
        record={mockRecord}
        totalSettleAmount={5900}
      />
    );

    expect(screen.getAllByText('5,900.00').length).toBeGreaterThan(0);
    expect(screen.getByText('2,000.00')).toBeDefined();
    expect(screen.getByText('3,900.00')).toBeDefined();
  });
});
