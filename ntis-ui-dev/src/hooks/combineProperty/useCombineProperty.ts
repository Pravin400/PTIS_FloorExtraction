import { useMemo } from 'react';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { CombinePropertyItem, PropertyCombineDetails } from '@/types/combine-property.types';
import { useCombinePropertyFilters } from './useCombinePropertyFilters';
import { useCombinePropertyState } from './useCombinePropertyState';
import { useCombinePropertySubmit } from './useCombinePropertySubmit';

export type SelectionMethod = 'range' | 'individual';

export interface UseCombinePropertyParams {
  basePropertyList: CombinePropertyItem[];
  subPropertyList: CombinePropertyItem[];
  selectedBasePropertyId?: string;
  selectedWardId?: string;
  selectedPropertyNo?: string;
  initialReviewData?: PropertyCombineDetails[];
  t: (key: string, values?: Record<string, string | number>) => string;
  propertyNoLabel?: string;
}

export function useCombinePropertyForm({
  basePropertyList,
  subPropertyList,
  selectedBasePropertyId,
  selectedWardId,
  selectedPropertyNo,
  initialReviewData = [],
  t,
  propertyNoLabel,
}: UseCombinePropertyParams) {
  const { confirm } = useConfirm();

  // 1. State Hook
  const state = useCombinePropertyState({ selectedBasePropertyId, initialReviewData, t, propertyNoLabel });

  // 2. Filters Hook
  const filters = useCombinePropertyFilters(
    basePropertyList,
    subPropertyList,
    t,
    state.clearState
  );

  const basePartitionNo = useMemo(() => {
    if (!selectedBasePropertyId) return '';
    const prop = basePropertyList.find(p => String(p.id) === selectedBasePropertyId);
    return prop?.fromProperty || '';
  }, [basePropertyList, selectedBasePropertyId]);

  // 3. Submit Hook
  const submit = useCombinePropertySubmit({
    selectedWardId,
    selectedPropertyNo,
    selectedBasePropertyId,
    basePartitionNo,
    submitPropertyNos: filters.computedPropertyNos || undefined,
    partitionNo: filters.computedCombinePartitionNo || '',
    checkedProperties: state.checkedReviewData,
    selectedPropertyType: state.selectedPropertyType,
    remark: state.remark,
    t,
    propertyNoLabel,
    setReviewData: state.setReviewData,
    setCheckedPropertyIds: state.setCheckedPropertyIds,
    setIsReviewing: state.setIsReviewing,
    setShowPropertyTypeDropdown: state.setShowPropertyTypeDropdown,
    setRemarkError: state.setRemarkError,
    handleClear: () => {
      state.clearState();
      filters.clearFilters();
    },
    router: filters.router,
    confirm
  });

  const canProceed =
    !!selectedBasePropertyId &&
    (filters.selectionMethod === 'range'
      ? !!(filters.rangeFrom && filters.rangeTo) && !filters.isRangeInvalid
      : filters.selectedProperties.length > 0);

  return {
    ...state,
    ...filters,
    ...submit,
    canProceed,
    setRemark: state.handleRemarkChange,
    handleClear: () => {
      state.clearState();
      filters.clearFilters();
    }
  };
}

