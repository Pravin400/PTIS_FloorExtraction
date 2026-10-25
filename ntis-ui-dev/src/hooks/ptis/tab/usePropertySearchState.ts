import { useCallback, useMemo, useState } from 'react';

import type { PropertySearchParams } from '@/types/ptis.types';

export interface PropertySearchState {
  wardNo: string;
  wardId: number | null;
  propertyNo: string;
  partitionNo: string;
  propertyId: string | null;
  category?: number;
  categoryLabel?: string;
  societyDetailId?: number | null;
  wingDetailId?: number | null;
}

export function usePropertySearchState(urlState: PropertySearchState) {
  const currentUrlKey = useMemo(() => JSON.stringify(urlState), [urlState]);

  const [draft, setDraft] = useState<PropertySearchState>(urlState);
  const [prevUrlKey, setPrevUrlKey] = useState(currentUrlKey);

  if (currentUrlKey !== prevUrlKey) {
    setPrevUrlKey(currentUrlKey);
    setDraft(urlState);
  }

  const setWardNo = useCallback((val: string) => {
    setDraft((prev) => ({ ...prev, wardNo: val }));
  }, []);

  const setWardId = useCallback((val: number | null) => {
    setDraft((prev) => ({ ...prev, wardId: val }));
  }, []);

  const setPropertyNo = useCallback((val: string) => {
    setDraft((prev) => ({ ...prev, propertyNo: val }));
  }, []);

  const setPartitionNo = useCallback((val: string) => {
    setDraft((prev) => ({ ...prev, partitionNo: val }));
  }, []);

  const setPropertyId = useCallback((val: string | null) => {
    setDraft((prev) => ({ ...prev, propertyId: val }));
  }, []);

  const setCategory = useCallback((cat?: number, label?: string) => {
    setDraft((prev) => ({ ...prev, category: cat, categoryLabel: label }));
  }, []);

  const setExtraIds = useCallback((societyDetailId?: number | null, wingDetailId?: number | null) => {
    setDraft((prev) => ({ ...prev, societyDetailId, wingDetailId }));
  }, []);

  const handleWardSelection = useCallback((id: number | null, no: string) => {
    setDraft({
      wardId: id,
      wardNo: no,
      propertyNo: '',
      partitionNo: '',
      propertyId: null,
      category: undefined,
      categoryLabel: undefined,
      societyDetailId: undefined,
      wingDetailId: undefined,
    });
  }, []);

  const getSearchParams = useCallback((): PropertySearchParams => {
    return {
      wardNo: draft.wardNo || undefined,
      wardId: draft.wardId || undefined,
      propertyNo: draft.propertyNo || undefined,
      partitionNo: draft.partitionNo || undefined,
      propertyId: draft.propertyId || undefined,
    };
  }, [draft]);

  return {
    draft,
    setWardNo,
    setWardId,
    setPropertyNo,
    setPartitionNo,
    setPropertyId,
    setCategory,
    setExtraIds,
    handleWardSelection,
    getSearchParams,
  };
}
