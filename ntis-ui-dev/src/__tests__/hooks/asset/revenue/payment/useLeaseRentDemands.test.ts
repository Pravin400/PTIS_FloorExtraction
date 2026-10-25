import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeaseRentDemands } from '@/hooks/asset/revenue/payment/useLeaseRentDemands';

vi.mock('@/app/[locale]/assets/revenue/payment/actions', () => ({
  getLeaseRentDemandsAction: vi.fn().mockResolvedValue({
    success: true,
    data: {
      totalOutstanding: 1180,
      totalOverdue: 0,
      totalCurrentDue: 1180,
      pendingDemand: 0,
      pendingPaid: 0,
      pendingOutstanding: 0,
      currentDemand: 1000,
      currentPaid: 0,
      currentPending: 1000,
      demands: [
        { id: '1', financialYear: '2025-2026', dueDate: '2025-06-01', demandAmount: 1000, paidAmount: 0, balanceAmount: 1000, penaltyAmount: 0, gstAmount: 180, status: 'Unpaid' },
      ],
    },
  }),
}));

describe('useLeaseRentDemands', () => {
  it('fetches lease rent demands and updates data state', async () => {
    const { result } = renderHook(() => useLeaseRentDemands(10));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data?.totalOutstanding).toBe(1180);
    expect(result.current.data?.demands.length).toBe(1);
  });

  it('refetches demands on demand', async () => {
    const { result } = renderHook(() => useLeaseRentDemands(10, '2025-07-01'));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.isLoading).toBe(false);
  });
});
