import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { logger } from '@/lib/utils/logger';
import { Scope, OperationScope, ExecuteOperationPayload, OperationPreviewPayload, OperationPreviewResponse } from '@/types/addTaxes.types';
import type { ScopeOptionItem, EligibleCountPayload, SearchPropertyItem } from '@/types/addTaxes.types';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { fetchEligibleCountClient, executeOperationClient, fetchServerTimeClient, fetchWardsClient, searchPropertiesClient, searchPropertiesByCategoryClient, previewOperationClient } from '@/lib/api/add-taxes/operations.client';

import type { WardItem } from '@/types/wardMaster.types';

interface WardOption {
  value: string;
  label: string;
  zoneId: string;
}

interface BuildingOption {
  value: string;
  label: string;
  propertyNo: string;
  partitionNo?: string;
  propertyId?: number | string;
}

interface SearchByCategoryItem {
  propertyId: string | number;
  propertyNo: string;
  partitionNo?: string | null;
}

interface SkipReasonSummary {
  code: string;
  count: number;
}

interface EligibleCountActionResponse {
  eligible?: number;
  skipped?: number;
  total?: number;
  alreadyTaxed?: number;
  skipReasons?: SkipReasonSummary[];
  error?: string;
}

interface ExecuteOperationActionResponse {
  items?: {
    jobId: string;
    summary: {
      total: number;
    };
  };
  error?: string;
}

