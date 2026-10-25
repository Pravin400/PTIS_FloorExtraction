import { useState, useMemo, useCallback } from 'react';
import { useLeaseRentDemands } from '@/hooks/asset/revenue/payment/useLeaseRentDemands';
import type { LeaseRentPaymentDetail, LeaseRentDemandItem, DemandSimulationResult } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { todayISO } from '@/lib/utils/asset-utils/payment-utils/payment-format';

export interface UseLeasePaymentDemandAllocationProps {
  record: LeaseRentPaymentDetail;
  hasSearched: boolean;
}

export interface UseLeasePaymentDemandAllocationReturn {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  paymentDate: string;
  setPaymentDate: React.Dispatch<React.SetStateAction<string>>;
  demandSummary?: DemandSimulationResult | null;
  demandsLoading: boolean;
  refetchDemands: () => Promise<void>;
  rawDemands: LeaseRentDemandItem[];
  demands: LeaseRentDemandItem[];
  totalPages: number;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectAmounts: Record<string, number>;
  setSelectAmounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  allSelected: boolean;
  toggleRow: (id: string, pendingAmt: number) => void;
  toggleAll: () => void;
  allocateAmountFIFO: (val: number, currentSelectedIds?: Set<string>) => void;
}

function computeFIFOAllocations(
  rawDemands: LeaseRentDemandItem[],
  val: number,
  currentSelectedIds?: Set<string>
): { ids: Set<string>; amounts: Record<string, number> } {
  if (val <= 0) {
    return { ids: new Set<string>(), amounts: {} };
  }
  let remaining = val;
  const ids = new Set<string>();
  const amounts: Record<string, number> = {};
  let selectable = rawDemands.filter(
    (r) => r.demandStatus !== 'Paid' && Number(r.pendingAmount ?? r.total ?? 0) > 0
  );

  if (currentSelectedIds && currentSelectedIds.size > 0) {
    const selectedSelectable = selectable.filter((r) => currentSelectedIds.has(String(r.id ?? r.month)));
    if (selectedSelectable.length > 0) {
      selectable = selectedSelectable;
    }
  }

  for (const r of selectable) {
    if (remaining <= 0) break;
    const id = String(r.id ?? r.month);
    const pending = Number(r.pendingAmount ?? r.total ?? 0);
    ids.add(id);
    if (remaining >= pending) {
      amounts[id] = pending;
      remaining -= pending;
    } else {
      amounts[id] = remaining;
      remaining = 0;
    }
  }
  return { ids, amounts };
}

export function useLeasePaymentDemandAllocation({
  record,
  hasSearched,
}: UseLeasePaymentDemandAllocationProps): UseLeasePaymentDemandAllocationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [paymentDate, setPaymentDate] = useState(todayISO());

  const assetIdToFetch = record.assetId || record.leaseRentRegistrationId;

  const { data: demandSummary, isLoading: demandsLoading, refetch: refetchDemands } = useLeaseRentDemands(
    assetIdToFetch,
    paymentDate,
    undefined,
    record.demandSummary
  );

  const rawDemands = useMemo(() => {
    return (demandSummary?.demands ?? []).filter((row) => {
      const pending = Number(row.pendingAmount ?? row.total ?? 0);
      return row.demandStatus !== 'Paid' && pending > 0;
    });
  }, [demandSummary]);

  const totalPages = Math.max(1, Math.ceil((hasSearched ? rawDemands.length : 0) / itemsPerPage));

  const demands = useMemo(() => {
    if (!hasSearched) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return rawDemands.slice(start, start + itemsPerPage);
  }, [rawDemands, currentPage, itemsPerPage, hasSearched]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAmounts, setSelectAmounts] = useState<Record<string, number>>({});

  const allocateAmountFIFO = useCallback(
    (val: number, currentSelectedIds?: Set<string>) => {
      const { ids, amounts } = computeFIFOAllocations(rawDemands, val, currentSelectedIds);
      setSelectedIds(ids);
      setSelectAmounts(amounts);
    },
    [rawDemands]
  );

  const allSelected = useMemo(() => {
    const selectable = rawDemands.filter(
      (r) => r.demandStatus !== 'Paid' && Number(r.pendingAmount ?? r.total ?? 0) > 0
    );
    return selectable.length > 0 && selectable.every((r) => selectedIds.has(String(r.id ?? r.month)));
  }, [rawDemands, selectedIds]);

  const toggleRow = useCallback((id: string, pendingAmt: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectAmounts((a) => ({ ...a, [id]: 0 }));
      } else {
        next.add(id);
        setSelectAmounts((a) => ({ ...a, [id]: pendingAmt }));
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const selectable = rawDemands.filter(
      (r) => r.demandStatus !== 'Paid' && Number(r.pendingAmount ?? r.total ?? 0) > 0
    );
    if (selectable.length === 0) return;
    if (allSelected) {
      setSelectedIds(new Set());
      setSelectAmounts({});
    } else {
      const ids = new Set<string>();
      const amounts: Record<string, number> = {};
      selectable.forEach((r) => {
        const id = String(r.id ?? r.month);
        ids.add(id);
        amounts[id] = Number(r.pendingAmount ?? r.total ?? 0);
      });
      setSelectedIds(ids);
      setSelectAmounts(amounts);
    }
  }, [rawDemands, allSelected]);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    paymentDate,
    setPaymentDate,
    demandSummary,
    demandsLoading,
    refetchDemands,
    rawDemands,
    demands,
    totalPages,
    selectedIds,
    setSelectedIds,
    selectAmounts,
    setSelectAmounts,
    allSelected,
    toggleRow,
    toggleAll,
    allocateAmountFIFO,
  };
}
