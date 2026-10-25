import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getLeaseRentTransactionReceiptAction } from '@/app/[locale]/assets/revenue/payment/actions';
import type { BillTransactionWithDetailsDto } from '@/types/asset/revenue/payment/leaseRentPayment.types';

export interface UseLeasePaymentReceiptDetailsReturn {
  expandedReceiptId: string | number | null;
  receiptDetailsCache: Record<string | number, BillTransactionWithDetailsDto>;
  isReceiptLoadingMap: Record<string | number, boolean>;
  handleToggleReceiptDetails: (transactionId: string | number) => Promise<void>;
}

export function useLeasePaymentReceiptDetails(recordId: string): UseLeasePaymentReceiptDetailsReturn {
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | number | null>(null);
  const [receiptDetailsCache, setReceiptDetailsCache] = useState<Record<string | number, BillTransactionWithDetailsDto>>({});
  const [isReceiptLoadingMap, setIsReceiptLoadingMap] = useState<Record<string | number, boolean>>({});

  const handleToggleReceiptDetails = useCallback(async (transactionId: string | number) => {
    if (expandedReceiptId === transactionId) {
      setExpandedReceiptId(null);
      return;
    }

    setExpandedReceiptId(transactionId);

    if (!receiptDetailsCache[transactionId]) {
      setIsReceiptLoadingMap(prev => ({ ...prev, [transactionId]: true }));
      try {
        const res = await getLeaseRentTransactionReceiptAction(recordId, transactionId);
        if (res.success && res.data) {
          const itemData = res.data as BillTransactionWithDetailsDto;
          setReceiptDetailsCache(prev => ({
            ...prev,
            [transactionId]: itemData
          }));
        } else {
          toast.error('Failed to fetch receipt details');
        }
      } catch {
        toast.error('An error occurred while fetching receipt details');
      } finally {
        setIsReceiptLoadingMap(prev => ({ ...prev, [transactionId]: false }));
      }
    }
  }, [expandedReceiptId, receiptDetailsCache, recordId]);

  return {
    expandedReceiptId,
    receiptDetailsCache,
    isReceiptLoadingMap,
    handleToggleReceiptDetails,
  };
}
