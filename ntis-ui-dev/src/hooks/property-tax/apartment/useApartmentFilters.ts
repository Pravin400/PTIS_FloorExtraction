/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchWingWiseFilters } from '@/types/property-tax/apartment';

export interface PtisPaginationInfo {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function useApartmentFilters(
  initialPropertyId: number | null = null,
  initialWingId: number | null = null,
  initialWingDetailId: number | null = null
) {
  const searchParams = useSearchParams();
  const urlPropertyId = searchParams?.get('propertyId') ? Number(searchParams.get('propertyId')) : null;
  const urlWingDetailId = searchParams?.get('wingDetailId') ? Number(searchParams.get('wingDetailId')) : null;
  const urlWingId = searchParams?.get('wingId') ? Number(searchParams.get('wingId')) : null;
  const rawSocietyId = searchParams?.get('societyId') || searchParams?.get('societyDetailId');
  const urlSocietyId = rawSocietyId ? Number(rawSocietyId) : null;
  const urlWingName = searchParams?.get('wingName') || null;

  const [filters, setFilters] = React.useState<SearchWingWiseFilters>({
    propertyId: urlPropertyId || initialPropertyId,
    wingId: urlWingId || initialWingId,
    wingDetailId: urlWingDetailId || initialWingDetailId,
    societyId: urlSocietyId,
    wingName: urlWingName,
    floor: null,
    searchTerm: '',
    pageNumber: 1,
    pageSize: 100,
  });

  const [paginationInfo, setPaginationInfo] = React.useState<PtisPaginationInfo>({
    totalCount: 0,
    pageNumber: 1,
    pageSize: 100,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  });

  React.useEffect(() => {
    const activePropertyId = urlPropertyId || initialPropertyId;
    const activeWingDetailId = urlWingDetailId || initialWingDetailId;
    const activeWingId = urlWingId || initialWingId;
    const activeSocietyId = urlSocietyId;
    const activeWingName = urlWingName;

    setFilters((prev) => {
      if (
        prev.propertyId === activePropertyId &&
        prev.wingId === activeWingId &&
        prev.wingDetailId === activeWingDetailId &&
        prev.societyId === activeSocietyId &&
        prev.wingName === activeWingName
      ) {
        return prev;
      }
      return {
        ...prev,
        propertyId: activePropertyId,
        wingId: activeWingId,
        wingDetailId: activeWingDetailId,
        societyId: activeSocietyId,
        wingName: activeWingName,
      };
    });
  }, [urlPropertyId, initialPropertyId, urlWingDetailId, initialWingDetailId, urlWingId, initialWingId, urlSocietyId, urlWingName]);

  return {
    filters,
    setFilters,
    paginationInfo,
    setPaginationInfo,
  };
}
