'use client';

import { useMemo } from 'react';
import { Merge } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/common/Drawer';
import { type SearchSelectOption } from '@/components/common/SearchSelect';
import { CancelButton, AddButton } from '@/components/common/ActionButtons';
import { CombinePropertyItem, PropertyCombineDetails } from '@/types/combine-property.types';
import { useCombinePropertyForm } from '@/hooks/combineProperty/useCombineProperty';
import { compareSubProperty } from '@/hooks/combineProperty/useCombinePropertyFilters';
import { getCombinePropertyColumns, getCombinePropertyHistoryColumns, PropertyRow } from './combinePropertyColumns';
import { MasterTable } from '@/components/common/MasterTable';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PropertyType } from '@/types/property-type.types';
import { PagedResponse } from '@/types/common.types';
import { CombinePropertyHistoryDetails } from './CombinePropertyHistoryDetails';
import { CombinePropertyFilterBar } from './CombinePropertyFilterBar';
import { CombinePropertyReviewSection } from './CombinePropertyReviewSection';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type HistoryRow = PropertyCombineDetails & Record<string, unknown>;

interface CombinePropertyFormProps {
  basePropertyList: CombinePropertyItem[];
  subPropertyList: CombinePropertyItem[];
  propertyTypeList: PropertyType[];
  selectedBasePropertyId?: string;
  selectedWardId?: string;
  selectedWardNo?: string;
  selectedPropertyNo?: string;
  showHistory?: boolean;
  historyData?: PagedResponse<PropertyCombineDetails>;
  historyDetailsData?: PagedResponse<PropertyCombineDetails>;
  initialReviewData?: PropertyCombineDetails[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function toSelectOption(item: CombinePropertyItem): SearchSelectOption {
  let label = item.propertyNo;
  if (item.fromProperty) {
    label += `-${item.fromProperty}`;
    if (item.toProperty && item.toProperty !== item.fromProperty) {
      label += ` – ${item.toProperty}`;
    }
  } else if (item.toProperty) {
    label += `-${item.toProperty}`;
  }
  return { label, value: String(item.id) };
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function CombinePropertyForm(props: CombinePropertyFormProps) {
  const {
    basePropertyList,
    subPropertyList,
    propertyTypeList,
    selectedBasePropertyId,
    selectedWardId,
    selectedWardNo,
    selectedPropertyNo,
    showHistory,
    historyData,
    historyDetailsData,
    initialReviewData,
  } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('combineProperty');
  const wardLabel = useAliasLabel('Ward', t('aliasFallback.ward'));
  const propertyNoLabel = useAliasLabel('Property_No', t('aliasFallback.propertyNo'));

  const {
    reviewData,
    isReviewing,
    isPending,
    isSubmitting,
    rangeFrom,
    rangeTo,
    selectedProperties,
    selectionMethod,
    selectedCount,
    canProceed,
    checkedPropertyIds,
    checkedCount,
    hasDifferentOwners,
    differentOwnerProps,
    remark,
    remarkError,
    selectedPropertyType,
    showPropertyTypeDropdown,
    setSelectedPropertyType,
    setRemark,
    togglePropertyCheck,
    toggleAllProperties,
    handleBasePropertyChange,
    handleMethodChange,
    handleRangeFromChange,
    handleRangeToChange,
    handleIndividualChange,
    handleClear,
    handleProceed,
    handleCombine,
  } = useCombinePropertyForm({
    basePropertyList,
    subPropertyList,
    selectedBasePropertyId,
    selectedWardId,
    selectedPropertyNo,
    initialReviewData,
    t,
    propertyNoLabel,
  });

  /* ---- Table Columns (Memoized) ---- */
  const columns = useMemo(
    () => getCombinePropertyColumns(
      t,
      reviewData,
      checkedPropertyIds,
      togglePropertyCheck,
      toggleAllProperties,
      selectedBasePropertyId,
      { propertyNo: propertyNoLabel }
    ),
    [reviewData, t, checkedPropertyIds, togglePropertyCheck, toggleAllProperties, selectedBasePropertyId, propertyNoLabel]
  );

  const handleShowHistory = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (showHistory) {
      params.set('showHistory', 'false');
    } else {
      params.delete('showHistory');
    }
    router.push(`?${params.toString()}`);
  };

  const historyColumns = useMemo(() => getCombinePropertyHistoryColumns(
    t as unknown as (key: string) => string,
    (row) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('detailsPropertyId', String(row.propertyId));
      params.set('detailsPage', '1');
      params.set('detailsSize', '10');
      router.push(`${pathname}?${params.toString()}`);
    },
    { propertyNo: propertyNoLabel }
  ), [t, router, pathname, searchParams, propertyNoLabel]);

  const handleHistoryTableChange = (page: number, pageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('historyPage', String(page));
    params.set('historySize', String(pageSize));
    router.push(`${pathname}?${params.toString()}`);
  };

  /* ---- Options ---- */
  const BASE_PROPERTY_OPTIONS = useMemo<SearchSelectOption[]>(() => {
    return (basePropertyList || []).map((item) => ({
      // label: `${item.wardNo || ''}`,
      label: `${item.wardNo || ''} - ${item.propertyNo || ''}${item.fromProperty ? ' - ' + item.fromProperty : ''}`,
      value: String(item.id || ''),
      meta: { wardId: item.wardId, wardNo: item.wardNo, propertyNo: item.propertyNo },
    }));
  }, [basePropertyList]);

  const SUB_PROPERTY_OPTIONS = useMemo<SearchSelectOption[]>(() => {
    const sortedList = [...(subPropertyList || [])].sort(compareSubProperty);
    return sortedList.map(toSelectOption);
  }, [subPropertyList]);

  const PROPERTY_TYPE_OPTIONS = useMemo<SearchSelectOption[]>(() => {
    return (propertyTypeList || []).map((item) => ({
      label: item.propertyDescription,
      value: String(item.id),
    }));
  }, [propertyTypeList]);

  /* ============================================================
     DRAWER HEADER
  ============================================================ */
  const DrawerTitle = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-sm">
        <Merge className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h2 id="drawer-title" className="text-sm font-bold text-gray-900 leading-tight">
            {t('title')}
          </h2>
          {selectedWardNo && (
            <StatusBadge variant="info" label={`${wardLabel}: ${selectedWardNo}`} className="px-2 py-0.5 text-[10px] rounded-full shadow-none" />
          )}
          {selectedPropertyNo && (
            <StatusBadge variant="info" label={`${propertyNoLabel}: ${selectedPropertyNo}`} className="px-2 py-0.5 text-[10px] rounded-full shadow-none" />
          )}
        </div>
        <p className="text-[11px] text-gray-500 leading-tight">
          {t('subtitle')}
        </p>
      </div>
    </div>
  );

