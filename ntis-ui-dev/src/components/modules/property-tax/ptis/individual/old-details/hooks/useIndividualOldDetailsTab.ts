'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import type {
  OldFloorDetailsData,
  OldDetailsData,
  OldTaxesData,
  MappedPropertyItem,
} from '@/types/ptis.types';
import { defaultOldDetails } from '@/types/ptis-defaults.types';
import {
  getIndividualOldDetailsAction,
  getIndividualOldFloorDetailsAction,
  getIndividualOldTaxesDetailsAction,
  getIndividualMappedPropertiesAction,
} from '@/app/[locale]/property-tax/ptis/individual/action';
import type {
  UseIndividualOldDetailsTabParams,
  UseIndividualOldDetailsTabReturn,
} from './useIndividualOldDetailsTab.types';
import { runOnDemandFetch } from './old-details-fetch.utils';

export function useIndividualOldDetailsTab({
  propertyId: propPropertyId,
  showOldFloorInfo,
  setShowOldFloorInfo,
  showOldTaxInfo,
  setShowOldTaxInfo,
  showOldMapInfo,
  setShowOldMapInfo,
  oldFloorTableData = [],
  oldDetailsData,
  oldTaxesData,
  mappedPropertiesData = [],
  onPropertyMapping,
}: UseIndividualOldDetailsTabParams): UseIndividualOldDetailsTabReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();

  const [localShowFloor, setLocalShowFloor] = useState(false);
  const [localShowTax, setLocalShowTax] = useState(false);
  const [localShowMap, setLocalShowMap] = useState(false);

  const effectiveShowFloor = showOldFloorInfo !== undefined ? showOldFloorInfo : localShowFloor;
  const effectiveShowTax = showOldTaxInfo !== undefined ? showOldTaxInfo : localShowTax;
  const effectiveShowMap = showOldMapInfo !== undefined ? showOldMapInfo : localShowMap;

  const resolvedPropertyId = useMemo(() => {
    if (propPropertyId !== undefined && propPropertyId !== null && propPropertyId !== '') {
      return propPropertyId;
    }
    return searchParams?.get('propertyId') || null;
  }, [propPropertyId, searchParams]);

  const [fetchedData, setFetchedData] = useState<{
    propId: number | string | null;
    details: OldDetailsData | null;
    floors: OldFloorDetailsData[] | null;
    taxes: OldTaxesData | null;
    mapped: MappedPropertyItem[] | null;
  }>({
    propId: null,
    details: null,
    floors: null,
    taxes: null,
    mapped: null,
  });

  const [isLoadingFloors, setIsLoadingFloors] = useState(false);
  const [isLoadingTaxes, setIsLoadingTaxes] = useState(false);
  const [isLoadingMapped, setIsLoadingMapped] = useState(false);

  const attemptedFloorsPropRef = useRef<number | string | null>(null);
  const attemptedTaxesPropRef = useRef<number | string | null>(null);
  const attemptedMappedPropRef = useRef<number | string | null>(null);

  const isCurrentProp = fetchedData.propId === resolvedPropertyId;
  const rawDetails = (isCurrentProp ? fetchedData.details : null) ?? oldDetailsData;
  const currentFloors = (isCurrentProp ? fetchedData.floors : null) ?? oldFloorTableData;
  const currentTaxes = (isCurrentProp ? fetchedData.taxes : null) ?? oldTaxesData;
  const currentMapped = (isCurrentProp ? fetchedData.mapped : null) ?? mappedPropertiesData;

  const currentDetails = useMemo(() => {
    const hasData = Boolean(
      rawDetails?.oldZoneName ||
      rawDetails?.oldWardNo ||
      rawDetails?.oldPropertyNo ||
      rawDetails?.oldRV ||
      rawDetails?.oldALV ||
      rawDetails?.oldTotalTax
    );
    if (hasData || !currentMapped || currentMapped.length === 0) {
      return rawDetails;
    }
    // Synthesize from currentMapped
    const first = currentMapped[0];
    const totalOldPlotArea = currentMapped.reduce((sum, m) => sum + (Number(m.oldPlotArea) || 0), 0);
    const totalOldConstArea = currentMapped.reduce((sum, m) => sum + (Number(m.oldConstructionArea) || 0), 0);
    const totalOldALV = currentMapped.reduce((sum, m) => sum + (Number(m.oldALV) || 0), 0);
    const totalOldRV = currentMapped.reduce((sum, m) => sum + (Number(m.oldRV) || 0), 0);
    const totalOldGeneralTax = currentMapped.reduce((sum, m) => sum + (Number(m.oldGeneralTax) || 0), 0);
    const totalOldTotalTax = currentMapped.reduce((sum, m) => sum + (Number(m.oldTotalTax) || 0), 0);

    const oldPropNos = currentMapped.map((m) => m.oldPropertyNo).filter(Boolean);
    const oldWardNos = Array.from(new Set(currentMapped.map((m) => m.oldWardNo).filter(Boolean)));
    const oldPartitionNos = currentMapped.map((m) => m.oldPartitionNo).filter((p) => p && p !== '0' && p !== '-');
    const oldEgovNos = currentMapped.map((m) => m.oldEgovNo).filter(Boolean);
    const oldPlotNos = currentMapped.map((m) => m.oldPlotNo).filter(Boolean);

    return {
      ...defaultOldDetails,
      oldZoneName: first.oldZoneNo || '',
      oldWardNo: oldWardNos.join(', ') || first.oldWardNo || '',
      oldPropertyNo: oldPropNos.join(', ') || first.oldPropertyNo || '',
      oldPartitionNo: oldPartitionNos.join(', ') || first.oldPartitionNo || '-',
      oldEGovernanceNo: oldEgovNos.join(', ') || first.oldEgovNo || '',
      oldPlotNo: oldPlotNos.join(', ') || first.oldPlotNo || '',
      oldPlotArea: totalOldPlotArea > 0 ? String(totalOldPlotArea) : String(first.oldPlotArea || ''),
      oldConstructionArea: totalOldConstArea > 0 ? String(totalOldConstArea) : String(first.oldConstructionArea || ''),
      oldALV: totalOldALV > 0 ? String(totalOldALV) : String(first.oldALV || ''),
      oldRV: totalOldRV > 0 ? String(totalOldRV) : String(first.oldRV || ''),
      oldPropertyTax: totalOldGeneralTax > 0 ? String(totalOldGeneralTax) : String(first.oldGeneralTax || ''),
      oldTotalTax: totalOldTotalTax > 0 ? String(totalOldTotalTax) : String(first.oldTotalTax || ''),
    };
  }, [rawDetails, currentMapped]);

  const lastFetchedIdRef = useRef<number | string | null>(null);
  useEffect(() => {
    if (!resolvedPropertyId) return;

    const hasData = Boolean(
      currentDetails?.oldZoneName ||
      currentDetails?.oldWardNo ||
      currentDetails?.oldPropertyNo ||
      currentDetails?.oldRV ||
      currentDetails?.oldALV ||
      currentDetails?.oldTotalTax
    );

    if (hasData || lastFetchedIdRef.current === resolvedPropertyId) {
      if (hasData) lastFetchedIdRef.current = resolvedPropertyId;
      return;
    }

    lastFetchedIdRef.current = resolvedPropertyId;
    let isMounted = true;

    Promise.all([
      getIndividualOldDetailsAction(resolvedPropertyId),
      getIndividualMappedPropertiesAction(resolvedPropertyId),
    ])
      .then(([detailsRes, mappedRes]) => {
        if (!isMounted) return;
        const detailsData = detailsRes?.success && detailsRes.data ? detailsRes.data : null;
        const mappedData = mappedRes?.success && Array.isArray(mappedRes.data) ? mappedRes.data : null;

        setFetchedData((prev) => ({
          ...prev,
          propId: resolvedPropertyId,
          details: detailsData ?? prev.details,
          mapped: mappedData ?? prev.mapped,
        }));
      })
      .catch(() => {
        // Handled gracefully without polluting console
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedPropertyId, currentDetails]);

  const handleToggleMapDetails = useCallback(async () => {
    const nextState = !effectiveShowMap;
    setLocalShowMap(nextState);
    setShowOldMapInfo?.(nextState);

    if (nextState) {
      setLocalShowFloor(false);
      setShowOldFloorInfo?.(false);
      setLocalShowTax(false);
      setShowOldTaxInfo?.(false);
    }

    if (nextState && currentMapped.length === 0) {
      await runOnDemandFetch(
        resolvedPropertyId,
        attemptedMappedPropRef,
        setIsLoadingMapped,
        getIndividualMappedPropertiesAction,
        (data) =>
          setFetchedData((prev) => ({
            ...prev,
            propId: resolvedPropertyId,
            mapped: data,
          })),
        'Failed to load mapped properties'
      );
    }
  }, [
    effectiveShowMap,
    setShowOldMapInfo,
    setShowOldFloorInfo,
    setShowOldTaxInfo,
    currentMapped.length,
    resolvedPropertyId,
  ]);

  const handleToggleFloorDetails = useCallback(async () => {
    const nextState = !effectiveShowFloor;
    setLocalShowFloor(nextState);
    setShowOldFloorInfo?.(nextState);

    if (nextState) {
      setLocalShowMap(false);
      setShowOldMapInfo?.(false);
      setLocalShowTax(false);
      setShowOldTaxInfo?.(false);
    }

    if (nextState && currentFloors.length === 0) {
      await runOnDemandFetch(
        resolvedPropertyId,
        attemptedFloorsPropRef,
        setIsLoadingFloors,
        getIndividualOldFloorDetailsAction,
        (data) =>
          setFetchedData((prev) => ({
            ...prev,
            propId: resolvedPropertyId,
            floors: data,
          })),
        'Failed to load old floor details'
      );
    }
  }, [
    effectiveShowFloor,
    setShowOldFloorInfo,
    setShowOldMapInfo,
    setShowOldTaxInfo,
    currentFloors.length,
    resolvedPropertyId,
  ]);

  const handleToggleOldTax = useCallback(async () => {
    const nextState = !effectiveShowTax;
    setLocalShowTax(nextState);
    setShowOldTaxInfo?.(nextState);

    if (nextState) {
      setLocalShowMap(false);
      setShowOldMapInfo?.(false);
      setLocalShowFloor(false);
      setShowOldFloorInfo?.(false);
    }

    if (nextState && !currentTaxes) {
      await runOnDemandFetch(
        resolvedPropertyId,
        attemptedTaxesPropRef,
        setIsLoadingTaxes,
        getIndividualOldTaxesDetailsAction,
        (data) =>
          setFetchedData((prev) => ({
            ...prev,
            propId: resolvedPropertyId,
            taxes: data,
          })),
        'Failed to load old taxes details'
      );
    }
  }, [
    effectiveShowTax,
    setShowOldTaxInfo,
    setShowOldMapInfo,
    setShowOldFloorInfo,
    currentTaxes,
    resolvedPropertyId,
  ]);

  // Pre-fetch property mapping page for instant opening
  useEffect(() => {
    if (resolvedPropertyId && typeof router?.prefetch === 'function') {
      router.prefetch(`/${locale}/property-tax/property-mapping`);
    }
  }, [resolvedPropertyId, router, locale]);

  const handleNavigatePropertyMapping = useCallback(() => {
    if (onPropertyMapping) {
      onPropertyMapping();
      return;
    }

    const currentWardNo = searchParams?.get('wardNo') || '';
    const currentPropertyNo = searchParams?.get('propertyNo') || '';
    const currentPartitionNo = searchParams?.get('partitionNo') || '';
    const currentWardId = searchParams?.get('wardId') || '';

    const params = new URLSearchParams({
      propertyId: String(resolvedPropertyId || ''),
      wardNo: String(currentWardNo),
      propertyNo: String(currentPropertyNo),
      partitionNo: String(currentPartitionNo),
      wardId: String(currentWardId),
      from: 'individual',
      returnUrl: `/${locale}/property-tax/ptis/individual`,
      propNo: String(currentDetails?.oldPropertyNo || ''),
      zone: String(currentDetails?.oldZoneName || ''),
      ward: String(currentDetails?.oldWardNo || ''),
      area: String(currentDetails?.oldPlotArea || ''),
      tax: String(currentDetails?.oldTotalTax || ''),
      rv: String(currentDetails?.oldRV || ''),
      cv: String(currentDetails?.oldCV || ''),
      floors: String(currentDetails?.oldConstructionArea || ''),
    }).toString();

    router.push(`/${locale}/property-tax/property-mapping?${params}`);
  }, [onPropertyMapping, router, locale, searchParams, resolvedPropertyId, currentDetails]);

  return {
    effectiveShowFloor,
    effectiveShowTax,
    effectiveShowMap,
    currentDetails,
    currentFloors,
    currentTaxes,
    currentMapped,
    isLoadingFloors,
    isLoadingTaxes,
    isLoadingMapped,
    handleToggleMapDetails,
    handleToggleFloorDetails,
    handleToggleOldTax,
    handleNavigatePropertyMapping,
  };
}

export * from './useIndividualOldDetailsTab.types';
export * from './old-details-fetch.utils';
