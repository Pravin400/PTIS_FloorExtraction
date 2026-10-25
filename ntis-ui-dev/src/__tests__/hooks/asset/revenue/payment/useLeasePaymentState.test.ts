import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLeasePaymentState } from '@/hooks/asset/revenue/payment/useLeasePaymentState';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/en/assets/revenue/make-payment-v2/10',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en', recordId: '10' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock('@/lib/api/asset/asset-counter-payment/assetCounterPayment.service', () => ({
  assetCounterPaymentService: {
    getLeaseRentDemands: vi.fn().mockResolvedValue({
      status: 200,
      data: {
        demands: [],
        summary: {
          totalOutstanding: 5000,
          totalOverdue: 2000,
          totalCurrentDue: 3000,
        },
      },
    }),
    getBillTransactionDetails: vi.fn().mockResolvedValue({
      status: 200,
      data: {},
    }),
  },
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

describe('useLeasePaymentState', () => {
  it('combines state from child hooks and returns complete payment state', () => {
    const { result } = renderHook(() =>
      useLeasePaymentState({
        record: mockRecord,
        historyItems: [],
        recordId: '10',
      })
    );

    expect(result.current.paymentType).toBe('Part');
    expect(result.current.isPhotoModalOpen).toBe(false);
    expect(result.current.isHistoryModalOpen).toBe(false);
  });
});
