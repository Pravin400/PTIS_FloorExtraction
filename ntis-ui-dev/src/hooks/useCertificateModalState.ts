'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type {
  ApplicationLevel,
  CertificateStatus,
  WingOption,
  UnitSelectionItem,
  CertificateTypeMasterOption,
  CertificateData,
} from '@/types/building-permission.types';

import {
  normalizeCertificateGridData,
  mapRawCertificateItem,
  flattenCertificateRecords,
  getActiveCertificateForLevel,
  resolveUnitCertificateStatus,
  findWingDetailId,
  isCertificateFromApartmentLevel,
  type CertificateGridItems,
  type CertificateItem,
} from '@/lib/utils/certificate-grid-mapper';

import {
  getUnitsByPropertyAction,
  getApartmentQcCertificateGridAction,
  getUnitCertificatesByPropertyIdsAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action';

export interface UseCertificateModalStateProps {
  propertyId?: string;
  societyId?: number | null;
  wings?: WingOption[];
  units?: UnitSelectionItem[];
  certificateTypes?: CertificateTypeMasterOption[];
  initialCertificateGrid?: unknown;
  initialLevel?: ApplicationLevel;
  initialWingDetailId?: number | null;
  initialCertificateTypeId?: number;
  initialCertificateNumber?: string | null;
  initialCertificateDate?: string | null;
  initialDocumentGuid?: string | null;
  initialFileName?: string | null;
  initialPropertyCertificateId?: number | null;
  initialUnitNo?: string | null;
  initialData?: CertificateData | null;
}

const VALID_LEVELS: ApplicationLevel[] = ['Apartment', 'Wing', 'Unit', 'Entire Property', 'Floor'];

export function useCertificateModalState({
  propertyId,
  societyId,
  wings: initialWings = [],
  units: initialUnits = [],
  certificateTypes: initialTypes = [],
  initialCertificateGrid = null,
  initialLevel = 'Apartment',
  initialWingDetailId = null,
  initialCertificateTypeId = 3,
  initialCertificateNumber = null,
  initialCertificateDate = null,
  initialDocumentGuid = null,
  initialFileName = null,
  initialPropertyCertificateId = null,
  initialUnitNo = null,
  initialData = null,
}: UseCertificateModalStateProps) {
  const [level, setLevelRaw] = useState<ApplicationLevel>(() => {
    if (initialLevel) return initialLevel;
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('qde_building_level');
        if (saved && VALID_LEVELS.includes(saved as ApplicationLevel)) {
          return saved as ApplicationLevel;
        }
      } catch (err) {
        console.warn('sessionStorage access failed', err);
      }
    }
    return 'Apartment';
  });

  const setLevel = useCallback((newLevel: ApplicationLevel) => {
    setLevelRaw(newLevel);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('qde_building_level', newLevel);
      } catch (err) {
        console.warn('Failed to persist level preference to sessionStorage', err);
      }
    }
  }, []);
  const [dynamicWings] = useState<WingOption[]>(initialWings);
  const [dynamicUnits, setDynamicUnits] = useState<UnitSelectionItem[]>(initialUnits);
  const [dynamicTypes] = useState<CertificateTypeMasterOption[]>(initialTypes);
  const [gridItems, setGridItems] = useState<CertificateGridItems | null>(() => {
    return initialCertificateGrid ? normalizeCertificateGridData(initialCertificateGrid) : null;
  });
  const [isLoadingGridRecords, setIsLoadingGridRecords] = useState<boolean>(false);

  const [unitsPage, setUnitsPage] = useState(1);
  const [totalUnitsCount, setTotalUnitsCount] = useState(initialUnits.length);
  const [hasMoreUnits, setHasMoreUnits] = useState(false);
  const [isLoadingMoreUnits, setIsLoadingMoreUnits] = useState(false);

  const resolvedWings = useMemo(() => {
    const source = dynamicWings.length > 0 ? dynamicWings : initialWings;
    if (!Array.isArray(source)) return [];
    const seen = new Set<string>();
    const unique: WingOption[] = [];
    source.forEach((w) => {
      if (!w) return;
      const key = `${w.wingDetailId ?? ''}-${(w.wingName || '').trim().toLowerCase()}`;
      if (!seen.has(key) && (w.wingName || '').trim()) {
        seen.add(key);
        unique.push({
          ...w,
          wingName: (w.wingName || '').trim(),
          wingNo: w.wingNo || (w.wingName || '').trim(),
        });
      }
    });
    return unique;
  }, [dynamicWings, initialWings]);
  const resolvedUnits = dynamicUnits.length > 0 ? dynamicUnits : initialUnits;
  const resolvedCertificateTypes = dynamicTypes.length > 0 ? dynamicTypes : initialTypes;

  const [selectedWingDetailId, setSelectedWingDetailId] = useState<number | null>(() => {
    if (initialWingDetailId && resolvedWings.some(w => Number(w.wingDetailId) === Number(initialWingDetailId))) {
      return Number(initialWingDetailId);
    }
    return resolvedWings.length > 0 ? resolvedWings[0].wingDetailId : null;
  });

  // Certificate selection state
  const [selectedTypeId, setSelectedTypeId] = useState<number>(
    initialCertificateTypeId || (resolvedCertificateTypes[0]?.certificateTypeId ?? 3)
  );

  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [wingFilter, setWingFilterRaw] = useState<string>(() => {
    if (initialWingDetailId && resolvedWings.some(w => Number(w.wingDetailId) === Number(initialWingDetailId))) {
      return String(initialWingDetailId);
    }
    return resolvedWings.length > 0 ? String(resolvedWings[0].wingDetailId) : '';
  });
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [useFilter, setUseFilter] = useState<string>('all');

  const [prevPropWingDetailId, setPrevPropWingDetailId] = useState(initialWingDetailId);
  if (initialWingDetailId !== prevPropWingDetailId) {
    setPrevPropWingDetailId(initialWingDetailId);
    if (initialWingDetailId != null) {
      const targetId = Number(initialWingDetailId);
      if (resolvedWings.some((w) => Number(w.wingDetailId) === targetId)) {
        setSelectedWingDetailId(targetId);
        setWingFilterRaw(String(targetId));
      }
    }
  }

  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<number>>(() => {
    const set = new Set<number>();
    initialUnits.forEach((u) => {
      if (u.isSelected) set.add(u.propertyDetailsId);
    });
    if (initialUnitNo && initialLevel === 'Unit') {
      const tokens = initialUnitNo
        .split(/[,\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      initialUnits.forEach((u) => {
        const uNum = (u.unitNo || '').trim().toLowerCase();
        if (tokens.includes(uNum)) {
          set.add(u.propertyDetailsId);
        }
      });
    }
    return set;
  });

  const gridRecords = useMemo<CertificateItem[]>(() => flattenCertificateRecords(gridItems), [gridItems]);

  // Auto-select exact certificate, wing, and units when opening from Building Permission Edit button
  const [initialCertApplied, setInitialCertApplied] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    if (!initialCertApplied && (initialCertificateNumber || initialPropertyCertificateId || initialUnitNo || initialCertificateTypeId)) {
      void Promise.resolve().then(() => {
        if (!isSubscribed) return;
        const allCerts = gridRecords.length > 0 ? gridRecords : (gridItems ? flattenCertificateRecords(gridItems) : []);
        const targetCertId = initialPropertyCertificateId ? Number(initialPropertyCertificateId) : null;
        const targetCertNum = (initialCertificateNumber || '').trim().toLowerCase();
        const targetUnitTokens = (initialUnitNo || '')
          .split(/[,\s]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        const matchedCert = allCerts.find((c) => {
          if (targetCertId && c.propertyCertificateId === targetCertId) return true;
          if (targetCertNum && c.certificateNumber && c.certificateNumber.trim().toLowerCase() === targetCertNum) return true;
          return false;
        });

        if (matchedCert) {
          setInitialCertApplied(true);
          if (matchedCert.certificateTypeId) {
            setSelectedTypeId(matchedCert.certificateTypeId);
          }
          if (matchedCert.wingDetailId) {
            setSelectedWingDetailId(matchedCert.wingDetailId);
            setWingFilterRaw(String(matchedCert.wingDetailId));
          }
          if (level === 'Unit') {
            const matchingUnitIds = new Set<number>();
            resolvedUnits.forEach((u) => {
              const uNum = (u.unitNo || '').trim().toLowerCase();
              const pId = u.propertyId;
              const pdId = u.propertyDetailsId;
              const matchesByNumber =
                matchedCert.coveredUnitNumbers?.some((n) => n.trim().toLowerCase() === uNum) ||
                targetUnitTokens.includes(uNum);
              const matchesById =
                (pId != null && matchedCert.coveredPropertyIds?.includes(pId)) ||
                (pdId != null && matchedCert.coveredPropertyIds?.includes(pdId));
              if (matchesByNumber || matchesById) {
                matchingUnitIds.add(u.propertyDetailsId);
              }
            });
            if (matchingUnitIds.size > 0) {
              setSelectedUnitIds(matchingUnitIds);
            }
          }
        } else if (level === 'Unit' && targetUnitTokens.length > 0 && resolvedUnits.length > 0) {
          const matchingUnitIds = new Set<number>();
          resolvedUnits.forEach((u) => {
            const uNum = (u.unitNo || '').trim().toLowerCase();
            if (targetUnitTokens.includes(uNum)) {
              matchingUnitIds.add(u.propertyDetailsId);
            }
          });
          if (matchingUnitIds.size > 0) {
            setInitialCertApplied(true);
            setSelectedUnitIds(matchingUnitIds);
          }
        }
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [
    initialCertApplied,
    initialCertificateNumber,
    initialPropertyCertificateId,
    initialUnitNo,
    initialCertificateTypeId,
    gridRecords,
    gridItems,
    level,
    resolvedUnits,
  ]);

  // Resolve targetWingDetailId dynamically based on level, active wing filter, selected unit, or explicit wing selection
  const targetWingDetailId = useMemo(() => {
    if (wingFilter && wingFilter !== 'all') {
      const resolved = findWingDetailId(wingFilter, resolvedWings, gridItems);
      if (resolved != null) return resolved;
    }

    if (level === 'Unit' && selectedUnitIds.size > 0) {
      const selectedId = Array.from(selectedUnitIds)[0];
      const matchedUnit = resolvedUnits.find((u) => Number(u.propertyDetailsId) === Number(selectedId) || Number(u.propertyId) === Number(selectedId));
      if (matchedUnit && matchedUnit.wingDetailId) {
        return matchedUnit.wingDetailId;
      }
    }

    return selectedWingDetailId;
  }, [level, wingFilter, resolvedWings, gridItems, selectedUnitIds, resolvedUnits, selectedWingDetailId]);

  // Compute single selected unit propertyId for unit-level matching
  const targetUnitPropertyId = useMemo(() => {
    if (level === 'Unit') {
      if (selectedUnitIds.size === 1) {
        const selectedId = Array.from(selectedUnitIds)[0];
        const matchedUnit = resolvedUnits.find((u) => Number(u.propertyDetailsId) === Number(selectedId) || Number(u.propertyId) === Number(selectedId));
        if (matchedUnit) {
          return matchedUnit.propertyId || matchedUnit.propertyDetailsId || selectedId;
        }
        return selectedId;
      }
      return null;
    }
    return propertyId ?? null;
  }, [level, selectedUnitIds, resolvedUnits, propertyId]);

  const gridItemsRef = useRef(gridItems);
  useEffect(() => {
    gridItemsRef.current = gridItems;
  }, [gridItems]);

  const lastFetchedKeyRef = useRef<string | null>(null);

  // Sync grid items dynamically when level or selected targets change
  useEffect(() => {
    let isSubscribed = true;

    let targetPropId: string | number | null = null;
    let targetWingId: number | string | null = null;
    let targetSocId: number | string | null = null;

    if (societyId && Number(societyId) > 0) {
      targetSocId = Number(societyId);
      targetWingId = targetWingDetailId ?? selectedWingDetailId ?? null;
      targetPropId = null;
    } else {
      if (level === 'Apartment') {
        targetSocId = societyId ?? null;
      } else if (level === 'Wing') {
        targetWingId = targetWingDetailId ?? selectedWingDetailId ?? null;
      } else if (level === 'Unit') {
        targetPropId = propertyId ? Number(propertyId) : null;
        targetWingId = targetWingDetailId ?? selectedWingDetailId ?? null;
      }
    }

    if (!targetPropId && !targetWingId && !targetSocId) {
      return;
    }

    const requestKey = `${level}_${targetPropId}_${targetWingId}_${targetSocId}`;
    if (lastFetchedKeyRef.current === requestKey) {
      return;
    }

    // Only refetch if gridItems is not already populated from SSR
    if (gridItemsRef.current && (targetSocId === societyId || (level === 'Apartment' && targetSocId === societyId))) {
      lastFetchedKeyRef.current = requestKey;
      return;
    }

    lastFetchedKeyRef.current = requestKey;

    void Promise.resolve().then(() => {
      if (!isSubscribed) return;
      setIsLoadingGridRecords(true);

      getApartmentQcCertificateGridAction(targetPropId, targetWingId, targetSocId)
        .then((res) => {
          if (isSubscribed && res.success && res.data) {
            const normalized = normalizeCertificateGridData(res.data);
            if (gridItemsRef.current?.unitCertificates && gridItemsRef.current.unitCertificates.length > 0) {
              normalized.unitCertificates = gridItemsRef.current.unitCertificates;
            }
            setGridItems(normalized);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch certificate grid', err);
        })
        .finally(() => {
          if (isSubscribed) {
            setIsLoadingGridRecords(false);
          }
        });
    });

    return () => {
      isSubscribed = false;
    };
  }, [level, targetWingDetailId, selectedWingDetailId, targetUnitPropertyId, societyId, propertyId]);

  // Dynamically load unit certificates when in Unit level
  useEffect(() => {
    if (level !== 'Unit') return;
    const unitPropIds = Array.from(
      new Set(
        resolvedUnits
          .map((u) => u.propertyId)
          .filter((id): id is number => typeof id === 'number' && id > 0)
      )
    );
    if (unitPropIds.length === 0) return;

    const existingIds = new Set(
      (gridItemsRef.current?.unitCertificates || []).map((c) => c.propertyId).filter(Boolean)
    );
    const missingIds = unitPropIds.filter((id) => !existingIds.has(id));
    if (missingIds.length === 0) return;

    let isSubscribed = true;
    getUnitCertificatesByPropertyIdsAction(missingIds)
      .then((res) => {
        if (!isSubscribed || !res.success || !Array.isArray(res.data)) return;
        const newUnitCerts = res.data.map(mapRawCertificateItem);
        setGridItems((prev) => {
          if (!prev) {
            return {
              societyCertificates: [],
              wingCertificates: [],
              unitCertificates: newUnitCerts,
              floorCertificates: [],
            };
          }
          const prevUnitCerts = prev.unitCertificates || [];
          const merged = [...prevUnitCerts];
          for (const item of newUnitCerts) {
            const idx = merged.findIndex(
              (m) => m.certificateTypeId === item.certificateTypeId && m.propertyId === item.propertyId
            );
            if (idx >= 0) {
              merged[idx] = item;
            } else {
              merged.push(item);
            }
          }
          return {
            ...prev,
            unitCertificates: merged,
          };
        });
      })
      .catch((err) => {
        console.warn('Failed to dynamically fetch unit certificates', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [level, resolvedUnits]);

  // Helper: natural alphanumeric sort for units (e.g. A1, A2, A3, ..., A10, A12)
  const naturalUnitSort = useCallback((a: UnitSelectionItem, b: UnitSelectionItem): number => {
    return (a.unitNo || '').localeCompare(b.unitNo || '', undefined, { numeric: true, sensitivity: 'base' });
  }, []);

  // Helper: map raw unit record from API to UnitSelectionItem
  const mapRawUnitItem = (u: Record<string, unknown>, idx: number): UnitSelectionItem => {
    const rawPropId = Number(u.propertyId ?? u.PropertyId ?? 0);
    const rawDetailsId = Number(u.propertyDetailsId ?? u.PropertyDetailsId ?? u.id ?? u.Id ?? 0);
    const resolvedId = rawDetailsId > 0 ? rawDetailsId : (rawPropId > 0 ? rawPropId : idx + 1);
    const resolvedPropId = rawPropId > 0 ? rawPropId : resolvedId;
    return {
      propertyDetailsId: resolvedId,
      propertyId: resolvedPropId,
      unitNo: String(u.unitNo || u.UnitNo || u.partitionNo || u.PartitionNo || u.flatNo || u.FlatNo || `Unit ${idx + 1}`),
      wingDetailId: Number(u.wingDetailId || u.WingDetailId || 0),
      wingName: String(u.wingName || u.WingName || 'Wing'),
      floorName: String(u.floorName || u.FloorName || u.floor || '1st Floor'),
      useName: String(u.useName || u.UseName || u.use || 'Residential'),
      constructionYear: String(u.constructionYear || u.ConstructionYear || u.conYr || '').trim() || undefined,
      isSelected: false,
    };
  };

  // Helper: resolve wingDetailId from the current wingFilter value
  const getWingDetailIdFromFilter = useCallback((filterValue: string): number | null => {
    if (filterValue === 'all') return null;
    const matchedWing = resolvedWings.find(
      (w) => w.wingName === filterValue || String(w.wingDetailId) === filterValue
    );
    return matchedWing?.wingDetailId ?? null;
  }, [resolvedWings]);

  // Load next units on scroll (wing-scoped)
  const loadNextUnitsPage = useCallback(async () => {
    if (!propertyId || isLoadingMoreUnits || !hasMoreUnits) return;
    setIsLoadingMoreUnits(true);

    const nextPage = unitsPage + 1;
    const wingDetailIdParam = getWingDetailIdFromFilter(wingFilter);
    const res = await getUnitsByPropertyAction(propertyId, wingDetailIdParam, nextPage, 100);

    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      const newItems: UnitSelectionItem[] = (res.data as Record<string, unknown>[]).map(mapRawUnitItem);

      setDynamicUnits((prev) => {
        const existingIds = new Set(prev.map((item) => item.propertyDetailsId));
        const filteredNew = newItems.filter((item) => !existingIds.has(item.propertyDetailsId));
        const updated = [...prev, ...filteredNew].sort(naturalUnitSort);
        const total = typeof res.totalCount === 'number' ? res.totalCount : totalUnitsCount;
        setTotalUnitsCount(total);
        setHasMoreUnits(updated.length < total);
        return updated;
      });
      setUnitsPage(nextPage);
    } else {
      setHasMoreUnits(false);
    }

    setIsLoadingMoreUnits(false);
  }, [propertyId, isLoadingMoreUnits, hasMoreUnits, unitsPage, totalUnitsCount, wingFilter, getWingDetailIdFromFilter, naturalUnitSort]);

  // When wingFilter changes, re-fetch units AND grid data in parallel
  const setWingFilter = useCallback((value: string) => {
    setWingFilterRaw(value);
    if (!propertyId) return;

    setUnitsPage(1);
    setHasMoreUnits(true);
    setIsLoadingMoreUnits(true);
    setIsLoadingGridRecords(true);
    // Clear unit selection since the new wing will have different units
    setSelectedUnitIds(new Set());

    // Resolve wingDetailId using findWingDetailId helper
    const wingDetailIdParam = findWingDetailId(value, resolvedWings, gridItems);
    if (wingDetailIdParam != null) {
      setSelectedWingDetailId(wingDetailIdParam);
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        params.set('wingDetailId', String(wingDetailIdParam));
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
      }
    }

    const targetSocIdParam = societyId ? Number(societyId) : null;
    const preemptKey = `${level}_${null}_${wingDetailIdParam}_${targetSocIdParam}`;
    lastFetchedKeyRef.current = preemptKey;

    // Fetch all units in the wing (large page size) and certificate grid in parallel
    const unitsPromise = getUnitsByPropertyAction(propertyId, wingDetailIdParam, 1, 200);
    const gridPromise = getApartmentQcCertificateGridAction(null, wingDetailIdParam, targetSocIdParam);

    Promise.all([unitsPromise, gridPromise])
      .then(([unitsRes, gridRes]) => {
        // Process units
        if (unitsRes.success && Array.isArray(unitsRes.data)) {
          const mappedUnits: UnitSelectionItem[] = (unitsRes.data as Record<string, unknown>[]).map(mapRawUnitItem).sort(naturalUnitSort);
          setDynamicUnits(mappedUnits);
          const total = typeof unitsRes.totalCount === 'number' ? unitsRes.totalCount : mappedUnits.length;
          setTotalUnitsCount(total);
          setHasMoreUnits(mappedUnits.length < total);
        } else {
          setDynamicUnits([]);
          setTotalUnitsCount(0);
          setHasMoreUnits(false);
        }

        // Process grid data
        if (gridRes.success && gridRes.data) {
          const normalized = normalizeCertificateGridData(gridRes.data);
          if (gridItemsRef.current?.unitCertificates && gridItemsRef.current.unitCertificates.length > 0) {
            normalized.unitCertificates = gridItemsRef.current.unitCertificates;
          }
          setGridItems(normalized);
        }
      })
      .catch((err) => {
        console.warn('Error fetching wing units or grid data', err);
      })
      .finally(() => {
        setIsLoadingMoreUnits(false);
        setIsLoadingGridRecords(false);
      });
  }, [propertyId, resolvedWings, gridItems, level, naturalUnitSort, societyId]);




  const initialSelectedUnit = useMemo(() => {
    return initialUnits.find((u) => {
      if (u.isSelected) return true;
      if (initialUnitNo) {
        const tokens = initialUnitNo.split(/[,\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
        return tokens.includes((u.unitNo || '').trim().toLowerCase());
      }
      return false;
    });
  }, [initialUnits, initialUnitNo]);

  // 1. Initial certificate matching: resolve from initialCertificateGrid or fallback props
  const initialResolvedMatch = useMemo(() => {
    if (!initialCertificateGrid) return null;
    const norm = normalizeCertificateGridData(initialCertificateGrid);
    if (initialLevel === 'Unit' && initialSelectedUnit) {
      const stat = resolveUnitCertificateStatus(norm, initialCertificateTypeId || 3, initialSelectedUnit, societyId ? Number(societyId) : undefined);
      if (stat.status === 'direct') return { certificate: stat.certificate, inheritedFrom: 'Direct' as const };
      if (stat.status === 'wing') return { certificate: stat.certificate, inheritedFrom: 'Wing' as const };
      if (stat.status === 'apartment') return { certificate: stat.certificate, inheritedFrom: 'Apartment' as const };
      return { certificate: null, inheritedFrom: null };
    }
    return getActiveCertificateForLevel(
      norm,
      initialLevel,
      initialCertificateTypeId || 3,
      initialWingDetailId,
      initialSelectedUnit?.propertyId || null,
      societyId
    );
  }, [initialCertificateGrid, initialLevel, initialCertificateTypeId, initialWingDetailId, societyId, initialSelectedUnit]);

  const initialDirectCert = initialResolvedMatch?.certificate || null;
  const isInitialMatchDirect = initialResolvedMatch?.inheritedFrom === 'Direct' || !initialResolvedMatch?.inheritedFrom;

  const rawInitNum =
    initialDirectCert?.certificateNumber ||
    (initialData && (initialData.certificateTypeId === initialCertificateTypeId || !initialData.certificateTypeId) ? initialData.number : '') ||
    initialCertificateNumber ||
    '';

  const rawInitDate =
    initialDirectCert?.certificateDate ||
    (initialData && (initialData.certificateTypeId === initialCertificateTypeId || !initialData.certificateTypeId) ? initialData.date : '') ||
    initialCertificateDate ||
    '';

  const formattedInitDate = rawInitDate
    ? rawInitDate.includes('T')
      ? rawInitDate.split('T')[0]
      : rawInitDate
    : '';

  const initDocGuid =
    initialDirectCert?.documentGuid ||
    (initialData && (initialData.certificateTypeId === initialCertificateTypeId || !initialData.certificateTypeId) ? initialData.documentGuid : null) ||
    initialDocumentGuid ||
    null;

  const initFileName =
    initialDirectCert?.fileName ||
    (initialData && (initialData.certificateTypeId === initialCertificateTypeId || !initialData.certificateTypeId) ? initialData.fileName : null) ||
    initialFileName ||
    null;

  const initPropCertId =
    (isInitialMatchDirect ? initialDirectCert?.propertyCertificateId : null) ||
    (initialData && (initialData.certificateTypeId === initialCertificateTypeId || !initialData.certificateTypeId) ? initialData.propertyCertificateId : null) ||
    (initialPropertyCertificateId ? Number(initialPropertyCertificateId) : null);

  // Document form fields
  const [certificateDate, setCertificateDate] = useState<string>(formattedInitDate);
  const [certificateNumber, setCertificateNumber] = useState<string>(rawInitNum);
  const [status, setStatus] = useState<CertificateStatus>('Active');
  const [remarks, setRemarks] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingDocumentGuid, setExistingDocumentGuid] = useState<string | null>(initDocGuid);
  const [existingFileName, setExistingFileName] = useState<string | null>(initFileName);
  const [existingPropertyCertificateId, setExistingPropertyCertificateId] = useState<number | null>(initPropCertId);
  const [hasExistingDocument, setHasExistingDocument] = useState<boolean>(Boolean(initDocGuid));

  const selectedUnitPropertyIds = useMemo(() => {
    const ids: number[] = [];
    selectedUnitIds.forEach((id) => {
      ids.push(id);
      const matched = resolvedUnits.find((u) => Number(u.propertyDetailsId) === Number(id) || Number(u.propertyId) === Number(id));
      if (matched) {
        if (matched.propertyId != null && !ids.includes(matched.propertyId)) ids.push(matched.propertyId);
        if (matched.propertyDetailsId != null && !ids.includes(matched.propertyDetailsId)) ids.push(matched.propertyDetailsId);
      }
    });
    return ids;
  }, [selectedUnitIds, resolvedUnits]);

  const selectedUnitNumbers = useMemo(() => {
    return Array.from(selectedUnitIds).map((id) => {
      const matched = resolvedUnits.find((u) => Number(u.propertyDetailsId) === Number(id) || Number(u.propertyId) === Number(id));
      return matched?.unitNo || '';
    }).filter(Boolean);
  }, [selectedUnitIds, resolvedUnits]);

  // Derived active certificate and inheritedFrom based on current level & selection
  const { certificate: activeCertificate, inheritedFrom } = useMemo(() => {
    if (!gridItems) return { certificate: null, inheritedFrom: null };
    if (level === 'Unit') {
      if (selectedUnitIds.size === 1) {
        const singleId = Array.from(selectedUnitIds)[0];
        const matchedUnit = resolvedUnits.find((u) => Number(u.propertyDetailsId) === Number(singleId) || Number(u.propertyId) === Number(singleId));
        if (matchedUnit) {
          const stat = resolveUnitCertificateStatus(gridItems, selectedTypeId, matchedUnit, societyId ? Number(societyId) : undefined);
          if (stat.status === 'direct') {
            return { certificate: stat.certificate, inheritedFrom: 'Direct' };
          }
          if (stat.status === 'wing') {
            return { certificate: stat.certificate, inheritedFrom: 'Wing' };
          }
          if (stat.status === 'apartment') {
            return { certificate: stat.certificate, inheritedFrom: 'Apartment' };
          }
          return { certificate: null, inheritedFrom: null };
        }
      } else if (selectedUnitIds.size > 1) {
        // Multi-select batch mode: resolve inherited or common certificate for selected units
        const selectedList = resolvedUnits.filter(
          (u) => selectedUnitIds.has(u.propertyDetailsId) || (u.propertyId != null && selectedUnitIds.has(u.propertyId))
        );
        const statuses = selectedList.map((u) =>
          resolveUnitCertificateStatus(gridItems, selectedTypeId, u, societyId ? Number(societyId) : undefined)
        );

        // Check if any direct certificates exist among selected units
        const directStats = statuses.filter((s) => s.status === 'direct');
        if (directStats.length > 0) {
          const firstDirect = directStats[0].certificate;
          return { certificate: firstDirect, inheritedFrom: 'Direct' };
        }

        const wingMatch = statuses.find((s) => s.status === 'wing')?.certificate;
        if (wingMatch) {
          return { certificate: wingMatch, inheritedFrom: 'Wing' };
        }

        const aptMatch = statuses.find((s) => s.status === 'apartment')?.certificate;
        if (aptMatch) {
          return { certificate: aptMatch, inheritedFrom: 'Apartment' };
        }

        return { certificate: null, inheritedFrom: null };
      } else {
        const wingId = targetWingDetailId ?? selectedWingDetailId;
        const wingMatch = wingId != null
          ? (gridItems.wingCertificates || []).find(
              (r) => Number(r.wingDetailId) === Number(wingId) && r.certificateTypeId === selectedTypeId
            )
          : undefined;
        const aptMatch = (gridItems.societyCertificates || []).find(
          (r) => r.certificateTypeId === selectedTypeId
        );
        const hasAptContent = Boolean(
          aptMatch && (aptMatch.hasDocument || aptMatch.documentGuid || aptMatch.certificateNumber)
        );
        const isWingApt = isCertificateFromApartmentLevel(wingMatch, aptMatch);
        if (isWingApt && hasAptContent) {
          return { certificate: aptMatch || wingMatch, inheritedFrom: 'Apartment' };
        }
        if (wingMatch && !isWingApt && (wingMatch.hasDocument || wingMatch.documentGuid || wingMatch.certificateNumber)) {
          return { certificate: wingMatch, inheritedFrom: 'Wing' };
        }
        if (aptMatch && hasAptContent) {
          return { certificate: aptMatch, inheritedFrom: 'Apartment' };
        }
        return { certificate: null, inheritedFrom: null };
      }
      return { certificate: null, inheritedFrom: null };
    }
    return getActiveCertificateForLevel(
      gridItems,
      level,
      selectedTypeId,
      targetWingDetailId ?? selectedWingDetailId,
      targetUnitPropertyId,
      societyId,
      selectedUnitPropertyIds,
      selectedUnitNumbers
    );
  }, [
    gridItems,
    level,
    selectedTypeId,
    targetWingDetailId,
    selectedWingDetailId,
    targetUnitPropertyId,
    societyId,
    selectedUnitIds,
    resolvedUnits,
    selectedUnitPropertyIds,
    selectedUnitNumbers,
  ]);

  // Automatically update input fields when active certificate / selection targets change
  const selectedIdsKey = selectedUnitPropertyIds.join(',');
  const fieldSyncKey = `${level}_${selectedTypeId}_${targetWingDetailId ?? selectedWingDetailId}_${targetUnitPropertyId}_${societyId}_${selectedIdsKey}_${gridItems ? 'loaded' : 'none'}_${activeCertificate?.propertyCertificateId || activeCertificate?.certificateNumber || 'none'}_${activeCertificate?.documentGuid || 'none'}_${inheritedFrom || 'none'}`;

  const [prevFieldSyncKey, setPrevFieldSyncKey] = useState<string | null>(null);

  if (prevFieldSyncKey !== fieldSyncKey) {
    setPrevFieldSyncKey(fieldSyncKey);
    if (activeCertificate) {
      const isDirectRecord =
        level === 'Apartment' ||
        (level === 'Wing' && (inheritedFrom === 'Direct' || !inheritedFrom)) ||
        (level === 'Unit' && inheritedFrom === 'Direct');

      setCertificateNumber(activeCertificate.certificateNumber || '');
      let formattedDate = '';
      if (activeCertificate.certificateDate) {
        const rawDate = activeCertificate.certificateDate;
        const clean = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.trim().split(' ')[0];
        const parts = clean.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else if (parts[2].length === 4) {
            formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else {
            formattedDate = clean;
          }
        } else {
          formattedDate = clean;
        }
      }
      setCertificateDate(formattedDate);
      setStatus((activeCertificate.status as CertificateStatus) || 'Active');
      setExistingDocumentGuid(activeCertificate.documentGuid || null);
      setExistingFileName(activeCertificate.fileName || null);
      setExistingPropertyCertificateId(isDirectRecord ? (activeCertificate.propertyCertificateId || null) : null);
      setHasExistingDocument(Boolean(activeCertificate.hasDocument || activeCertificate.documentGuid));
      setAttachedFiles([]);
    } else {
      setCertificateNumber('');
      setCertificateDate('');
      setStatus('Active');
      setExistingDocumentGuid(null);
      setExistingFileName(null);
      setExistingPropertyCertificateId(null);
      setHasExistingDocument(false);
      setAttachedFiles([]);
    }
  }

  const refetchGrid = useCallback(async () => {
    let targetPropId: string | number | null = null;
    let targetWingId: number | string | null = null;
    let targetSocId: number | string | null = null;

    if (societyId && Number(societyId) > 0) {
      targetSocId = Number(societyId);
      targetWingId = targetWingDetailId ?? selectedWingDetailId ?? null;
      targetPropId = null;
    } else {
      if (level === 'Apartment') {
        targetSocId = societyId ?? null;
      } else if (level === 'Wing') {
        targetWingId = targetWingDetailId ?? selectedWingDetailId ?? null;
      } else if (level === 'Unit') {
        targetPropId = propertyId ? Number(propertyId) : null;
        targetWingId = targetWingDetailId ?? selectedWingDetailId ?? null;
      }
    }
    if (!targetPropId && !targetWingId && !targetSocId) {
      setIsLoadingGridRecords(false);
      return null;
    }

    const requestKey = `${level}_${targetPropId}_${targetWingId}_${targetSocId}`;
    lastFetchedKeyRef.current = requestKey;

    setIsLoadingGridRecords(true);
    try {
      const res = await getApartmentQcCertificateGridAction(targetPropId, targetWingId, targetSocId);
      if (res.success && res.data) {
        const normalized = normalizeCertificateGridData(res.data);

        // Fetch unit-level certificates for resolved units so unit certificates are updated in gridItems
        const unitPropIds = Array.from(
          new Set(
            resolvedUnits
              .map((u) => u.propertyId)
              .filter((id): id is number => typeof id === 'number' && id > 0)
          )
        );
        if (unitPropIds.length > 0) {
          try {
            const unitCertsRes = await getUnitCertificatesByPropertyIdsAction(unitPropIds);
            if (unitCertsRes.success && Array.isArray(unitCertsRes.data)) {
              const fetchedUnitCerts = unitCertsRes.data.map(mapRawCertificateItem);
              const existingUnitCerts = (gridItemsRef.current?.unitCertificates && gridItemsRef.current.unitCertificates.length > 0)
                ? gridItemsRef.current.unitCertificates
                : (normalized.unitCertificates || []);
              const mergedMap = new Map<string, CertificateItem>();
              existingUnitCerts.forEach((c) => {
                const key = `${c.certificateTypeId}_${c.propertyId || c.propertyDetailsId || ''}`;
                mergedMap.set(key, c);
              });
              fetchedUnitCerts.forEach((c) => {
                const key = `${c.certificateTypeId}_${c.propertyId || c.propertyDetailsId || ''}`;
                mergedMap.set(key, c);
              });
              normalized.unitCertificates = Array.from(mergedMap.values());
            }
          } catch (unitErr) {
            console.warn('Failed to fetch unit certificates in refetchGrid', unitErr);
          }
        }

        setGridItems(normalized);
        const { certificate: match, inheritedFrom: refetchInheritedFrom } = getActiveCertificateForLevel(
          normalized,
          level,
          selectedTypeId,
          targetWingDetailId ?? selectedWingDetailId,
          targetUnitPropertyId,
          societyId,
          selectedUnitPropertyIds,
          selectedUnitNumbers
        );
        const isDirect =
          level === 'Apartment' ||
          (level === 'Wing' && (refetchInheritedFrom === 'Direct' || !refetchInheritedFrom)) ||
          (level === 'Unit' && refetchInheritedFrom === 'Direct');

        if (match) {
          setCertificateNumber(match.certificateNumber || '');
          const formattedDate = match.certificateDate
            ? match.certificateDate.includes('T')
              ? match.certificateDate.split('T')[0]
              : match.certificateDate
            : '';
          setCertificateDate(formattedDate);
          setStatus((match.status as CertificateStatus) || 'Active');
          setExistingDocumentGuid(match.documentGuid || null);
          setExistingFileName(match.fileName || null);
          setExistingPropertyCertificateId(isDirect ? (match.propertyCertificateId || null) : null);
          setHasExistingDocument(Boolean(match.hasDocument || match.documentGuid));
        } else {
          setCertificateNumber('');
          setCertificateDate('');
          setStatus('Active');
          setExistingDocumentGuid(null);
          setExistingFileName(null);
          setExistingPropertyCertificateId(null);
          setHasExistingDocument(false);
          setAttachedFiles([]);
        }
        return normalized;
      }
      return null;
    } finally {
      setIsLoadingGridRecords(false);
    }
  }, [level, targetWingDetailId, selectedWingDetailId, societyId, selectedTypeId, targetUnitPropertyId, selectedUnitPropertyIds, selectedUnitNumbers, propertyId, resolvedUnits]);

  const activeCertificateType = useMemo(
    () => resolvedCertificateTypes.find((t) => t.certificateTypeId === selectedTypeId) || resolvedCertificateTypes[0],
    [resolvedCertificateTypes, selectedTypeId]
  );

  // Unique floors and uses for filter dropdowns — derived from ALL loaded units, not filtered
  const availableFloors = useMemo(() => {
    const set = new Set<string>();
    resolvedUnits.forEach((u) => {
      if (u.floorName) set.add(u.floorName);
    });
    return Array.from(set);
  }, [resolvedUnits]);

  const availableUses = useMemo(() => {
    const set = new Set<string>();
    resolvedUnits.forEach((u) => {
      if (u.useName) set.add(u.useName);
    });
    return Array.from(set);
  }, [resolvedUnits]);

  // Filtered unit list — wing filtering is server-side, floor/use/search are client-side
  const filteredUnits = useMemo(() => {
    const list = resolvedUnits.filter((unit) => {
      if (floorFilter !== 'all' && unit.floorName.toLowerCase() !== floorFilter.toLowerCase()) {
        return false;
      }
      if (useFilter !== 'all' && unit.useName.toLowerCase() !== useFilter.toLowerCase()) {
        return false;
      }
      if (unitSearchQuery.trim()) {
        const query = unitSearchQuery.trim().toLowerCase();
        const matchesUnit = unit.unitNo.toLowerCase().includes(query);
        const matchesWing = unit.wingName.toLowerCase().includes(query);
        const matchesFloor = unit.floorName.toLowerCase().includes(query);
        return matchesUnit || matchesWing || matchesFloor;
      }
      return true;
    });
    return list.sort(naturalUnitSort);
  }, [resolvedUnits, floorFilter, useFilter, unitSearchQuery, naturalUnitSort]);

  const isAllUnitsSelected = useMemo(() => {
    if (filteredUnits.length === 0) return false;
    return filteredUnits.every((u) => selectedUnitIds.has(u.propertyDetailsId));
  }, [filteredUnits, selectedUnitIds]);

  const toggleUnitSelection = useCallback((propertyDetailsId: number) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(propertyDetailsId)) {
        next.delete(propertyDetailsId);
      } else {
        next.add(propertyDetailsId);
      }
      return next;
    });
  }, []);

  const toggleAllUnits = useCallback((forceSelect?: boolean) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      const shouldSelect = typeof forceSelect === 'boolean' ? forceSelect : !isAllUnitsSelected;
      if (!shouldSelect) {
        filteredUnits.forEach((u) => next.delete(u.propertyDetailsId));
      } else {
        filteredUnits.forEach((u) => next.add(u.propertyDetailsId));
      }
      return next;
    });
  }, [filteredUnits, isAllUnitsSelected]);

  return {
    level,
    setLevel,
    selectedWingDetailId: targetWingDetailId ?? selectedWingDetailId,
    rawSelectedWingDetailId: selectedWingDetailId,
    targetWingDetailId,
    setSelectedWingDetailId,
    unitSearchQuery,
    setUnitSearchQuery,
    wingFilter,
    setWingFilter,
    floorFilter,
    setFloorFilter,
    useFilter,
    setUseFilter,
    selectedUnitIds,
    setSelectedUnitIds,
    selectedTypeId,
    setSelectedTypeId,
    activeCertificateType,
    certificateDate,
    setCertificateDate,
    certificateNumber,
    setCertificateNumber,
    status,
    setStatus,
    remarks,
    setRemarks,
    attachedFiles,
    setAttachedFiles,
    existingDocumentGuid,
    setExistingDocumentGuid,
    existingFileName,
    setExistingFileName,
    existingPropertyCertificateId,
    setExistingPropertyCertificateId,
    hasExistingDocument,
    setHasExistingDocument,
    wings: resolvedWings,
    certificateTypes: resolvedCertificateTypes,
    availableFloors,
    availableUses,
    filteredUnits,
    isAllUnitsSelected,
    toggleUnitSelection,
    toggleAllUnits,
    totalUnitsCount,
    hasMoreUnits,
    isLoadingMoreUnits,
    loadNextUnitsPage,
    gridRecords,
    gridItems,
    isLoadingGridRecords,
    inheritedFrom,
    activeCertificate,
    refetchGrid,
  };
}
