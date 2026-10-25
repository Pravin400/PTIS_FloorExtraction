import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type {
  LeaseRentPaymentDetail,
  BillTransactionWithDetailsDto,
  PaymentModeKey,
  PaymentType,
  DemandSimulationResult,
  LeaseRentDemandItem,
} from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { useLeasePaymentSearch, type UseLeasePaymentSearchReturn } from './useLeasePaymentSearch';
import { useLeasePaymentReceiptDetails } from './useLeasePaymentReceiptDetails';
import { useLeasePaymentDemandAllocation } from './useLeasePaymentDemandAllocation';
import { useLeasePaymentSubmitForm } from './useLeasePaymentSubmitForm';

export interface UseLeasePaymentStateProps {
  record: LeaseRentPaymentDetail;
  historyItems?: unknown[];
  recordId: string;
}

export interface UseLeasePaymentStateReturn extends UseLeasePaymentSearchReturn {
  isPending: boolean;
  isSubmitLocked: boolean;
  router: ReturnType<typeof useRouter>;
  pathname: string;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  paymentDate: string;
  setPaymentDate: React.Dispatch<React.SetStateAction<string>>;
  expandedReceiptId: string | number | null;
  receiptDetailsCache: Record<string | number, BillTransactionWithDetailsDto>;
  isReceiptLoadingMap: Record<string | number, boolean>;
  handleToggleReceiptDetails: (transactionId: string | number) => Promise<void>;
  demandSummary?: DemandSimulationResult | null;
  rawDemands: LeaseRentDemandItem[];
  demands: LeaseRentDemandItem[];
  demandsLoading: boolean;
  totalPages: number;
  selectedIds: Set<string>;
  selectAmounts: Record<string, number>;
  paymentMode: PaymentModeKey;
  setPaymentMode: React.Dispatch<React.SetStateAction<PaymentModeKey>>;
  paymentType: PaymentType;
  setPaymentType: React.Dispatch<React.SetStateAction<PaymentType>>;
  amountReceived: string;
  advanceAppliedStr: string;
  referenceNo: string;
  setReferenceNo: React.Dispatch<React.SetStateAction<string>>;
  bankName: string;
  setBankName: React.Dispatch<React.SetStateAction<string>>;
  chequeDate: string;
  setChequeDate: React.Dispatch<React.SetStateAction<string>>;
  remarks: string;
  setRemarks: React.Dispatch<React.SetStateAction<string>>;
  ddPayeeName: string;
  setDdPayeeName: React.Dispatch<React.SetStateAction<string>>;
  isPhotoModalOpen: boolean;
  setIsPhotoModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  totalOutstanding: number;
  overdueAmount: number;
  currentDueAmount: number;
  totalSelected: number;
  effectiveAmount: number;
  effectiveAdvanceApplied: number;
  totalSettleAmount: number;
  handleAmountReceivedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAdvanceAppliedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaymentTypeChange: (type: PaymentType) => void;
  allSelected: boolean;
  toggleRow: (id: string, pendingAmt: number) => void;
  toggleAll: () => void;
  handleReset: () => void;
  handleAcceptPayment: () => void;
  startTransition: React.TransitionStartFunction;
}

export function useLeasePaymentState({ record, historyItems: _historyItems, recordId }: UseLeasePaymentStateProps): UseLeasePaymentStateReturn {
  const router = useRouter();
  const pathname = usePathname();

  // 1. Search Hook
  const searchState = useLeasePaymentSearch(record);

  // 2. Receipt Details Hook
  const receiptState = useLeasePaymentReceiptDetails(recordId);

  // 3. Demand Allocation Hook
  const demandState = useLeasePaymentDemandAllocation({
    record,
    hasSearched: searchState.hasSearched,
  });

  // Modal states
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Computed summary totals
  const totalOutstanding = demandState.demandSummary?.totalOutstanding ?? 0;
  const overdueAmount = demandState.demandSummary?.totalOverdue ?? 0;
  const currentDueAmount = demandState.demandSummary?.totalCurrentDue ?? 0;

  const totalSelected = useMemo(
    () => [...demandState.selectedIds].reduce((s, id) => s + (demandState.selectAmounts[id] ?? 0), 0),
    [demandState.selectedIds, demandState.selectAmounts]
  );

  // 4. Form Submit Hook
  const formState = useLeasePaymentSubmitForm({
    record,
    recordId,
    hasSearched: searchState.hasSearched,
    rawDemands: demandState.rawDemands,
    selectedIds: demandState.selectedIds,
    selectAmounts: demandState.selectAmounts,
    allSelected: demandState.allSelected,
    totalOutstanding,
    allocateAmountFIFO: demandState.allocateAmountFIFO,
    setSelectedIds: demandState.setSelectedIds,
    setSelectAmounts: demandState.setSelectAmounts,
    setPaymentDate: demandState.setPaymentDate,
    refetchDemands: demandState.refetchDemands,
  });

  return {
    ...searchState,
    ...receiptState,
    ...demandState,
    ...formState,
    router,
    pathname,
    isPhotoModalOpen,
    setIsPhotoModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    totalOutstanding,
    overdueAmount,
    currentDueAmount,
    totalSelected,
  };
}
