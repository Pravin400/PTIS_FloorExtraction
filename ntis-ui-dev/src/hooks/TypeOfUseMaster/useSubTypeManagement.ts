import { useEffect, useMemo, useRef, useState } from 'react';
import type { UseSubType } from '@/types/typeOfUse.types';

interface UseSubTypeManagementParams {
  subTypes: UseSubType[];
  subTotalCount: number;
  subTotalPages: number;
  pageNumber: number;
  pageSize: number;
  urlQ: string;
  selectedTypeId: string;
  selectedGroupId: string | number;
  pushUrl: (params: {
    groupId?: string;
    typeId?: string;
    pn?: number;
    ps?: number;
    q?: string;
  }) => void;
}

export function useSubTypeManagement({
  subTypes,
  subTotalCount,
  subTotalPages,
  pageNumber,
  pageSize,
  urlQ,
  selectedTypeId,
  selectedGroupId,
  pushUrl,
}: UseSubTypeManagementParams) {
  const [subTypeSearch, setSubTypeSearch] = useState(urlQ);
  const [subLoading] = useState(false);
  const [loadingAll] = useState(false);

  const prevUrlQRef = useRef(urlQ);
  useEffect(() => {
    if (prevUrlQRef.current !== urlQ) {
      prevUrlQRef.current = urlQ;
      setSubTypeSearch(urlQ);
    }
  }, [urlQ]);

  const searchActive = subTypeSearch.trim().length > 0;

  const subPageSize = pageSize;

  const effectiveTotalCount = subTotalCount;
  const effectiveTotalPages = subTotalPages || 1;
  const effectivePageNumber = pageNumber;

  const subTypeTableRows = useMemo(() => {
    const startIndex = (effectivePageNumber - 1) * subPageSize;
    return (subTypes || []).map((s, idx) => ({
      ...s,
      srNo: startIndex + idx + 1,
    }));
  }, [subTypes, effectivePageNumber, subPageSize]);

  const changeSubPage = (p: number) => {
    const currentGroupApiId = String(selectedGroupId);

    pushUrl({
      groupId: currentGroupApiId,
      typeId: selectedTypeId,
      pn: p,
      ps: subPageSize,
      q: subTypeSearch,
    });
  };

  const changeSubPageSize = (size: number) => {
    const currentGroupApiId = String(selectedGroupId);

    pushUrl({
      groupId: currentGroupApiId,
      typeId: selectedTypeId,
      pn: 1,
      ps: size,
      q: subTypeSearch,
    });
  };

  const onSearchChange = (val: string) => {
    const currentGroupApiId = String(selectedGroupId);

    setSubTypeSearch(val);

    pushUrl({
      groupId: currentGroupApiId,
      typeId: selectedTypeId,
      pn: 1,
      ps: subPageSize,
      q: val.trim() || "",
    });
  };

  return {
    subTypeSearch,
    searchActive,
    subLoading,
    loadingAll,
    subPageSize,
    subPageNumber: effectivePageNumber,
    effectivePageNumber,
    effectiveTotalCount,
    effectiveTotalPages,
    subTypeTableRows,
    changeSubPage,
    changeSubPageSize,
    onSearchChange,
  };
}
