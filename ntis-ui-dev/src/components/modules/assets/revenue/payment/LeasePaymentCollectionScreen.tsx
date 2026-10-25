'use client';

import type { LeaseRentPaymentDetail, LeaseRentPaymentHistoryItem } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { useLeasePaymentState } from '@/hooks/asset/revenue/payment/useLeasePaymentState';
import { AssetSearchSection } from './AssetSearchSection';
import { AssetDetailsCardSection } from './AssetDetailsCardSection';
import { PendingDuesSection } from './PendingDuesSection';
import { DemandCollectionSummarySection } from './DemandCollectionSummarySection';
import { LeasePaymentHistorySection } from './LeasePaymentHistorySection';
import { DemandSummaryCardSection } from './DemandSummaryCardSection';
import { PaymentInformationSection } from './PaymentInformationSection';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface Props {
  record: LeaseRentPaymentDetail;
  historyItems: LeaseRentPaymentHistoryItem[];
  recordId: string;
  locale: string;
  notFound?: boolean;
}

export function LeasePaymentCollectionScreen({ record, historyItems, recordId, notFound }: Props) {

  useEffect(() => {
    if (notFound && recordId && recordId !== '0') {
      toast.error(`Payment record #${recordId} not found.`);
    }
  }, [notFound, recordId]);
  const {
    isPending,
    isSubmitLocked,
    router,
    searchValue,
    setSearchValue,
    hasSearched,
    setHasSearched,
    showSuggestions,
    setShowSuggestions,
    searchResults,
    isSearching,
    assetCategoryId,
    setAssetCategoryId,
    assetTypeId,
    setAssetTypeId,
    zoneId,
    setZoneId,
    wardId,
    setWardId,
    parentAssetId,
    setParentAssetId,
    assetId,
    setAssetId,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    expandedReceiptId,
    receiptDetailsCache,
    isReceiptLoadingMap,
    handleToggleReceiptDetails,
    demandSummary,
    rawDemands,
    demands,
    demandsLoading,
    totalPages,
    selectedIds,
    paymentMode,
    setPaymentMode,
    paymentType,
    amountReceived,
    advanceAppliedStr,
    referenceNo,
    setReferenceNo,
    bankName,
    setBankName,
    chequeDate,
    setChequeDate,
    ddPayeeName,
    setDdPayeeName,
    isPhotoModalOpen,
    setIsPhotoModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    totalOutstanding,
    overdueAmount,
    currentDueAmount,
    totalSettleAmount,
    handleAmountReceivedChange,
    handleAdvanceAppliedChange,
    handlePaymentTypeChange,
    allSelected,
    toggleRow,
    toggleAll,
    handleAcceptPayment,
    startTransition,
  } = useLeasePaymentState({ record, historyItems, recordId });

  return (
    <div className="min-h-full h-full bg-[#f8fafc] text-[#101b87] font-sans p-1 sm:p-3 lg:p-4 overflow-y-auto custom-scrollbar">
      <div className="w-full flex flex-col xl:flex-row gap-4 items-start">
        {/* ══════════════════ LEFT COLUMN (Full width on mobile/tablet, flexible on desktop) ══════════════════ */}
        <div className="w-full flex-1 min-w-0 flex flex-col gap-3 sm:gap-4">
          {/* 1. Search Asset */}
          <AssetSearchSection
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            setHasSearched={setHasSearched}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            isSearching={isSearching}
            searchResults={searchResults}
            router={router}
            startTransition={startTransition}
            assetCategoryId={assetCategoryId}
            setAssetCategoryId={setAssetCategoryId}
            assetTypeId={assetTypeId}
            setAssetTypeId={setAssetTypeId}
            zoneId={zoneId}
            setZoneId={setZoneId}
            wardId={wardId}
            setWardId={setWardId}
            parentAssetId={parentAssetId}
            setParentAssetId={setParentAssetId}
            assetId={assetId}
            setAssetId={setAssetId}
          />

          {/* 2. Asset Details Card */}
          <AssetDetailsCardSection
            record={record}
            hasSearched={hasSearched}
            isPhotoModalOpen={isPhotoModalOpen}
            setIsPhotoModalOpen={setIsPhotoModalOpen}
          />

          {/* 3. Pending Dues */}
          <PendingDuesSection
            hasSearched={hasSearched}
            totalOutstanding={totalOutstanding}
            demandsLoading={demandsLoading}
            demands={demands}
            rawDemands={rawDemands}
            selectedIds={selectedIds}
            allSelected={allSelected}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            setItemsPerPage={setItemsPerPage}
            toggleRow={toggleRow}
            toggleAll={toggleAll}
            paymentFrequency={record.paymentFrequency}
          />

          {/* 4. Demand Summary & Payment History (Responsive grid: 1 col on mobile/tablet, 2 cols on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-[460px_1fr] gap-4">
            <DemandCollectionSummarySection
              hasSearched={hasSearched}
              demandSummary={demandSummary}
            />

            <LeasePaymentHistorySection
              hasSearched={hasSearched}
              displayHistoryItems={historyItems}
              isHistoryModalOpen={isHistoryModalOpen}
              setIsHistoryModalOpen={setIsHistoryModalOpen}
              expandedReceiptId={expandedReceiptId}
              receiptDetailsCache={receiptDetailsCache}
              isReceiptLoadingMap={isReceiptLoadingMap}
              handleToggleReceiptDetails={handleToggleReceiptDetails}
            />
          </div>
        </div>

        {/* ══════════════════ RIGHT COLUMN (Full width on mobile/tablet, fixed-sidebar on desktop) ══════════════════ */}
        <div className="w-full xl:w-[420px] 2xl:w-[480px] xl:flex-shrink-0 flex flex-col gap-4">
          {/* 5. Demand Summary Card */}
          <DemandSummaryCardSection
            hasSearched={hasSearched}
            totalOutstanding={totalOutstanding}
            overdueAmount={overdueAmount}
            currentDueAmount={currentDueAmount}
            record={record}
            totalSettleAmount={totalSettleAmount}
          />

          {/* 6. Payment Information Form */}
          <PaymentInformationSection
            record={record}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            paymentType={paymentType}
            handlePaymentTypeChange={handlePaymentTypeChange}
            totalOutstanding={totalOutstanding}
            amountReceived={amountReceived}
            handleAmountReceivedChange={handleAmountReceivedChange}
            advanceAppliedStr={advanceAppliedStr}
            handleAdvanceAppliedChange={handleAdvanceAppliedChange}
            referenceNo={referenceNo}
            setReferenceNo={setReferenceNo}
            bankName={bankName}
            setBankName={setBankName}
            chequeDate={chequeDate}
            setChequeDate={setChequeDate}
            ddPayeeName={ddPayeeName}
            setDdPayeeName={setDdPayeeName}
            handleAcceptPayment={handleAcceptPayment}
            isPending={isPending}
            isSubmitLocked={isSubmitLocked}
            hasSearched={hasSearched}
          />
        </div>
      </div>
    </div>
  );
}
