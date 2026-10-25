import {
  Banknote,
  Landmark,
  Receipt,
  Printer,
  ArrowLeftRight,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LeaseRentPaymentDetail, PaymentModeKey, PaymentType } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { fmt } from '@/lib/utils/asset-utils/payment-utils/payment-format';
import { POSITIVE_DECIMAL_INVALID_KEYS, NAME_ONLY_SANITIZE } from '@/lib/utils/asset-validation-rules';
import { Card, Input, Button, Label } from '@/components/common';

interface PaymentInformationSectionProps {
  record: LeaseRentPaymentDetail;
  paymentMode: PaymentModeKey;
  setPaymentMode: (mode: PaymentModeKey) => void;
  paymentType: PaymentType;
  handlePaymentTypeChange: (type: PaymentType) => void;
  totalOutstanding: number;
  amountReceived: string;
  handleAmountReceivedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  advanceAppliedStr: string;
  handleAdvanceAppliedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  referenceNo: string;
  setReferenceNo: (val: string) => void;
  bankName: string;
  setBankName: (val: string) => void;
  chequeDate: string;
  setChequeDate: (val: string) => void;
  ddPayeeName: string;
  setDdPayeeName: (val: string) => void;
  handleAcceptPayment: () => void;
  isPending: boolean;
  isSubmitLocked: boolean;
  hasSearched: boolean;
}

