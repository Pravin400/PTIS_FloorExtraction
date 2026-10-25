import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeasePaymentSearch } from '@/hooks/asset/revenue/payment/useLeasePaymentSearch';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';

const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const mockRecord: LeaseRentPaymentDetail = {
  leaseRentRegistrationId: 5,
  assetId: 5,
  assetNo: 'AST-005',
  assetName: 'Asset 5',
  monthlyRent: 2000,
  pendingDue: 0,
  currentDemand: 2000,
  currentPaid: 0,
  currentPenalty: 0,
  currentGst: 0,
  advanceBalance: 0,
  pendingDemand: 0,
  pendingPaid: 0,
  pendingPenalty: 0,
  pendingGst: 0,
  penalty: 0,
  gst: 0,
  totalPayable: 2000,
};

describe('useLeasePaymentSearch', () => {
  it('initializes with record assetNo when query parameter is absent', () => {
    const { result } = renderHook(() => useLeasePaymentSearch(mockRecord));

    expect(result.current.searchValue).toBe('AST-005');
  });

  it('manages filter state setters', () => {
    const { result } = renderHook(() => useLeasePaymentSearch(mockRecord));

    expect(result.current.assetCategoryId).toBe('');
    expect(result.current.assetTypeId).toBe('');
    expect(result.current.zoneId).toBe('');
    expect(result.current.wardId).toBe('');
  });
});
