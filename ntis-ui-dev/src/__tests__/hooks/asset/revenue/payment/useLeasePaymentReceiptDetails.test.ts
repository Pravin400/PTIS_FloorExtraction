import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeasePaymentReceiptDetails } from '@/hooks/asset/revenue/payment/useLeasePaymentReceiptDetails';
import { getLeaseRentTransactionReceiptAction } from '@/app/[locale]/assets/revenue/payment/actions';

vi.mock('@/app/[locale]/assets/revenue/payment/actions', () => ({
  getLeaseRentTransactionReceiptAction: vi.fn(),
}));

describe('useLeasePaymentReceiptDetails', () => {
  it('fetches receipt details and updates cache when expanded', async () => {
    const mockReceipt = { paidAmount: 5000, paymentMode: 'CASH', paymentDate: '2025-06-01' };
    vi.mocked(getLeaseRentTransactionReceiptAction).mockResolvedValueOnce({
      success: true,
      data: mockReceipt as never,
    });

    const { result } = renderHook(() => useLeasePaymentReceiptDetails('10'));

    await act(async () => {
      await result.current.handleToggleReceiptDetails(101);
    });

    expect(result.current.expandedReceiptId).toBe(101);
    expect(result.current.receiptDetailsCache[101]).toEqual(mockReceipt);
  });

  it('collapses expanded receipt details when toggled again', async () => {
    const { result } = renderHook(() => useLeasePaymentReceiptDetails('10'));

    await act(async () => {
      await result.current.handleToggleReceiptDetails(101);
    });

    await act(async () => {
      await result.current.handleToggleReceiptDetails(101);
    });

    expect(result.current.expandedReceiptId).toBeNull();
  });
});