  /* ============================================================
     DRAWER FOOTER
  ============================================================ */
  const DrawerFooter = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {/* Status messages handled by toast */}
      </div>
      <div className="flex items-center gap-2">
        <CancelButton label={`${t('clear')}`} onClick={handleClear} size="sm" />
        {isReviewing && reviewData.length > 0 && (
          <AddButton
            label={isSubmitting ? t('combining') : t('combine')}
            size="sm"
            disabled={isSubmitting || checkedCount <= 1}
            onClick={handleCombine}
          />
        )}
      </div>
    </div>
  );

  /* ============================================================
     RENDER
  ============================================================ */
  const handleClose = () => {
    const params = new URLSearchParams();
    if (selectedWardNo) params.set('wardNo', selectedWardNo);
    if (selectedWardId) params.set('wardId', selectedWardId);
    if (selectedPropertyNo) params.set('propertyNo', selectedPropertyNo);
    if (selectedBasePropertyId) params.set('propertyId', selectedBasePropertyId);

    const partitionNo = searchParams.get('partitionNo');
    if (partitionNo) params.set('partitionNo', partitionNo);

    const qs = params.toString();
    const locale = pathname.split('/')[1] || 'en';
    const target = qs ? `/${locale}/property-tax/ptis?${qs}` : `/${locale}/property-tax/ptis`;
    router.push(target);
  };

  return (
    <Drawer
      open={true}
      onClose={handleClose}
      title={DrawerTitle}
      width="xl"
      footer={DrawerFooter}
    >
      <CombinePropertyFilterBar
        t={t as unknown as (key: string, values?: Record<string, string | number>) => string}
        basePropertyOptions={BASE_PROPERTY_OPTIONS}
        subPropertyOptions={SUB_PROPERTY_OPTIONS}
        propertyTypeOptions={PROPERTY_TYPE_OPTIONS}
        selectedBasePropertyId={selectedBasePropertyId}
        selectionMethod={selectionMethod}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        selectedProperties={selectedProperties}
        selectedPropertyType={selectedPropertyType}
        showPropertyTypeDropdown={showPropertyTypeDropdown}
        selectedCount={selectedCount}
        canProceed={canProceed}
        isPending={isPending}
        handleBasePropertyChange={handleBasePropertyChange}
        handleMethodChange={handleMethodChange}
        handleRangeFromChange={handleRangeFromChange}
        handleRangeToChange={handleRangeToChange}
        handleIndividualChange={handleIndividualChange}
        setSelectedPropertyType={setSelectedPropertyType}
        handleClear={handleClear}
        handleProceed={() => {
          if (showHistory) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('showHistory', 'false');
            router.push(`?${params.toString()}`);
          }
          handleProceed();
        }}
        onShowHistory={handleShowHistory}
        showHistory={!!showHistory}
      />

      {showHistory ? (
        <div className="px-4 py-4 flex flex-col gap-4">
          {(!historyData?.items || historyData.items.length === 0) ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-gray-500 font-medium">{t('noCombinePropertyHistoryFound')}</p>
            </div>
          ) : (
            <MasterTable<HistoryRow>
              columns={historyColumns}
              data={(historyData?.items || []) as HistoryRow[]}
              paginationConfig={{
                enabled: true,
                showPageSizeSelector: true,
              }}
              pageNumber={historyData?.pageNumber || 1}
              pageSize={historyData?.pageSize || 10}
              totalCount={historyData?.totalCount || 0}
              totalPages={historyData?.totalPages || 0}
              onPageChange={(page) => handleHistoryTableChange(page, historyData?.pageSize || 10)}
              onPageSizeChange={(size) => handleHistoryTableChange(historyData?.pageNumber || 1, size)}
              height="md"
              getRowKey={(row, i) => `history-${row.propertyId || 0}-${i}`}
              emptyText={t('emptyTableText')}
            />
          )}
        </div>
      ) : (
        <CombinePropertyReviewSection
          t={t as unknown as (key: string, values?: Record<string, string | number>) => string}
          isReviewing={isReviewing}
          isPending={isPending}
          isSubmitting={isSubmitting}
          selectedBasePropertyId={selectedBasePropertyId}
          selectedPropertyNo={selectedPropertyNo}
          reviewDataLength={reviewData.length}
          checkedCount={checkedCount}
          hasDifferentOwners={hasDifferentOwners}
          differentOwnerProps={differentOwnerProps}
          columns={columns}
          reviewData={reviewData as PropertyRow[]}
          remark={remark}
          remarkError={remarkError}
          setRemark={setRemark}
        />
      )}

      {searchParams.has('detailsPropertyId') && historyDetailsData && (
        <CombinePropertyHistoryDetails historyDetails={historyDetailsData} />
      )}
    </Drawer>
  );
}