/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React from 'react';
import {
  AssessmentUnit,
  UnitDifference,
  SearchWingWiseFilters,
  WingWisePaginationContainerDto,
  TaxHeadAmountItem,
} from '@/types/property-tax/apartment';
import {
  fetchApartmentDetailsWingWiseAction,
} from '@/app/[locale]/property-tax/ptis/apartment/action';
import { matchesFloor } from '@/lib/utils/ptis-floor.utils';
import { extractArrayFromPayload, parseApartmentItemNodes } from './apartment-mappers';
import { PtisPaginationInfo } from './useApartmentFilters';

export function useApartmentData(
  filters: SearchWingWiseFilters,
  paginationInfo: PtisPaginationInfo,
  setPaginationInfo: React.Dispatch<React.SetStateAction<PtisPaginationInfo>>
) {
  const [previousUnits, setPreviousUnits] = React.useState<AssessmentUnit[]>([]);
  const [surveyUnits, setSurveyUnits] = React.useState<AssessmentUnit[]>([]);
  const [apiDifferences, setApiDifferences] = React.useState<UnitDifference[]>([]);
  const [rvTaxAmounts] = React.useState<TaxHeadAmountItem[]>([]);
  const [cvTaxAmounts] = React.useState<TaxHeadAmountItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(() => Boolean(filters.propertyId || filters.wingDetailId));
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const isLoadingMoreRef = React.useRef(false);
  const lastFetchedKeyRef = React.useRef<string>('');
  const requestIdRef = React.useRef<number>(0);
  const filtersRef = React.useRef(filters);
  React.useEffect(() => {
    filtersRef.current = filters;
  });
  const [apiError, setApiError] = React.useState<string | null>(null);

  const fetchWingWiseData = React.useCallback(async (customFilters?: SearchWingWiseFilters, isAppend = false) => {
    const activeFilters = customFilters || filtersRef.current;
    if (!activeFilters.propertyId && !activeFilters.wingDetailId && !activeFilters.wingId) {
      if (!isAppend) {
        setSurveyUnits([]); setPreviousUnits([]); setApiDifferences([]);
        setIsLoading(false);
      }
      return;
    }
    const filterKey = `${activeFilters.propertyId}_${activeFilters.wingDetailId}_${activeFilters.wingId}_${activeFilters.pageNumber}_${activeFilters.pageSize}_${activeFilters.sortBy ?? ""}_${activeFilters.sortOrder ?? ""}`;
    if (!isAppend && lastFetchedKeyRef.current === filterKey) {
      return;
    }
    lastFetchedKeyRef.current = filterKey;

    const currentRequestId = ++requestIdRef.current;

    if (!isAppend) setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetchApartmentDetailsWingWiseAction(activeFilters);

      // Discard response if a newer request has been triggered in the meantime
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!res || !res.success) {
        if (!isAppend) {
          setSurveyUnits([]); setPreviousUnits([]); setApiDifferences([]);
        }
        setApiError(res?.message || 'Failed to connect to API backend.');
        return;
      }

      const rawContainer = res.items || res.data;
      if (rawContainer && typeof rawContainer === 'object' && 'totalCount' in rawContainer) {
        const container = rawContainer as WingWisePaginationContainerDto;
        const totalCount = container.totalCount || 0;
        const pageSize = container.pageSize || activeFilters.pageSize || 100;
        const totalPages = container.totalPages || Math.ceil(totalCount / pageSize) || 1;
        const pageNumber = container.pageNumber || activeFilters.pageNumber || 1;
        setPaginationInfo({
          totalCount, pageNumber, pageSize, totalPages,
          hasPrevious: pageNumber > 1,
          hasNext: container.hasNext !== undefined ? !!container.hasNext : pageNumber < totalPages,
        });
      }

      const itemList = extractArrayFromPayload(res.data ?? res);
      if (itemList.length > 0) {
        const defaultPropId = activeFilters.propertyId ? Number(activeFilters.propertyId) : null;
        const { newUnits, oldUnits, mappedDiffs } = parseApartmentItemNodes(itemList, defaultPropId);
        if (isAppend) {
          setSurveyUnits((prev) => [...prev, ...newUnits]);
          setPreviousUnits((prev) => [...prev, ...oldUnits]);
          setApiDifferences((prev) => [...prev, ...mappedDiffs]);
        } else {
          setSurveyUnits(newUnits); setPreviousUnits(oldUnits); setApiDifferences(mappedDiffs);
        }
      } else if (!isAppend) {
        setSurveyUnits([]); setPreviousUnits([]); setApiDifferences([]);
        setPaginationInfo((prev) => ({ ...prev, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false }));
        setApiError(activeFilters.propertyId ? `No records returned for Property ID ${activeFilters.propertyId}.` : 'No apartment wing details found.');
      }
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      if (!isAppend) {
        setSurveyUnits([]); setPreviousUnits([]); setApiDifferences([]);
      }
      setApiError(err instanceof Error ? err.message : 'Error calling backend API endpoint.');
    } finally {
      if (!isAppend && currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [setPaginationInfo]);

  React.useEffect(() => {
    if (filters.propertyId || filters.wingDetailId || filters.wingId) fetchWingWiseData();
  }, [fetchWingWiseData, filters.propertyId, filters.wingDetailId, filters.wingId]);

  const filteredSurveyUnits = React.useMemo(() => {
    let list = surveyUnits;
    if (filters.wingName) {
      const wTarget = filters.wingName.trim().toLowerCase().replace(/wing/i, '').trim();
      const hasUnitsWithWing = list.some((u) => {
        const uWing = (u.rawSurvey?.wing || u.wgFl.split('/')[0] || '').trim().toLowerCase().replace(/wing/i, '').trim();
        return uWing.length > 0;
      });
      if (hasUnitsWithWing) {
        const matchedList = list.filter((u) => {
          const uWing = (u.rawSurvey?.wing || u.wgFl.split('/')[0] || '').trim().toLowerCase().replace(/wing/i, '').trim();
          return uWing === wTarget || uWing.includes(wTarget) || wTarget.includes(uWing);
        });
        if (matchedList.length > 0) {
          list = matchedList;
        }
      }
    }
    if (!filters.floor) return list;
    return list.filter((u) => matchesFloor(u.rawSurvey?.floor ?? u.flr, filters.floor, u.wgFl));
  }, [surveyUnits, filters.floor, filters.wingName]);

  const filteredPreviousUnits = React.useMemo(() => {
    let list = previousUnits;
    if (filters.wingName) {
      const wTarget = filters.wingName.trim().toLowerCase().replace(/wing/i, '').trim();
      const hasUnitsWithWing = list.some((u) => {
        const uWing = (u.rawSurvey?.wing || u.wgFl.split('/')[0] || '').trim().toLowerCase().replace(/wing/i, '').trim();
        return uWing.length > 0;
      });
      if (hasUnitsWithWing) {
        const matchedList = list.filter((u) => {
          const uWing = (u.rawSurvey?.wing || u.wgFl.split('/')[0] || '').trim().toLowerCase().replace(/wing/i, '').trim();
          return uWing === wTarget || uWing.includes(wTarget) || wTarget.includes(uWing);
        });
        if (matchedList.length > 0) {
          list = matchedList;
        }
      }
    }
    if (!filters.floor) return list;
    return list.filter((u) => matchesFloor(u.rawSurvey?.floor ?? u.flr, filters.floor, u.wgFl));
  }, [previousUnits, filters.floor, filters.wingName]);

  const filteredUnitIds = React.useMemo(() => {
    if (!filters.floor && !filters.wingName) return null;
    return new Set([...filteredSurveyUnits.map((u) => u.id), ...filteredPreviousUnits.map((u) => u.id)]);
  }, [filters.floor, filters.wingName, filteredSurveyUnits, filteredPreviousUnits]);

  const filteredDifferences = React.useMemo(() => {
    if (!filteredUnitIds) return apiDifferences;
    return apiDifferences.filter((d) => filteredUnitIds.has(d.unitId));
  }, [apiDifferences, filteredUnitIds]);

  const totalDeltas = React.useMemo(() => {
    const diffs = filteredDifferences || [];
    return diffs.reduce(
      (acc, d) => ({
        carpetDelta: acc.carpetDelta + (d.carpetDiff || 0),
        buaDelta: acc.buaDelta + (d.buaDiff || 0),
        rvDelta: acc.rvDelta + (d.rvDiff || 0),
        cvDelta: acc.cvDelta + (d.capitalValueDiff || 0),
        taxDelta: acc.taxDelta + (d.taxDiff || 0),
        rtTaxDelta: acc.rtTaxDelta + (d.rtTaxDiff || 0),
      }),
      { carpetDelta: 0, buaDelta: 0, rvDelta: 0, cvDelta: 0, taxDelta: 0, rtTaxDelta: 0 }
    );
  }, [filteredDifferences]);

  const loadMoreUnits = React.useCallback(async () => {
    if (isLoading || isLoadingMoreRef.current) return;
    const canLoadMore = paginationInfo.hasNext || (paginationInfo.totalPages > 0 && paginationInfo.pageNumber < paginationInfo.totalPages);
    if (!canLoadMore) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      await fetchWingWiseData({ ...filters, pageNumber: paginationInfo.pageNumber + 1 }, true);
    } finally {
      setIsLoadingMore(false);
      setTimeout(() => { isLoadingMoreRef.current = false; }, 400);
    }
  }, [isLoading, paginationInfo, filters, fetchWingWiseData]);

  return {
    previousUnits: filteredPreviousUnits,
    surveyUnits: filteredSurveyUnits,
    differences: filteredDifferences,
    allPreviousUnits: previousUnits,
    allSurveyUnits: surveyUnits,
    totalDeltas,
    isLoading,
    isLoadingMore,
    apiError,
    rvTaxAmounts,
    cvTaxAmounts,
    setSurveyUnits,
    fetchWingWiseData,
    loadMoreUnits,
  };
}