export function PaymentInformationSection({
  record,
  paymentMode,
  setPaymentMode,
  paymentType,
  handlePaymentTypeChange,
  totalOutstanding,
  amountReceived,
  handleAmountReceivedChange,
  advanceAppliedStr,
  handleAdvanceAppliedChange,
  referenceNo,
  setReferenceNo,
  bankName,
  setBankName,
  chequeDate,
  setChequeDate,
  ddPayeeName,
  setDdPayeeName,
  handleAcceptPayment,
  isPending,
  isSubmitLocked,
  hasSearched,
}: PaymentInformationSectionProps) {
  const t = useTranslations('AssetPayment');

  const modeButtons: { id: PaymentModeKey; icon: React.ReactNode; label: string }[] = [
    { id: 'Cash', icon: <Banknote className="w-4 h-4 text-green-600" />, label: t('otherPayment.modes.cash') },
    { id: 'DD', icon: <Landmark className="w-4 h-4 text-indigo-600" />, label: t('otherPayment.modes.dd') },
    { id: 'Cheque', icon: <Receipt className="w-4 h-4 text-teal-600" />, label: t('otherPayment.modes.cheque') },
    { id: 'NEFT', icon: <ArrowLeftRight className="w-4 h-4 text-purple-600" />, label: t('otherPayment.modes.neft') },
    { id: 'RTGS', icon: <Zap className="w-4 h-4 text-orange-600" />, label: t('otherPayment.modes.rtgs') },
  ];

  const paymentTypesArr: { id: PaymentType; title: string; desc: string }[] = [
    { id: 'Full', title: t('v2.fullPayment'), desc: t('v2.payTotalDemand') },
    { id: 'Part', title: t('v2.partPayment'), desc: t('v2.payPartialAmount') },
    { id: 'Advance', title: t('v2.advancePayment'), desc: t('v2.payAdvanceForFuture') },
  ];

  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const maxDate = formatLocalDate(today);

  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() - 90);
  const minDate = formatLocalDate(minDateObj);

  return (
    <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-2.5 sm:p-4 space-y-3.5 sm:space-y-4">
      <h2 className="text-[16px] sm:text-[16px] font-bold text-[#101b87]">{t('v2.paymentInformation')}</h2>

      {/* Payment Mode */}
      <div>
        <Label required className="text-[11.5px] sm:text-[12px] font-bold text-[#1e3a8a] mb-2">
          {t('v2.paymentMode')}
        </Label>
        {/* mode buttons grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2">
          {modeButtons.map((m) => {
            const active = paymentMode === m.id;
            return (
              <Button
                key={m.id}
                type="button"
                variant="ghost"
                onClick={() => setPaymentMode(m.id)}
                className={`flex flex-col sm:flex-col items-center justify-center gap-1 sm:gap-1.5 h-12 sm:h-13 py-1.5 px-2 rounded-md border transition-all ${active
                  ? 'bg-[#eff6ff] border-blue-600 text-blue-700 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-[#1e3a8a] hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-center flex-shrink-0">
                  {m.icon}
                </div>
                <span className="text-[11px] sm:text-[11.5px] font-bold leading-tight truncate">
                  {m.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Payment Type */}
      <div>
        <Label required className="text-[11.5px] sm:text-[12px] font-bold text-[#1e3a8a] mb-2">
          {t('v2.paymentType')}
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {paymentTypesArr.map((pt) => {
            const active = paymentType === pt.id;
            const disabled = (pt.id === 'Full' || pt.id === 'Part') && totalOutstanding === 0;
            return (
              <Button
                key={pt.id}
                type="button"
                variant="ghost"
                onClick={() => handlePaymentTypeChange(pt.id)}
                disabled={disabled}
                className={`flex flex-col items-start p-2 sm:p-2.5 rounded-md border text-left transition-all h-auto w-full font-normal ${disabled
                  ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                  : active
                    ? 'border-blue-300 bg-[#eff6ff] shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className={`flex items-center gap-1.5 mb-1 sm:mb-1.5 w-full ${disabled ? 'opacity-50' : ''}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${active ? 'border-blue-600' : 'border-slate-300'
                    }`}>
                    {active && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <span className={`text-[10px] sm:text-[10.5px] font-bold leading-tight ${active ? 'text-blue-700' : 'text-[#1e3a8a]'}`}>
                    {pt.title}
                  </span>
                </div>
                <span className={`text-[9px] leading-tight ${active ? 'text-blue-600' : 'text-slate-500'}`}>
                  {pt.desc}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-3 items-end">
        {/* Amount Received */}
        <div>
          <Label required className="text-[10px] sm:text-[10.5px] font-bold text-[#1e3a8a] mb-1">
            {`${t('v2.amountReceived')} (₹)`}
          </Label>
          <Input
            naked
            type="text"
            value={amountReceived}
            onChange={handleAmountReceivedChange}
            onKeyDown={(e) => POSITIVE_DECIMAL_INVALID_KEYS.test(e.key) && e.preventDefault()}
            readOnly={paymentType === 'Full'}
            className="w-full h-8.5 sm:h-8 px-3 text-[11px] sm:text-[11.5px] font-bold border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-[#1e3a8a] read-only:bg-slate-50"
          />
        </div>

        {/* Advance Applied */}
        <div>
          <div className="flex flex-row sm:flex-col justify-between sm:justify-start mb-1 leading-tight">
            <Label className="text-[10px] sm:text-[10.5px] font-bold text-[#1e3a8a]">
              <span className="whitespace-nowrap">{`${t('v2.applyAdvance')} (₹)`}</span>
            </Label>
            <span className="font-normal text-emerald-600 text-[9px]">{t('v2.max')}: {fmt(record.advanceBalance || 0)}</span>
          </div>
          <Input
            naked
            type="text"
            value={advanceAppliedStr}
            onChange={handleAdvanceAppliedChange}
            onKeyDown={(e) => POSITIVE_DECIMAL_INVALID_KEYS.test(e.key) && e.preventDefault()}
            disabled={(record.advanceBalance || 0) <= 0 || paymentType === 'Full'}
            placeholder="0.00"
            className="w-full h-8.5 sm:h-8 px-3 text-[11px] sm:text-[11.5px] font-bold border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500 bg-white text-emerald-700 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        {/* Reference No. / Cheque No / DD No / Transaction ID */}
        <div>
          <Label required={paymentMode !== 'Cash'} className="text-[10px] sm:text-[10.5px] font-bold text-[#1e3a8a] mb-1">
            {paymentMode === 'Cheque' ? t('v2.chequeNumber') : paymentMode === 'DD' ? t('v2.ddNumber') : paymentMode === 'Cash' ? t('v2.referenceNo') : t('v2.transactionId')}
          </Label>
          <Input
            naked
            type="text"
            value={paymentMode === 'Cash' ? '' : referenceNo}
            onChange={(e) => {
              if (paymentMode === 'Cheque' || paymentMode === 'DD') {
                setReferenceNo(e.target.value.replace(/\D/g, ''));
              } else {
                setReferenceNo(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if ((paymentMode === 'Cheque' || paymentMode === 'DD') && POSITIVE_DECIMAL_INVALID_KEYS.test(e.key)) {
                e.preventDefault();
              }
            }}
            disabled={paymentMode === 'Cash'}
            placeholder={paymentMode === 'Cheque' ? t('v2.enterChequeNo') : paymentMode === 'DD' ? t('v2.enterDdNo') : paymentMode === 'Cash' ? t('v2.naForCash') : t('v2.enterTransactionId')}
            className="w-full h-8.5 sm:h-8 px-3 text-[10.5px] sm:text-[10px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white placeholder:text-[#1e3a8a]/40 text-[#1e3a8a] disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
          />
        </div>
      </div>

      {/* Additional Fields for Cheque/DD/NEFT/RTGS */}
      {(paymentMode === 'Cheque' || paymentMode === 'DD' || paymentMode === 'NEFT' || paymentMode === 'RTGS') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-3">
          <div>
            <Label required className="text-[10px] sm:text-[10.5px] font-bold text-[#1e3a8a] mb-1">
              {t('v2.bankName')}
            </Label>
            <Input
              naked
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value.replace(NAME_ONLY_SANITIZE, ''))}
              placeholder={t('v2.enterBankName')}
              className="w-full h-8.5 sm:h-8 px-3 text-[10.5px] sm:text-[10px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-[#ffffff] placeholder:text-[#1e3a8a]/40 text-[#1e3a8a]"
            />
          </div>
          <div>
            <Label required className="text-[10px] sm:text-[10.5px] font-bold text-[#1e3a8a] mb-1">
              {paymentMode === 'Cheque' ? t('v2.chequeDate') : paymentMode === 'DD' ? t('v2.ddDate') : t('v2.transactionDate')}
            </Label>
            <Input
              naked
              type="date"
              value={chequeDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setChequeDate(e.target.value)}
              className="w-full h-8.5 sm:h-8 px-3 text-[10.5px] sm:text-[10px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-[#1e3a8a]"
            />
          </div>
        </div>
      )}

      {/* DD Payee Name */}
      {paymentMode === 'DD' && (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 mb-3">
          <div>
            <Label required className="text-[10px] sm:text-[10.5px] font-bold text-[#1e3a8a] mb-1">
              {t('v2.ddPayeeName')}
            </Label>
            <Input
              naked
              type="text"
              value={ddPayeeName}
              onChange={(e) => setDdPayeeName(e.target.value.replace(NAME_ONLY_SANITIZE, ''))}
              placeholder={t('v2.enterDdPayeeName')}
              className="w-full h-8.5 sm:h-8 px-3 text-[10.5px] sm:text-[10px] border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white placeholder:text-[#1e3a8a]/40 text-[#1e3a8a]"
            />
          </div>
        </div>
      )}

      <div className="pt-2 pb-1 space-y-3">
        {/* Accept Payment */}
        <Button
          type="button"
          variant="primary"
          onClick={handleAcceptPayment}
          disabled={isPending || isSubmitLocked || !hasSearched}
          isLoading={isPending || isSubmitLocked}
          icon={Printer}
          className="w-full h-11 sm:h-10 text-[11.5px] sm:text-[11px] font-bold rounded-md flex items-center justify-center gap-2 tracking-wide cursor-pointer"
        >
          {t('v2.acceptPaymentBtn')}
        </Button>
      </div>
    </Card>
  );
}
