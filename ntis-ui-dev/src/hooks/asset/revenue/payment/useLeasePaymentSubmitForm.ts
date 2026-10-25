import { useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { processMakePaymentAction } from '@/app/[locale]/assets/revenue/payment/actions';
import type { LeaseRentPaymentDetail, PaymentModeKey, PaymentType, LeaseRentDemandItem } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { todayISO } from '@/lib/utils/asset-utils/payment-utils/payment-format';

export interface UseLeasePaymentSubmitFormProps {
  record: LeaseRentPaymentDetail;
  recordId: string;
  hasSearched: boolean;
  rawDemands: LeaseRentDemandItem[];
  selectedIds: Set<string>;
  selectAmounts: Record<string, number>;
  allSelected: boolean;
  totalOutstanding: number;
  allocateAmountFIFO: (val: number, currentSelectedIds?: Set<string>) => void;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectAmounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setPaymentDate: React.Dispatch<React.SetStateAction<string>>;
  refetchDemands: () => Promise<void>;
}

export interface UseLeasePaymentSubmitFormReturn {
  isPending: boolean;
  isSubmitLocked: boolean;
  paymentMode: PaymentModeKey;
  setPaymentMode: React.Dispatch<React.SetStateAction<PaymentModeKey>>;
  paymentType: PaymentType;
  setPaymentType: React.Dispatch<React.SetStateAction<PaymentType>>;
  amountReceived: string;
  setAmountReceived: React.Dispatch<React.SetStateAction<string>>;
  advanceAppliedStr: string;
  setAdvanceAppliedStr: React.Dispatch<React.SetStateAction<string>>;
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
  handleAmountReceivedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAdvanceAppliedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaymentTypeChange: (type: PaymentType) => void;
  handleReset: () => void;
  handleAcceptPayment: () => void;
  startTransition: React.TransitionStartFunction;
  effectiveAmount: number;
  effectiveAdvanceApplied: number;
  totalSettleAmount: number;
}

export function useLeasePaymentSubmitForm({
  record,
  recordId,
  hasSearched,
  rawDemands,
  selectedIds,
  selectAmounts,
  allSelected,
  totalOutstanding,
  allocateAmountFIFO,
  setSelectedIds,
  setSelectAmounts,
  setPaymentDate,
  refetchDemands,
}: UseLeasePaymentSubmitFormProps): UseLeasePaymentSubmitFormReturn {
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [paymentMode, setPaymentMode] = useState<PaymentModeKey>('Cash');
  const [paymentType, setPaymentType] = useState<PaymentType>('Part');
  const [amountReceived, setAmountReceived] = useState('');
  const [advanceAppliedStr, setAdvanceAppliedStr] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [ddPayeeName, setDdPayeeName] = useState('');
  const hasInitialized = useRef(false);

  const effectiveAmount = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const effectiveAdvanceApplied = parseFloat(advanceAppliedStr.replace(/,/g, '')) || 0;
  const totalSettleAmount = (effectiveAmount > 0 ? effectiveAmount : 0) + (effectiveAdvanceApplied > 0 ? effectiveAdvanceApplied : 0);

  const isInternalAllocationRef = useRef(false);

  // Initial Full Payment Selection Effect
  useEffect(() => {
    if (rawDemands.length === 0 || hasInitialized.current || totalOutstanding === 0) return;
    hasInitialized.current = true;

    isInternalAllocationRef.current = true;
    setPaymentType('Full');
    setAmountReceived(String(totalOutstanding));
    allocateAmountFIFO(totalOutstanding);
  }, [rawDemands, totalOutstanding, allocateAmountFIFO]);

  // Sync amountReceived & paymentType when user selects/deselects individual rows via checkboxes
  useEffect(() => {
    if (isInternalAllocationRef.current) {
      isInternalAllocationRef.current = false;
      return;
    }

    if (selectedIds.size === 0) {
      if (paymentType !== 'Advance') {
        Promise.resolve().then(() => {
          setAmountReceived('');
          setPaymentType('Part');
        });
      }
      return;
    }

    const selSum = [...selectedIds].reduce((sum, id) => sum + (selectAmounts[id] ?? 0), 0);
    Promise.resolve().then(() => {
      setAmountReceived(String(selSum));

      if (selSum === totalOutstanding && allSelected && totalOutstanding > 0) {
        setPaymentType('Full');
      } else if (selSum < totalOutstanding && selSum > 0) {
        setPaymentType('Part');
      }
    });
  }, [selectedIds, selectAmounts, totalOutstanding, allSelected, paymentType]);

  const handleAmountReceivedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-numeric/decimal characters (blocks e, E, +, -, spaces, letters, multiple dots)
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    setAmountReceived(val);
    const parsed = parseFloat(val) || 0;

    const totalSettle = (parsed > 0 ? parsed : 0) + (effectiveAdvanceApplied > 0 ? effectiveAdvanceApplied : 0);
    if (Math.abs(totalSettle - totalOutstanding) < 0.01 && totalOutstanding > 0) {
      setPaymentType('Full');
    } else if (totalSettle > totalOutstanding + 0.01) {
      setPaymentType('Advance');
    } else if (totalSettle < totalOutstanding - 0.01 && totalSettle > 0) {
      setPaymentType('Part');
    }

    isInternalAllocationRef.current = true;
    allocateAmountFIFO(parsed + effectiveAdvanceApplied);
  }, [allocateAmountFIFO, effectiveAdvanceApplied, totalOutstanding]);

  const handleAdvanceAppliedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    const parsed = parseFloat(val) || 0;
    if (parsed > (record.advanceBalance || 0)) return;
    setAdvanceAppliedStr(val);

    const totalSettle = (effectiveAmount > 0 ? effectiveAmount : 0) + (parsed > 0 ? parsed : 0);
    if (Math.abs(totalSettle - totalOutstanding) < 0.01 && totalOutstanding > 0) {
      setPaymentType('Full');
    } else if (totalSettle > totalOutstanding + 0.01) {
      setPaymentType('Advance');
    } else if (totalSettle < totalOutstanding - 0.01 && totalSettle > 0) {
      setPaymentType('Part');
    }

    isInternalAllocationRef.current = true;
    allocateAmountFIFO(effectiveAmount + parsed);
  }, [allocateAmountFIFO, effectiveAmount, record.advanceBalance, totalOutstanding]);

  const handlePaymentTypeChange = useCallback((type: PaymentType) => {
    setPaymentType(type);
    if (type === 'Full') {
      const advanceAvailable = record.advanceBalance || 0;
      const advanceToUse = Math.min(advanceAvailable, totalOutstanding);
      const cashNeeded = Math.max(0, totalOutstanding - advanceToUse);

      isInternalAllocationRef.current = true;
      allocateAmountFIFO(totalOutstanding);
      setAmountReceived(cashNeeded > 0 ? String(cashNeeded) : '0');
      setAdvanceAppliedStr(advanceToUse > 0 ? String(advanceToUse) : '');
    } else if (type === 'Advance' || type === 'Part') {
      isInternalAllocationRef.current = true;
      allocateAmountFIFO(0);
      setAmountReceived('');
      setAdvanceAppliedStr('');
    }
  }, [allocateAmountFIFO, totalOutstanding, record.advanceBalance]);

  useEffect(() => {
    if (hasSearched && totalOutstanding === 0 && paymentType !== 'Advance') {
      Promise.resolve().then(() => handlePaymentTypeChange('Advance'));
    }
  }, [totalOutstanding, hasSearched, paymentType, handlePaymentTypeChange]);

  const handleReset = useCallback(() => {
    setPaymentMode('Cash');
    setPaymentType('Part');
    setAmountReceived('');
    setAdvanceAppliedStr('');
    setReferenceNo('');
    setBankName('');
    setChequeDate('');
    setPaymentDate(todayISO());
    setRemarks('');
    setDdPayeeName('');
    setSelectedIds(new Set());
    setSelectAmounts({});
  }, [setPaymentDate, setSelectedIds, setSelectAmounts]);

  const handleAcceptPayment = useCallback(() => {
    if (isSubmitLocked || isPending) return;

    if (!paymentMode) { toast.error('Please select a payment mode.'); return; }
    if (totalSettleAmount <= 0) { toast.error('Amount must be greater than zero.'); return; }

    const requiresBankDetails = effectiveAmount > 0 && (paymentMode === 'Cheque' || paymentMode === 'DD' || paymentMode === 'NEFT' || paymentMode === 'RTGS');
    const isCash = paymentMode === 'Cash';
    const isDD = paymentMode === 'DD';

    if (effectiveAmount > 0 && !isCash && !referenceNo.trim()) { toast.error('Please enter the reference / transaction number.'); return; }
    if (requiresBankDetails && !bankName.trim()) { toast.error('Please enter the bank name.'); return; }
    if (requiresBankDetails && !chequeDate) { toast.error('Please enter the transaction date.'); return; }

    if (requiresBankDetails && chequeDate) {
      const selected = new Date(chequeDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const minDate = new Date();
      minDate.setHours(0, 0, 0, 0);
      minDate.setDate(minDate.getDate() - 90);

      if (selected > today) {
        toast.error('Date cannot be in the future.');
        return;
      }
      if (selected < minDate) {
        toast.error('Date cannot be older than 90 days (3 months).');
        return;
      }
    }
    if (isDD && !ddPayeeName.trim()) { toast.error('Please enter the DD payee name.'); return; }

    if (paymentType === 'Advance' && totalSettleAmount <= totalOutstanding + 0.01) {
      toast.error('For Advance Payment, the amount must be greater than the total outstanding due.');
      return;
    }

    if (paymentType === 'Part' && totalSettleAmount >= totalOutstanding - 0.01) {
      toast.error('For Part Payment, the amount must be less than the total outstanding due. Select Full Payment instead.');
      return;
    }

    setIsSubmitLocked(true);

    confirm({
      title: 'Confirm Payment',
      description: `You are about to process a payment of ₹${effectiveAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} via ${paymentMode} for Asset: ${record.shopName || record.assetName || '-'} (ID: ${record.assetNo || '-'}). Proceed with payment processing?`,
      confirmText: 'Accept Payment',
      cancelText: 'Cancel',
      onCancel: () => {
        setIsSubmitLocked(false);
      },
      onConfirm: () => {
        startTransition(async () => {
          try {
            const modeMap: Record<PaymentModeKey, string> = {
              CASH: 'Cash', CHEQUE: 'Cheque', DD: 'DD', ONLINE: 'Online', UPI: 'UPI', NEFT_RTGS: 'NEFT_RTGS',
              Cash: 'Cash', Cheque: 'Cheque', Online: 'Online', NEFT: 'NEFT', RTGS: 'RTGS',
            };

            const totalSelectedPending = rawDemands
              .filter(r => selectedIds.has(String(r.id ?? r.month)))
              .reduce((sum, r) => sum + Number(r.pendingAmount ?? r.total ?? 0), 0);

            const isExactMatchForChecked = Math.abs(totalSettleAmount - totalSelectedPending) < 0.01;
            let backendPaymentType = 'Partial';

            if (totalSettleAmount > totalOutstanding + 0.01) {
              backendPaymentType = 'Advance';
            } else if (Math.abs(totalSettleAmount - totalOutstanding) < 0.01 && allSelected) {
              backendPaymentType = 'Full';
            } else if (isExactMatchForChecked && !allSelected) {
              backendPaymentType = 'Monthwise';
            } else {
              backendPaymentType = 'Partial';
            }

            const allocations = Array.from(selectedIds).map(id => ({
              monthWiseDemandId: Number(id),
              payAmount: selectAmounts[id] ?? 0
            }));

            const cleanMobile = (record.tenantMobile || '').replace(/\D/g, '');
            const validMobile = cleanMobile.length === 10 ? cleanMobile : undefined;

            const rawEmail = record.tenantEmail?.trim();
            const validEmail = (rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail))
              ? rawEmail
              : undefined;

            const result = await processMakePaymentAction(recordId, {
              paymentType: backendPaymentType,
              paymentMode: modeMap[paymentMode],
              paymentDate: new Date().toISOString(),
              payerMobile: validMobile,
              payerEmail: validEmail,
              bankName: requiresBankDetails ? bankName.trim() || undefined : undefined,
              branchName: undefined,
              chequeOrTransactionNo: isCash ? undefined : referenceNo.trim() || undefined,
              chequeDate: requiresBankDetails && chequeDate ? new Date(chequeDate).toISOString() : undefined,
              ddPayeeName: isDD ? ddPayeeName.trim() || undefined : undefined,
              paymentStatus: 'Pending',
              discountAmount: 0,
              adjustmentAmount: -effectiveAdvanceApplied,
              paidAmount: effectiveAmount,
              remark: remarks.trim() || undefined,
              customAmount: backendPaymentType === 'Partial' ? totalSettleAmount : 0,
              allocations,
            });

            if (!result.success) {
              toast.error(result.message);
              return;
            }

            toast.success('Payment accepted & receipt generated successfully!');

            const rawRes = result.data as Record<string, unknown> | undefined;
            const itemsObj = (rawRes?.items as Record<string, unknown>) || rawRes;
            const uuid = (itemsObj?.uuid as string) || (rawRes?.uuid as string);
            const transactionId = (itemsObj?.transactionId as number) || (rawRes?.transactionId as number);

            const receiptId = uuid || transactionId;
            if (receiptId) {
              const printUrl = `/${pathname.split('/')[1]}/assets/revenue/payment/receipt?id=${receiptId}`;
              router.push(printUrl);
            }

            router.refresh();
            await refetchDemands();
            handleReset();
          } catch {
            toast.error('An unexpected error occurred. Please try again.');
          } finally {
            setIsSubmitLocked(false);
          }
        });
      },
    });
  }, [
    isSubmitLocked, isPending, paymentMode, effectiveAmount, referenceNo, bankName, chequeDate,
    paymentType, totalSettleAmount, totalOutstanding, confirm, rawDemands, selectedIds,
    allSelected, selectAmounts, recordId, record.tenantMobile, record.assetName, record.assetNo, record.shopName, record.tenantEmail, remarks, effectiveAdvanceApplied,
    pathname, router, refetchDemands, handleReset, ddPayeeName,
  ]);

  return {
    isPending,
    isSubmitLocked,
    paymentMode,
    setPaymentMode,
    paymentType,
    setPaymentType,
    amountReceived,
    setAmountReceived,
    advanceAppliedStr,
    setAdvanceAppliedStr,
    referenceNo,
    setReferenceNo,
    bankName,
    setBankName,
    chequeDate,
    setChequeDate,
    remarks,
    setRemarks,
    ddPayeeName,
    setDdPayeeName,
    handleAmountReceivedChange,
    handleAdvanceAppliedChange,
    handlePaymentTypeChange,
    handleReset,
    handleAcceptPayment,
    startTransition,
    effectiveAmount,
    effectiveAdvanceApplied,
    totalSettleAmount,
  };
}