function resolveBuildingScope(
  propertyIdsStr: string | null,
  propertyNoStr: string | null,
  fetchedBuildings: BuildingOption[]
) {
  const propertyIdsList: number[] = [];
  const buildingsList: string[] = [];

  const rawTokens: string[] = [];
  const valStr = propertyIdsStr || propertyNoStr;
  if (valStr) {
    valStr.split(',').forEach(s => {
      const trimmed = s.trim();
      if (trimmed && !rawTokens.includes(trimmed)) rawTokens.push(trimmed);
    });
  }

  for (const token of rawTokens) {
    const bObj = fetchedBuildings.find(b => b.value === token || b.label === token || b.propertyNo === token);

    if (bObj) {
      const idVal = Number(bObj.propertyId);
      if (Number.isFinite(idVal) && idVal > 0 && !propertyIdsList.includes(idVal)) {
        propertyIdsList.push(idVal);
      }

      const bName = bObj.label || bObj.value || bObj.propertyNo;
      if (bName && !buildingsList.includes(bName)) {
        buildingsList.push(bName);
      }
    } else {
      // In Building-wise mode, any token entered or selected is a building / property number
      if (!buildingsList.includes(token)) {
        buildingsList.push(token);
      }
    }
  }

  return {
    propertyIds: propertyIdsList,
    building: buildingsList.length > 0 ? buildingsList : undefined
  };
}
export function useScopeSelection(
  selectedScope: Scope,
  selectionData: Record<string, string[]>,
  _currentScopeData: ScopeOptionItem | undefined,
  _isInitialized: boolean,
  onStartExecution: ((jobId: string, totalCount: number, scheduledTime?: string) => void) | undefined,
  selectedFinanceYearId?: string | number,
  // Server-prefetched (page.tsx) — Zone & Wards don't depend on any other selection.
  zoneOptions: { value: string; label: string }[] = [],
  initialWards: WardItem[] = []
) {
  const searchParams = useSearchParams();
  const t = useTranslations('addTaxes');
  const { confirm } = useConfirm();

  // Helper to extract values from selectionData first, with fallback to URL searchParams
  const getSelectedValues = (substring: string): string[] => {
    const target = substring.toLowerCase();
    for (const k of Object.keys(selectionData)) {
      const lk = k.toLowerCase();
      if (target === 'zone' && lk.includes('zone') && !lk.includes('ward')) {
        if (selectionData[k] && selectionData[k].length > 0) return selectionData[k];
      }
      if (target === 'ward' && lk.includes('ward') && !lk.includes('zone')) {
        if (selectionData[k] && selectionData[k].length > 0) return selectionData[k];
      }
      if (target !== 'zone' && target !== 'ward' && lk.includes(target)) {
        if (selectionData[k] && selectionData[k].length > 0) return selectionData[k];
      }
    }
    return [];
  };

  const getSelectedJoined = (substring: string): string => {
    const vals = getSelectedValues(substring);
    if (vals.length > 0) {
      const filtered = vals.filter(v => v !== 'select-all');
      if (filtered.length > 0) return filtered.join(',');
      return 'select-all';
    }
    return '';
  };

  const getFyFromParams = (): string | number => {
    if (selectedFinanceYearId !== undefined && selectedFinanceYearId !== null && selectedFinanceYearId !== '') {
      const num = Number(selectedFinanceYearId);
      return isNaN(num) ? selectedFinanceYearId : num;
    }
    let fy: string | null = null;
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      fy = sp.get('financeYearId') || sp.get('financeyearid') || sp.get('financeYear') || sp.get('financeyear');
    }
    if (!fy) {
      fy = searchParams.get('financeYearId') || searchParams.get('financeyearid') || searchParams.get('financeYear') || searchParams.get('financeyear');
    }
    if (fy) {
      const num = Number(fy);
      return isNaN(num) ? fy : num;
    }
    return '';
  };

  const [isValidated, setIsValidated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [overrideAlreadyTaxed, setOverrideAlreadyTaxed] = useState(false);
  const [activeMasterDataScope, setActiveMasterDataScope] = useState<string | undefined>(undefined);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<OperationPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(5);

  const [fetchedWards, setFetchedWards] = useState<WardOption[]>(() =>
    (initialWards || []).map(w => ({
      value: String(w.id),
      label: w.wardNo || '',
      zoneId: String(w.zoneId ?? '')
    }))
  );
  const [isFetchingWards, setIsFetchingWards] = useState(false);

  const [prevInitialWards, setPrevInitialWards] = useState(initialWards);
  if (initialWards !== prevInitialWards) {
    setPrevInitialWards(initialWards);
    if (initialWards.length > 0 && fetchedWards.length === 0) {
      setFetchedWards(
        initialWards.map(w => ({
          value: String(w.id),
          label: w.wardNo || '',
          zoneId: String(w.zoneId ?? '')
        }))
      );
    }
  }

  const [fetchedBuildings, setFetchedBuildings] = useState<BuildingOption[]>([]);
  const [isFetchingBuildings, setIsFetchingBuildings] = useState(false);
    const [fetchedToBuildings, setFetchedToBuildings] = useState<BuildingOption[]>([]);
  const [buildingPage, setBuildingPage] = useState(1);
  const [hasMoreBuildings, setHasMoreBuildings] = useState(false);
  const [isLoadingMoreBuildings, setIsLoadingMoreBuildings] = useState(false);

  const hasManualSelections = Object.keys(selectionData).some(
    k => selectionData[k] && selectionData[k].length > 0
  );

  const isProceedDisabled =
    isCalculating ||
    isModalOpen ||
    isPreviewModalOpen ||
    isValidated ||
    hasManualSelections;
  const [toBuildingPage, setToBuildingPage] = useState(1);
  const [hasMoreToBuildings, setHasMoreToBuildings] = useState(false);
  const [isLoadingMoreToBuildings, setIsLoadingMoreToBuildings] = useState(false);
  const [isFetchingToBuildings, setIsFetchingToBuildings] = useState(false);
  const [currentPropertyFrom, setCurrentPropertyFrom] = useState<string>('');
  const buildingSearchRef = useRef<string>('');
  const toBuildingSearchRef = useRef<string>('');
  const buildingSearchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toBuildingSearchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (buildingSearchTimerRef.current) clearTimeout(buildingSearchTimerRef.current);
      if (toBuildingSearchTimerRef.current) clearTimeout(toBuildingSearchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsValidated(false);
      setEligibleCount(null);
      setOverrideAlreadyTaxed(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectionData, selectedScope]);

  const handleCalculateEligible = async (overrideScope?: Scope | string) => {
    if (overrideScope === 'masterDataChange' || String(overrideScope).toLowerCase() === 'masterdatachange') {
      setActiveMasterDataScope('masterDataChange');
    }
    const effectiveScope = (typeof overrideScope === 'string' && overrideScope ? overrideScope : (activeMasterDataScope || selectedScope)) as Scope;
    setIsCalculating(true);
    setIsValidated(false);
    setOverrideAlreadyTaxed(false);
    try {
      const zoneIds = getSelectedJoined('zone');
      const wardIds = getSelectedJoined('ward');
      const propertyTypeId = getSelectedJoined('property type');
      const assessmentStatusIds = getSelectedJoined('assessment status');
      const fromPropId = getSelectedJoined('from');
      const toPropId = getSelectedJoined('to');
      const fromPropNo = (fetchedBuildings.find(b => b.value === fromPropId)?.label) || fromPropId;
      const toPropNo = (fetchedToBuildings.find(b => b.value === toPropId)?.label) || toPropId;

      // Validate required fields before calculating
      const hasAnyValue = (keySubstring: string): boolean => {
        const joined = getSelectedJoined(keySubstring);
        if (joined && joined.length > 0) return true;
        const hasSelection = Object.keys(selectionData).some(k => k.toLowerCase().includes(keySubstring) && selectionData[k] && selectionData[k].length > 0);
        return hasSelection;
      };

      let isConfigValid = false;
      if (effectiveScope === 'masterDataChange' || effectiveScope === 'all') {
        isConfigValid = true;
      } else if (selectedScope === 'zone') {
        isConfigValid = hasAnyValue('zone');
      } else if (effectiveScope === 'ward') {
        const zoneOk = hasAnyValue('zone');
        const wardOk = hasAnyValue('ward');
        isConfigValid = zoneOk && wardOk;
      } else if (selectedScope === 'building') {
        const hasBuilding = hasAnyValue('property no') || hasAnyValue('building');
        isConfigValid = hasAnyValue('zone') && hasAnyValue('ward') && hasBuilding;
      } else if (selectedScope === 'property') {
        const hasProp = hasAnyValue('property no') || hasAnyValue('building') || hasAnyValue('search');
        isConfigValid = hasProp;
      } else if (selectedScope === 'range') {
        isConfigValid = hasAnyValue('ward') && hasAnyValue('from') && hasAnyValue('to');
      }

      if (!isConfigValid) {

        toast.error(t('messages.fillRequiredFields'));
        setIsCalculating(false);
        return;
      }

      if (selectedScope === 'range') {
        const fromIndex = fetchedBuildings.findIndex(b => b.value === fromPropId);
        const toIndex = fetchedBuildings.findIndex(b => b.value === toPropId);

        if (fromIndex !== -1 && toIndex !== -1 && toIndex < fromIndex) {
          toast.error(t('messages.invalidRange'));
          setIsCalculating(false);
          return;
        }
      }

      const scopeData: OperationScope = {};
      if (zoneIds && zoneIds !== 'select-all') {
        const parsedZoneIds = zoneIds.split(',').map(id => {
          const num = Number(id);
          if (Number.isFinite(num) && num > 0) return num;
          const zObj = zoneOptions.find(z => z.value === id || z.label === id);
          return zObj ? Number(zObj.value) : NaN;
        }).filter(n => Number.isFinite(n) && n > 0);
        if (parsedZoneIds.length > 0) scopeData.zoneIds = parsedZoneIds;
      }

      if (wardIds && wardIds !== 'select-all') {
        const parsedWardIds = wardIds.split(',').map(id => {
          const num = Number(id);
          if (Number.isFinite(num) && num > 0) return num;
          const wObj = fetchedWards.find(w => w.value === id || w.label === id);
          return wObj ? Number(wObj.value) : NaN;
        }).filter(n => Number.isFinite(n) && n > 0);
        if (parsedWardIds.length > 0) scopeData.wardIds = parsedWardIds;

        if (!scopeData.zoneIds || scopeData.zoneIds.length === 0) {
          const parentZoneIds = parsedWardIds.map(id => {
            const w = fetchedWards.find(x => x.value === String(id));
            return w ? Number(w.zoneId) : null;
          }).filter(Boolean) as number[];
          if (parentZoneIds.length > 0) scopeData.zoneIds = Array.from(new Set(parentZoneIds));
        }
      }
      if (propertyTypeId && propertyTypeId !== 'select-all') {
        const ptIds = propertyTypeId
          .split(',')
          .map((x) => Number(x))
          .filter(Number.isFinite);
        if (ptIds.length > 0) {
          scopeData.propertyTypeIds = ptIds;
          scopeData.propertyTypeId = ptIds[0];
        }
      }
      if (assessmentStatusIds) {
        scopeData.assessmentStatusIds = assessmentStatusIds.split(',').map(Number);
      }

      if (effectiveScope === 'property') {
        scopeData.propertyIds = [];
        const propertyIds = getSelectedJoined('property no') || getSelectedJoined('building') || searchParams.get('propertyid');
        if (propertyIds) {
          scopeData.propertyIds = propertyIds.split(',').map(Number).filter(Number.isFinite);
        }

        const searchText = getSelectedJoined('search') || searchParams.get('searchText') || searchParams.get('SearchText');
        if (searchText) {
          scopeData.searchText = searchText;
        } else {
          scopeData.searchText = '';
        }
      }

      if (effectiveScope === 'building') {
        const propIdVal = getSelectedJoined('property no') || getSelectedJoined('building') || searchParams.get('propertyid');
        const propNoVal = (fetchedBuildings.find(b => b.value === (getSelectedValues('property no')[0] || getSelectedValues('building')[0] || searchParams.get('propertyid')?.split(',')[0]))?.propertyNo || searchParams.get('propertyno') || '');
        const buildingScope = resolveBuildingScope(
          propIdVal,
          propNoVal,
          fetchedBuildings
        );
        scopeData.propertyIds = buildingScope.propertyIds;
        if (buildingScope.building) scopeData.building = buildingScope.building;
      }

      if (effectiveScope === 'range') {
        if (fromPropId) scopeData.fromPropertyId = Number(fromPropId);
        if (toPropId) scopeData.toPropertyId = Number(toPropId);
        if (fromPropNo) scopeData.fromPropertyNo = fromPropNo;
        if (toPropNo) scopeData.toPropertyNo = toPropNo;
      }

      const financeYearId = getFyFromParams();
      const operation = 'addTax';

      const payload: EligibleCountPayload = {
        financeYearId: Number(financeYearId),
        scopeType: effectiveScope,
        scope: scopeData,
        operation
      };

      const buildSkipReasonMessage = (skipCount: number, skipReasons?: SkipReasonSummary[]) => {
        const reasons = (skipReasons ?? []).filter(r => r.count > 0);
        if (reasons.length === 0) {
          return t('messages.skippedCount', { count: skipCount, fallback: `${skipCount} properties were skipped.` });
        }
        const dedupedByCode = Array.from(
          reasons.reduce((map, r) => {
            const label = t.has(`skipReasons.${r.code}`) ? t(`skipReasons.${r.code}`) : r.code;
            map.set(label, (map.get(label) ?? 0) + r.count);
            return map;
          }, new Map<string, number>())
        );
        return dedupedByCode.map(([label, count]) => `${label} (${count})`).join(', ');
      };

      const response: EligibleCountActionResponse | null = await fetchEligibleCountClient(payload);
      if (response) {
        if (response.error) {
          toast.error(response.error);
          setEligibleCount(0);
          setIsValidated(false);
          return;
        }

        if (effectiveScope === 'property' && (!response.total || response.total === 0)) {
          toast.error(t('messages.invalidPropertySearch', { fallback: 'Please enter valid UPIC ID/Mobile No' }));
          setEligibleCount(0);
          setIsValidated(false);
          return;
        }

        setEligibleCount(response.eligible ?? 0);
        if (response.skipped !== undefined && response.skipped > 0) {
          toast.info(buildSkipReasonMessage(response.skipped, response.skipReasons));
        }
        if (response.alreadyTaxed !== undefined && response.alreadyTaxed > 0) {
          const alreadyTaxedCount = response.alreadyTaxed;
          confirm({
            variant: 'warning',
            title: t('confirmations.overrideAlreadyTaxed.title'),
            description: t('messages.alreadyTaxedCount', { count: alreadyTaxedCount }),
            confirmText: t('confirmations.overrideAlreadyTaxed.confirmText'),
            onConfirm: async () => {
              try {
                const overrideResponse: EligibleCountActionResponse | null = await fetchEligibleCountClient({
                  ...payload,
                  scope: { ...payload.scope, overrideAlreadyTaxed: true },
                });
                if (overrideResponse?.error) {
                  toast.error(overrideResponse.error);
                  setIsValidated(false);
                  return;
                }
                setEligibleCount(overrideResponse?.eligible ?? 0);
                setOverrideAlreadyTaxed(true);
                if (overrideResponse?.skipped !== undefined && overrideResponse.skipped > 0) {
                  toast.info(buildSkipReasonMessage(overrideResponse.skipped, overrideResponse.skipReasons));
                }
              } catch (error) {
                logger.error('Failed to recalculate eligible count after override', { error: error as Error });
                toast.error(t('messages.recalculateFailed', { fallback: 'Failed to recalculate eligible properties' }));
                setIsValidated(false);
              }
            },
          });
        }
      } else {
        setEligibleCount(0);
      }
      setIsValidated(true);
    } catch (error) {
      logger.error('Failed to calculate eligible count', { error: error as Error });
      setEligibleCount(0);
      setIsValidated(false);
    } finally {
      setIsCalculating(false);
    }
  };

  const executeJob = async (isScheduled: boolean, scheduledDateTime?: string, overrideScope?: Scope | string, forceRecalculate?: boolean) => {
    const effectiveScope = (typeof overrideScope === 'string' && overrideScope ? overrideScope : selectedScope) as Scope;
    setIsCalculating(true);
    try {
      const zoneVals = getSelectedValues('zone');
      let zoneIds = zoneVals.length > 0 ? zoneVals.map(Number) : (searchParams.get('zoneid')?.split(',').map(Number) || []);
      const wardVals = getSelectedValues('ward');
      const wardIds = wardVals.length > 0 ? wardVals.map(Number) : (searchParams.get('wardid')?.split(',').map(Number) || []);

      if (zoneIds.length === 0 && wardIds.length > 0) {
        const parentZoneIds = wardIds.map(id => {
          const w = fetchedWards.find(x => x.value === String(id));
          return w ? Number(w.zoneId) : null;
        }).filter(Boolean) as number[];
        zoneIds = Array.from(new Set(parentZoneIds));
      }

      const propertyTypeIdVal = getSelectedValues('property type');
      const propertyTypeIds = (propertyTypeIdVal.length > 0 ? propertyTypeIdVal : (searchParams.get('PropertyTypeId')?.split(',') || [])).filter(x => x !== 'select-all').map(Number);

      const assessmentStatusVal = getSelectedValues('assessment status');
      const assessmentStatusIds = (assessmentStatusVal.length > 0 ? assessmentStatusVal : (searchParams.get('assessmentStatusIds')?.split(',') || [])).map(Number);

      const scopeData: OperationScope = {};
      if (effectiveScope === 'zone') {
        scopeData.zoneIds = zoneIds;
      } else if (effectiveScope === 'ward') {
        scopeData.zoneIds = zoneIds;
        scopeData.wardIds = wardIds;
      } else if (selectedScope === 'building') {
        scopeData.zoneIds = zoneIds;
        scopeData.wardIds = wardIds;
        const propIdVal = getSelectedJoined('property no') || getSelectedJoined('building') || searchParams.get('propertyid');
        const propNoVal = (fetchedBuildings.find(b => b.value === (getSelectedValues('property no')[0] || getSelectedValues('building')[0] || searchParams.get('propertyid')?.split(',')[0]))?.propertyNo || searchParams.get('propertyno') || '');
        const buildingScope = resolveBuildingScope(
          propIdVal,
          propNoVal,
          fetchedBuildings
        );
        scopeData.propertyIds = buildingScope.propertyIds;
        if (buildingScope.building) scopeData.building = buildingScope.building;
      } else if (effectiveScope === 'property') {
        scopeData.propertyIds = [];
        const propertyIdsStr = getSelectedJoined('property no') || getSelectedJoined('building') || searchParams.get('propertyid');
        if (propertyIdsStr) {
          scopeData.propertyIds = propertyIdsStr.split(',').map(Number).filter(Number.isFinite);
        }
        const searchText = getSelectedJoined('search') || searchParams.get('searchText') || searchParams.get('SearchText');
        if (searchText) {
          scopeData.searchText = searchText;
        } else {
          scopeData.searchText = '';
        }
      } else if (effectiveScope === 'range') {
        scopeData.wardIds = wardIds;
        const fromPropId = getSelectedJoined('from') || searchParams.get('fromPropertyId');
        if (fromPropId) scopeData.fromPropertyId = Number(fromPropId);
        const toPropId = getSelectedJoined('to') || searchParams.get('toPropertyId');
        if (toPropId) scopeData.toPropertyId = Number(toPropId);

        // Keep propertyIds as well in case the backend still relies on it
        const rangeIds = [scopeData.fromPropertyId, scopeData.toPropertyId].filter(
          (v): v is number => typeof v === 'number' && Number.isFinite(v)
        );
        if (rangeIds.length > 0) scopeData.propertyIds = rangeIds;

        const fromPropNo = (fetchedBuildings.find(b => b.value === fromPropId)?.label) || searchParams.get('fromPropertyNo') || fromPropId;
        if (fromPropNo) scopeData.fromPropertyNo = fromPropNo;
        const toPropNo = (fetchedToBuildings.find(b => b.value === toPropId)?.label) || searchParams.get('toPropertyNo') || toPropId;
        if (toPropNo) scopeData.toPropertyNo = toPropNo;
      }

      if (propertyTypeIds.length > 0) {
        scopeData.propertyTypeId = propertyTypeIds[0];
        scopeData.propertyTypeIds = propertyTypeIds;
      }
      if (assessmentStatusIds.length > 0) {
        scopeData.assessmentStatusIds = assessmentStatusIds;
      }
      if (overrideAlreadyTaxed || effectiveScope === 'masterDataChange' || String(effectiveScope).toLowerCase() === 'masterdatachange') {
        scopeData.overrideAlreadyTaxed = true;
      }
      if (forceRecalculate) {
        scopeData.forceRecalculate = true;
      }

      const currentFy = getFyFromParams();
      if (!currentFy) {
        throw new Error('financeYearId is required for preview export');
      }
      const financeYearId = Number(currentFy);

      let adjustedScheduledDateTime = scheduledDateTime;
      if (isScheduled && scheduledDateTime) {
        const clientRequestTime = Date.now();
        const serverTimeStr = await fetchServerTimeClient();
        if (serverTimeStr) {
          const oneWayLatency = (Date.now() - clientRequestTime) / 2;
          const serverTime = new Date(new Date(serverTimeStr).getTime() + oneWayLatency);
          const clientTime = new Date();
          const skewMs = clientTime.getTime() - serverTime.getTime();
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('ntis_clock_skew_ms', String(skewMs));
          }

          const originalScheduledDate = new Date(scheduledDateTime);
          const adjustedDate = new Date(originalScheduledDate.getTime() - skewMs);
          adjustedScheduledDateTime = adjustedDate.toISOString();
        }
      }

      const payload: ExecuteOperationPayload = {
        financeYearId,
        operation: 'addTax',
        scopeType: effectiveScope,
        scope: scopeData,
        options: {
          previewBeforeExecute: true,
          isScheduled,
          ...(adjustedScheduledDateTime ? { scheduledDateTime: adjustedScheduledDateTime } : {})
        }
      };

      const response: ExecuteOperationActionResponse | null = await executeOperationClient(payload);
      if (response && response.items && response.items.jobId) {
        setIsModalOpen(false);
        setIsValidated(false);
        setEligibleCount(null);
        setOverrideAlreadyTaxed(false);
        setActiveMasterDataScope(undefined);
        if (isScheduled) {
          toast.success(t('messages.jobScheduled', { jobId: response.items.jobId }));
          if (onStartExecution) {
            onStartExecution(response.items.jobId, response.items.summary.total, scheduledDateTime);
          }
        } else {
          toast.success(t('messages.executionStarted', { jobId: response.items.jobId }));
          if (onStartExecution) {
            onStartExecution(response.items.jobId, response.items.summary.total);
          }
        }
      } else {
        toast.error(response?.error || t('messages.failedExecute'));
      }
    } catch (e) {
      logger.error('Failed to execute operation', { error: e as Error });
      toast.error(t('messages.errorExecution'));
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePreview = async (targetPage?: number, targetPageSize?: number, overrideScope?: Scope | string) => {
    const effectiveScope = (typeof overrideScope === 'string' && overrideScope ? overrideScope : selectedScope) as Scope;
    setIsPreviewLoading(true);
    try {
      const p = typeof targetPage === 'number' && Number.isFinite(targetPage) ? targetPage : 1;
      const size = typeof targetPageSize === 'number' && Number.isFinite(targetPageSize) ? targetPageSize : (previewPageSize || 5);

      setPreviewPage(p);
      setPreviewPageSize(size);

      const zoneVals = getSelectedValues('zone');
      let zoneIds = zoneVals.length > 0 ? zoneVals.map(Number) : (searchParams.get('zoneid')?.split(',').map(Number) || []);
      const wardVals = getSelectedValues('ward');
      const wardIds = wardVals.length > 0 ? wardVals.map(Number) : (searchParams.get('wardid')?.split(',').map(Number) || []);

      if (zoneIds.length === 0 && wardIds.length > 0) {
        const parentZoneIds = wardIds.map(id => {
          const w = fetchedWards.find(x => x.value === String(id));
          return w ? Number(w.zoneId) : null;
        }).filter(Boolean) as number[];
        zoneIds = Array.from(new Set(parentZoneIds));
      }
      const propertyTypeIdVal = getSelectedValues('property type');
      const propertyTypeIds = (propertyTypeIdVal.length > 0 ? propertyTypeIdVal : (searchParams.get('PropertyTypeId')?.split(',') || [])).filter(x => x !== 'select-all').map(Number);

      const assessmentStatusVal = getSelectedValues('assessment status');
      const assessmentStatusIds = (assessmentStatusVal.length > 0 ? assessmentStatusVal : (searchParams.get('assessmentStatusIds')?.split(',') || [])).map(Number);

      const scopeData: OperationScope = {};
      if (propertyTypeIds.length > 0) {
        scopeData.propertyTypeId = propertyTypeIds[0];
        scopeData.propertyTypeIds = propertyTypeIds;
      }
      if (assessmentStatusIds.length > 0) {
        scopeData.assessmentStatusIds = assessmentStatusIds;
      }

      if (effectiveScope === 'zone') {
        scopeData.zoneIds = zoneIds;
      } else if (effectiveScope === 'ward') {
        scopeData.zoneIds = zoneIds;
        scopeData.wardIds = wardIds;
      } else if (effectiveScope === 'building') {
        scopeData.zoneIds = zoneIds;
        scopeData.wardIds = wardIds;
        const propIdVal = getSelectedJoined('property no') || getSelectedJoined('building') || searchParams.get('propertyid');
        const propNoVal = (fetchedBuildings.find(b => b.value === (getSelectedValues('property no')[0] || getSelectedValues('building')[0] || searchParams.get('propertyid')?.split(',')[0]))?.propertyNo || searchParams.get('propertyno') || '');
        const buildingScope = resolveBuildingScope(
          propIdVal,
          propNoVal,
          fetchedBuildings
        );
        scopeData.propertyIds = buildingScope.propertyIds;
        if (buildingScope.building) scopeData.building = buildingScope.building;
      } else if (effectiveScope === 'property') {
        scopeData.propertyIds = [];
        const rawText = (selectionData['Search Property'] || [])[0] || getSelectedJoined('property no') || getSelectedJoined('building') || searchParams.get('propertyid') || '';
        if (rawText && !/^\d{1,8}$/.test(rawText)) {
          scopeData.searchText = rawText;
        } else if (rawText) {
          scopeData.propertyIds = [Number(rawText)];
          scopeData.searchText = '';
        } else {
          scopeData.searchText = '';
        }
      } else if (effectiveScope === 'range') {
        scopeData.wardIds = wardIds;
        const fromPropId = getSelectedJoined('from') || searchParams.get('fromPropertyId');
        if (fromPropId) scopeData.fromPropertyId = Number(fromPropId);
        const toPropId = getSelectedJoined('to') || searchParams.get('toPropertyId');
        if (toPropId) scopeData.toPropertyId = Number(toPropId);

        // Keep propertyIds as well in case the backend still relies on it
        const rangeIds = [scopeData.fromPropertyId, scopeData.toPropertyId].filter(
          (v): v is number => typeof v === 'number' && Number.isFinite(v)
        );
        if (rangeIds.length > 0) scopeData.propertyIds = rangeIds;

        const fromPropNo = (fetchedBuildings.find(b => b.value === fromPropId)?.label) || searchParams.get('fromPropertyNo') || fromPropId;
        if (fromPropNo) scopeData.fromPropertyNo = fromPropNo;
        const toPropNo = (fetchedToBuildings.find(b => b.value === toPropId)?.label) || searchParams.get('toPropertyNo') || toPropId;
        if (toPropNo) scopeData.toPropertyNo = toPropNo;
      }

      const financeYearId = getFyFromParams();

      const payload: OperationPreviewPayload = {
        pageNumber: p,
        pageSize: size,
        searchTerm: '',
        sortBy: '',
        sortOrder: '',
        filterLogic: 0,
        financeYearId: Number(financeYearId),
        scopeType: effectiveScope,
        scope: scopeData,
        operation: 'addTax'
      };

      const result = await previewOperationClient(payload);
      if (result && 'records' in result) {
        setPreviewData(result);
        setIsPreviewModalOpen(true);
      } else {
        toast.error(result?.error || t('messages.failedPreview'));
      }
    } catch (e) {
      logger.error('Failed to preview operation', { error: e as Error });
      toast.error(t('messages.errorPreview'));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const [isExportingPreview, setIsExportingPreview] = useState<{
    all: boolean;
    eligible: boolean;
    skipped: boolean;
  }>({
    all: false,
    eligible: false,
    skipped: false
  });

  const handleDownloadPreviewExport = async (downloadType: 'all' | 'eligible' | 'skipped', overrideScope?: Scope | string) => {
    const effectiveScope = (typeof overrideScope === 'string' && overrideScope ? overrideScope : selectedScope) as Scope;

    setIsExportingPreview(prev => ({ ...prev, [downloadType]: true }));
    const loadingToast = toast.loading(t('messages.previewExportInProgress', { downloadType }));
    try {
      const zoneVals = getSelectedValues('zone');
      let zoneIds = zoneVals.length > 0 ? zoneVals.map(Number) : (searchParams.get('zoneid')?.split(',').map(Number) || []);
      const wardVals = getSelectedValues('ward');
      const wardIds = wardVals.length > 0 ? wardVals.map(Number) : (searchParams.get('wardid')?.split(',').map(Number) || []);

      if (zoneIds.length === 0 && wardIds.length > 0) {
        const parentZoneIds = wardIds.map(id => {
          const w = fetchedWards.find(x => x.value === String(id));
          return w ? Number(w.zoneId) : null;
        }).filter(Boolean) as number[];
        zoneIds = Array.from(new Set(parentZoneIds));
      }
      const propertyTypeIdVal = getSelectedValues('property type');
      const propertyTypeIds = (propertyTypeIdVal.length > 0 ? propertyTypeIdVal : (searchParams.get('PropertyTypeId')?.split(',') || [])).filter(x => x !== 'select-all').map(Number);

      const assessmentStatusVal = getSelectedValues('assessment status');
      const assessmentStatusIds = (assessmentStatusVal.length > 0 ? assessmentStatusVal : (searchParams.get('assessmentStatusIds')?.split(',') || [])).map(Number);

      const scopeData: OperationScope = {};
      if (propertyTypeIds.length > 0) {
        scopeData.propertyTypeId = propertyTypeIds[0];
        scopeData.propertyTypeIds = propertyTypeIds;
      }
      if (assessmentStatusIds.length > 0) {
        scopeData.assessmentStatusIds = assessmentStatusIds;
      }

      if (effectiveScope === 'zone') {
        scopeData.zoneIds = zoneIds;
      } else if (selectedScope === 'ward') {
        scopeData.zoneIds = zoneIds;
        scopeData.wardIds = wardIds;
      } else if (effectiveScope === 'building') {
        scopeData.zoneIds = zoneIds;
        scopeData.wardIds = wardIds;
        const propIdVal = getSelectedJoined('property no') || getSelectedJoined('building') || searchParams.get('propertyid');
        const propNoVal = (fetchedBuildings.find(b => b.value === (getSelectedValues('property no')[0] || getSelectedValues('building')[0] || searchParams.get('propertyid')?.split(',')[0]))?.propertyNo || searchParams.get('propertyno') || '');
        const buildingScope = resolveBuildingScope(
          propIdVal,
          propNoVal,
          fetchedBuildings
        );
        scopeData.propertyIds = buildingScope.propertyIds;
        if (buildingScope.building) scopeData.building = buildingScope.building;
      } else if (effectiveScope === 'property') {
        scopeData.propertyIds = [];
        const rawText = (selectionData['Search Property'] || [])[0] || getSelectedJoined('property no') || getSelectedJoined('building') || searchParams.get('propertyid') || '';
        if (rawText && !/^\d{1,8}$/.test(rawText)) {
          scopeData.searchText = rawText;
        } else if (rawText) {
          scopeData.propertyIds = [Number(rawText)];
          scopeData.searchText = '';
        } else {
          scopeData.searchText = '';
        }
      } else if (effectiveScope === 'range') {
        scopeData.wardIds = wardIds;
        const fromPropId = getSelectedJoined('from') || searchParams.get('fromPropertyId');
        if (fromPropId) scopeData.fromPropertyId = Number(fromPropId);
        const toPropId = getSelectedJoined('to') || searchParams.get('toPropertyId');
        if (toPropId) scopeData.toPropertyId = Number(toPropId);

        // Keep propertyIds as well in case the backend still relies on it
        const rangeIds = [scopeData.fromPropertyId, scopeData.toPropertyId].filter(
          (v): v is number => typeof v === 'number' && Number.isFinite(v)
        );
        if (rangeIds.length > 0) scopeData.propertyIds = rangeIds;

        const fromPropNo = (fetchedBuildings.find(b => b.value === fromPropId)?.label) || searchParams.get('fromPropertyNo') || fromPropId;
        if (fromPropNo) scopeData.fromPropertyNo = fromPropNo;
        const toPropNo = (fetchedToBuildings.find(b => b.value === toPropId)?.label) || searchParams.get('toPropertyNo') || toPropId;
        if (toPropNo) scopeData.toPropertyNo = toPropNo;
      }

      const financeYearId = getFyFromParams();

      const payload = {
        financeYearId: Number(financeYearId),
        scopeType: selectedScope,
        scope: scopeData,
        operation: 'addTax'
      };

      const response = await fetch(`/api/property-tax/preview-export?downloadType=${downloadType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      let filename = `preview_${downloadType}_${selectedScope}_${new Date().toISOString().slice(0, 10)}.csv`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('messages.previewExportSuccess', { downloadType }), { id: loadingToast });
    } catch (e) {
      logger.error('Failed to download preview export', { error: e as Error });
      toast.error(t('messages.previewExportFailed'), { id: loadingToast });
    } finally {
      setIsExportingPreview(prev => ({ ...prev, [downloadType]: false }));
    }
  };



  const toBuildingOption = (b: SearchByCategoryItem): BuildingOption => {
    const part = b.partitionNo?.trim();
    const hasPart = part && part !== '0' && part !== '';
    const label = hasPart ? `${b.propertyNo}-${part}` : b.propertyNo;
    return {
      value: label,
      label: label,
      propertyNo: b.propertyNo,
      partitionNo: part || '',
      propertyId: b.propertyId
    };
  };

  const mapToDistinctBuildingOptions = (
    items: SearchByCategoryItem[],
    isBuildingScope: boolean
  ): BuildingOption[] => {
    const options: BuildingOption[] = [];
    const seenValues = new Set<string>();

    for (const b of items) {
      if (isBuildingScope) {
        const basePropNo = b.propertyNo?.trim();
        if (basePropNo && !seenValues.has(basePropNo)) {
          seenValues.add(basePropNo);
          options.push({
            value: basePropNo,
            label: basePropNo,
            propertyNo: basePropNo,
            partitionNo: '',
            propertyId: b.propertyId
          });
        }

        const part = b.partitionNo?.trim();
        const hasPart = part && part !== '0' && part !== '';
        if (hasPart) {
          const fullLabel = `${b.propertyNo}-${part}`;
          if (!seenValues.has(fullLabel)) {
            seenValues.add(fullLabel);
            options.push({
              value: fullLabel,
              label: fullLabel,
              propertyNo: b.propertyNo,
              partitionNo: part,
              propertyId: b.propertyId
            });
          }
        }
      } else {
        const opt = toBuildingOption(b);
        if (!seenValues.has(opt.value)) {
          seenValues.add(opt.value);
          options.push(opt);
        }
      }
    }

    return options;
  };

  const fetchBuildings = async (
    zoneIds: string[] | null,
    wardIds: string[],
    overrideScope?: Scope | string,
    searchTerm?: string
  ) => {
    const effectiveScope = (typeof overrideScope === 'string' && overrideScope ? overrideScope : selectedScope) as Scope;
    if (wardIds.length === 0 || isFetchingBuildings) return;
    setIsFetchingBuildings(true);
    buildingSearchRef.current = searchTerm || '';
    try {
      if (effectiveScope === 'range') {
        const res = await searchPropertiesByCategoryClient(2, wardIds[0], 1, 100, undefined, undefined, undefined, searchTerm);
        if (res?.items?.items) {
          const buildings = mapToDistinctBuildingOptions(res.items.items, false);
          setFetchedBuildings(buildings);
          setBuildingPage(1);
          const totalPages = res.items.totalPages || Math.ceil((res.items.totalCount || 0) / 100);
          setHasMoreBuildings(1 < totalPages);
        } else {
          setFetchedBuildings([]);
          setHasMoreBuildings(false);
        }
      } else if (effectiveScope === 'building') {
        const zId = zoneIds && zoneIds.length > 0 ? zoneIds[0] : null;
        const res = await searchPropertiesByCategoryClient(2, wardIds[0], 1, 100, undefined, undefined, zId || undefined, searchTerm);
        if (res?.items?.items) {
          const buildings = mapToDistinctBuildingOptions(res.items.items, true);
          setFetchedBuildings(buildings);
          setBuildingPage(1);
          const totalPages = res.items.totalPages || Math.ceil((res.items.totalCount || 0) / 100);
          setHasMoreBuildings(1 < totalPages);
        } else {
          setFetchedBuildings([]);
          setHasMoreBuildings(false);
        }
      } else {
        const zId = zoneIds && zoneIds.length > 0 ? zoneIds[0] : null;
        const res = await searchPropertiesClient(zId, wardIds[0]);
        if (res?.items?.items) {
          const buildings: BuildingOption[] = res.items.items.map((b: SearchPropertyItem) => {
            const part = b.partitionNo?.trim();
            const hasPart = part && part !== '0' && part !== '';
            const label = hasPart ? `${b.propertyNo}-${part}` : b.propertyNo;
            return {
              value: label,
              label: label,
              propertyNo: b.propertyNo,
              partitionNo: part || '',
              propertyId: b.propertyId
            };
          });
          setFetchedBuildings(buildings);
          setHasMoreBuildings(false);
        }
      }
    } catch (e) {
      logger.error('Failed to fetch buildings', { error: e as Error });
    } finally {
      setIsFetchingBuildings(false);
    }
  };

  const loadMoreBuildings = async (activeQuery?: string) => {
    // When SearchSelectPaginated triggers onLoadMore with a search query (user is typing and
    // no local matches found), do a fresh page-1 server search instead of blindly paginating.
    // This naturally stops the auto-fetch loop: once results come back the matched option is
    // found locally and filteredOptions.length > 0.
    if (activeQuery && activeQuery.trim()) {
      if (buildingSearchTimerRef.current) clearTimeout(buildingSearchTimerRef.current);
      const zoneIds = getSelectedValues('zone');
      const wardIds = getSelectedValues('ward');
      if (wardIds.length > 0) {
        void fetchBuildings(zoneIds.length > 0 ? zoneIds : null, wardIds, undefined, activeQuery.trim());
      }
      return;
    }

    // Normal "load next page" pagination (user scrolled down, no search term)
    if (!hasMoreBuildings || isLoadingMoreBuildings || isFetchingBuildings) return;
    const wardId = searchParams.get('wardid') || (selectionData['Ward / Sector'] || selectionData['Ward'])?.[0];
    if (!wardId) return;

    setIsLoadingMoreBuildings(true);
    try {
      const nextPage = buildingPage + 1;
      const category = 2;
      const zoneId = searchParams.get('zoneid') || (selectionData['Zone / Node'] || selectionData['Zone'])?.[0];
      const res = await searchPropertiesByCategoryClient(
        category,
        wardId,
        nextPage,
        100,
        undefined,
        undefined,
        selectedScope === 'building' && zoneId ? zoneId : undefined,
        buildingSearchRef.current || undefined
      );
      if (res?.items?.items) {
        const isBuilding = selectedScope === 'building';
        const newBuildings = mapToDistinctBuildingOptions(res.items.items, isBuilding);
        setFetchedBuildings(prev => {
          const existingValues = new Set(prev.map(item => item.value));
          const filtered = newBuildings.filter(item => !existingValues.has(item.value));
          return [...prev, ...filtered];
        });
        setBuildingPage(nextPage);
        const totalPages = res.items.totalPages || Math.ceil((res.items.totalCount || 0) / 100);
        setHasMoreBuildings(nextPage < totalPages);
      } else {
        setHasMoreBuildings(false);
      }
    } catch (e) {
      logger.error('Failed to load more buildings', { error: e as Error });
    } finally {
      setIsLoadingMoreBuildings(false);
    }
  };

  const fetchWards = async () => {
    if (fetchedWards.length > 0 || isFetchingWards) return;
    setIsFetchingWards(true);
    try {
      const res = await fetchWardsClient();
      if (res?.data) {
        const wards: WardOption[] = (res.data as Array<{ id: number; description?: string; wardNo?: string; zoneId?: number }>).map((w) => ({
          value: w.id.toString(),
          label: w.wardNo || '',
          zoneId: w.zoneId?.toString() ?? ''
        }));
        setFetchedWards(wards);
      }
    } catch (e) {
      logger.error('Failed to fetch wards', { error: e as Error });
    } finally {
      setIsFetchingWards(false);
    }
  };

  const fetchToBuildings = async (wardId: string, propertyFrom: string, searchTerm?: string) => {
    if (!wardId || !propertyFrom || isFetchingToBuildings) return;
    setIsFetchingToBuildings(true);
    setCurrentPropertyFrom(propertyFrom);
    toBuildingSearchRef.current = searchTerm || '';
    try {
      const res = await searchPropertiesByCategoryClient(4, wardId, 1, 100, propertyFrom, undefined, undefined, searchTerm);
      if (res?.items?.items) {
        const buildings = mapToDistinctBuildingOptions(res.items.items, false);
        setFetchedToBuildings(buildings);
        setToBuildingPage(1);
        const totalPages = res.items.totalPages || Math.ceil((res.items.totalCount || 0) / 100);
        setHasMoreToBuildings(1 < totalPages);
      } else {
        setFetchedToBuildings([]);
        setHasMoreToBuildings(false);
      }
    } catch (e) {
      logger.error('Failed to fetch to-buildings', { error: e as Error });
    } finally {
      setIsFetchingToBuildings(false);
    }
  };

  const loadMoreToBuildings = async (activeQuery?: string) => {
    // Same pattern as loadMoreBuildings: when called with a search query, do a fresh page-1
    // server search so the matched option appears in the list and the auto-fetch loop stops.
    if (activeQuery && activeQuery.trim()) {
      if (toBuildingSearchTimerRef.current) clearTimeout(toBuildingSearchTimerRef.current);
      const wardIds = getSelectedValues('ward');
      const fromKey = Object.keys(selectionData).find(k => k.toLowerCase().includes('from'));
      const fromVal = fromKey ? selectionData[fromKey]?.[0] : undefined;
      if (wardIds.length > 0 && fromVal) {
        const fromObj = fetchedBuildings.find(b => b.value === fromVal);
        const fromLabel = fromObj ? fromObj.label : fromVal;
        void fetchToBuildings(wardIds[0], fromLabel, activeQuery.trim());
      }
      return;
    }

    // Normal "load next page" pagination
    if (!hasMoreToBuildings || isLoadingMoreToBuildings || isFetchingToBuildings) return;
    const wardId = searchParams.get('wardid') || (selectionData['Ward / Sector'] || selectionData['Ward'])?.[0];
    if (!wardId || !currentPropertyFrom) return;

    setIsLoadingMoreToBuildings(true);
    try {
      const nextPage = toBuildingPage + 1;
      const res = await searchPropertiesByCategoryClient(
        4,
        wardId,
        nextPage,
        100,
        currentPropertyFrom,
        undefined,
        undefined,
        toBuildingSearchRef.current || undefined
      );
      if (res?.items?.items) {
        const newBuildings = mapToDistinctBuildingOptions(res.items.items, false);
        setFetchedToBuildings(prev => {
          const existingValues = new Set(prev.map(item => item.value));
          const filtered = newBuildings.filter(item => !existingValues.has(item.value));
          return [...prev, ...filtered];
        });
        setToBuildingPage(nextPage);
        const totalPages = res.items.totalPages || Math.ceil((res.items.totalCount || 0) / 100);
        setHasMoreToBuildings(nextPage < totalPages);
      } else {
        setHasMoreToBuildings(false);
      }
    } catch (e) {
      logger.error('Failed to load more to-buildings', { error: e as Error });
    } finally {
      setIsLoadingMoreToBuildings(false);
    }
  };

  const handleBuildingSearch = (text: string) => {
    if (buildingSearchTimerRef.current) {
      clearTimeout(buildingSearchTimerRef.current);
    }
    buildingSearchTimerRef.current = setTimeout(() => {
      const zoneIds = getSelectedValues('zone');
      const wardIds = getSelectedValues('ward');
      if (wardIds.length > 0) {
        void fetchBuildings(zoneIds.length > 0 ? zoneIds : null, wardIds, undefined, text.trim());
      }
    }, 300);
  };

  const handleToBuildingSearch = (text: string) => {
    if (toBuildingSearchTimerRef.current) {
      clearTimeout(toBuildingSearchTimerRef.current);
    }
    toBuildingSearchTimerRef.current = setTimeout(() => {
      const wardIds = getSelectedValues('ward');
      const fromKey = Object.keys(selectionData).find(k => k.toLowerCase().includes('from'));
      const fromVal = fromKey ? selectionData[fromKey]?.[0] : undefined;
      if (wardIds.length > 0 && fromVal) {
        const fromObj = fetchedBuildings.find(b => b.value === fromVal);
        const fromLabel = fromObj ? fromObj.label : fromVal;
        void fetchToBuildings(wardIds[0], fromLabel, text.trim());
      }
    }, 300);
  };

  useEffect(() => {
    // Eagerly fetch options for pre-selected values from URL. Zone/Property Type/Assessment
    // Status are server-prefetched (page.tsx) now, so only Ward/Building/To-Building still need
    // this on-demand resolution for a pre-selected URL value.
    const timer = setTimeout(() => {
      const hasWards = Object.keys(selectionData).some(k => k.toLowerCase().includes('ward') && selectionData[k]?.length > 0);
      const hasBuildings = Object.keys(selectionData).some(k => k.toLowerCase().includes('building') && selectionData[k]?.length > 0);
      const hasFrom = Object.keys(selectionData).some(k => k.toLowerCase().includes('from') && selectionData[k]?.length > 0);
      const hasTo = Object.keys(selectionData).some(k => k.toLowerCase().includes('to') && selectionData[k]?.length > 0);

      if (hasWards && fetchedWards.length === 0 && !isFetchingWards) {
        void fetchWards();
      }

      if ((hasBuildings || hasFrom) && fetchedBuildings.length === 0 && !isFetchingBuildings) {
        const zoneIds = getSelectedJoined('zone');
        const wardIds = getSelectedJoined('ward');
        if (wardIds) {
          void fetchBuildings(zoneIds ? zoneIds.split(',') : null, wardIds.split(','));
        }
      }

      if (hasTo && fetchedToBuildings.length === 0 && !isFetchingToBuildings) {
        const wardIds = getSelectedJoined('ward');
        const fromKey = Object.keys(selectionData).find(k => k.toLowerCase().includes('from'));
        const fromVal = fromKey ? selectionData[fromKey]?.[0] : undefined;
        if (wardIds && fromVal) {
          const fromObj = fetchedBuildings.find(b => b.value === fromVal);
          const fromLabel = fromObj ? fromObj.label : fromVal;
          void fetchToBuildings(wardIds.split(',')[0], fromLabel);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionData, fetchedWards.length, isFetchingWards, fetchedBuildings.length, isFetchingBuildings, fetchedToBuildings.length, isFetchingToBuildings]);

  return {
    isValidated, setIsValidated,
    isModalOpen, setIsModalOpen,
    isCalculating, setIsCalculating,
    eligibleCount, setEligibleCount,
    fetchedWards, fetchWards,
    fetchedBuildings, fetchBuildings,
    hasMoreBuildings, loadMoreBuildings, isLoadingMoreBuildings, isFetchingBuildings,
    fetchedToBuildings, hasMoreToBuildings, loadMoreToBuildings, isLoadingMoreToBuildings, isFetchingToBuildings, fetchToBuildings,
    handleBuildingSearch, handleToBuildingSearch,
    handleCalculateEligible,
    executeJob,
    isPreviewModalOpen, setIsPreviewModalOpen,
    previewData, setPreviewData,
    isPreviewLoading,
    handlePreview,
    previewPage, setPreviewPage,
    previewPageSize, setPreviewPageSize,
    isExportingPreview, handleDownloadPreviewExport,
    isProceedDisabled,
    activeMasterDataScope
  };
}
