import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeasePaymentDemandAllocation } from '@/hooks/asset/revenue/payment/useLeasePaymentDemandAllocation';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';

vi.mock('@/app/[locale]/assets/revenue/payment/actions', () => ({
  getLeaseRentDemandsAction: vi.fn().mockResolvedValue({
    success: true,
    data: {
      demands: [
        { id: '1', pendingAmount: 1000, demandStatus: 'Unpaid', total: 1000 },
        { id: '2', pendingAmount: 1500, demandStatus: 'Unpaid', total: 1500 },
      ],
      totalOutstanding: 2500,
      totalOverdue: 1000,
      totalCurrentDue: 1500,
    },
  }),
}));

const mockRecord: LeaseRentPaymentDetail = {
  leaseRentRegistrationId: 10,
  assetId: 10,
  assetNo: 'AST-10',
  assetName: 'Asset 10',
  monthlyRent: 1000,
  pendingDue: 1000,
  currentDemand: 1500,
  currentPaid: 0,
  currentPenalty: 0,
  currentGst: 0,
  advanceBalance: 0,
  pendingDemand: 1000,
  pendingPaid: 0,
  pendingPenalty: 0,
  pendingGst: 0,
  penalty: 0,
  gst: 0,
  totalPayable: 2500,
};

describe('useLeasePaymentDemandAllocation', () => {
  it('allocates amount using FIFO rule across demands', async () => {
    const { result } = renderHook(() =>
      useLeasePaymentDemandAllocation({ record: mockRecord, hasSearched: true })
    );

    await act(async () => {
      await result.current.refetchDemands();
    });

    act(() => {
      result.current.allocateAmountFIFO(1500);
    });

    expect(result.current.selectedIds.has('1')).toBe(true);
    expect(result.current.selectAmounts['1']).toBe(1000);
    expect(result.current.selectAmounts['2']).toBe(500);
  });

  it('resets selected demands and amounts via toggleAll', () => {
    const { result } = renderHook(() =>
      useLeasePaymentDemandAllocation({ record: mockRecord, hasSearched: true })
    );

    act(() => {
      result.current.toggleAll();
    });

    expect(result.current.selectedIds).toBeDefined();
  });
});
