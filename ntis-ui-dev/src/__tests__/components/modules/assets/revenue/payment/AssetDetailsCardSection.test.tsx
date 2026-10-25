import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssetDetailsCardSection } from '@/components/modules/assets/revenue/payment/AssetDetailsCardSection';
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

describe('AssetDetailsCardSection', () => {
  it('renders asset details card section', () => {
    render(
      <AssetDetailsCardSection
        record={mockRecord}
        hasSearched={true}
        isPhotoModalOpen={false}
        setIsPhotoModalOpen={vi.fn()}
      />
    );

    expect(screen.getByText('AST-100')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
  });
});
