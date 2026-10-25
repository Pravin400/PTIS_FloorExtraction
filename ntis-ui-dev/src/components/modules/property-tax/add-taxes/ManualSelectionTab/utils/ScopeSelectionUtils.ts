/* eslint-disable @typescript-eslint/no-explicit-any */
import { Scope, ScopeOptionItem, ScopeItem } from '@/types/addTaxes.types';
import type { WardItem } from '@/types/wardMaster.types';

export interface ScopeSelectionPanelProps {
  scopes: ScopeItem[];
  selectedScope: Scope;
  handleScopeChange: (s: Scope) => void;
  selectionData: Record<string, string[]>;
  handleSelectionChange: (key: string, values: string[], labels?: string[]) => void;
  scopeOptions: ScopeOptionItem[];
  zoneOptions?: { value: string; label: string }[];
  propertyTypeOptions?: { value: string; label: string }[];
  // Server-prefetched (page.tsx) — Zone/Property Type/Assessment Status/Wards don't depend on any other selection.
  initialZones?: { value: string; label: string }[];
  initialPropertyTypes?: { value: string; label: string }[];
  initialAssessmentStatuses?: { value: string; label: string }[];
  initialWards?: WardItem[];
  onStartExecution?: (jobId: string, totalCount: number, scheduledTime?: string) => void;
  isInitialized: boolean;
  onPreview?: () => Promise<void>;
  isPreviewLoading?: boolean;
  financeYear?: string;
  financeYearId?: string | number;
  onBindMasterDataRecalc?: (fn: (scope?: Scope | string) => Promise<void> | void) => void;
  onProceedDisabledChange?: (disabled: boolean) => void;
}

export const getFieldConfig = (
  option: string,
  zoneOptions: { value: string; label: string }[],
  selectionData: Record<string, string[]>,
  allWards: { value: string; label: string; zoneId: string }[],
  fetchWards: () => void,
  propertyTypeOptions: { value: string; label: string }[],
  fetchBuildings: (zones: string[] | null, wards: string[]) => void,
  fetchedBuildings: { value: string; label: string }[],
  hasZoneField: boolean,
  hasWardField: boolean,
  t: any,
  assessmentStatusOptions?: { value: string; label: string }[],
  fetchAssessmentStatuses?: () => void,
  selectedScope?: Scope,
  buildingPagination?: {
    hasMore?: boolean;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    isFetching?: boolean;
  },
  toBuildingPagination?: {
    hasMore?: boolean;
    onLoadMore?: () => void;
    isLoadingMore?: boolean;
    isFetching?: boolean;
  },
  fetchedToBuildings?: { value: string; label: string }[],
  fetchZones?: () => void,
  fetchPropertyTypes?: () => void,
  fetchToBuildings?: (wardId: string, propertyFrom: string) => void,
  onBuildingSearch?: (text: string) => void,
  onToBuildingSearch?: (text: string) => void
) => {
  const opt = option.toLowerCase();
  if (opt.includes('assessment status')) {
    return {
      label: t('dynamicFields.labels.assessmentStatus', { fallback: 'Assessment Status' }),
      placeholder: t('dynamicFields.placeholders.selectAssessmentStatus', { fallback: 'Select assessment status' }),
      required: true,
      inputType: 'multiselect',
      fallbackOptions: assessmentStatusOptions || [],
      onOpen: fetchAssessmentStatuses
    };
  }

  if (opt.includes('zone')) return { label: t('dynamicFields.labels.zoneNode'), placeholder: t('dynamicFields.placeholders.selectZoneNode'), required: true, inputType: selectedScope === 'building' ? 'searchselect' : 'multiselect', fallbackOptions: zoneOptions, onOpen: fetchZones };

  if (opt.includes('ward')) {
    let selectedZoneIds: string[] = [];
    for (const key in selectionData) {
      if (key.toLowerCase().includes('zone') && selectionData[key]) {
        selectedZoneIds = [...selectedZoneIds, ...selectionData[key]];
      }
    }

    let filteredWards = allWards;
    if (selectedZoneIds.length > 0) {
      filteredWards = allWards.filter(w => selectedZoneIds.includes(w.zoneId));
    }

    const disabled = hasZoneField && selectedZoneIds.length === 0;

    return {
      label: t('dynamicFields.labels.wardSector'),
      placeholder: t('dynamicFields.placeholders.selectWardSector'),
      required: true,
      inputType: selectedScope === 'building' || selectedScope === 'range' ? 'searchselect' : 'multiselect',
      fallbackOptions: filteredWards,
      disabled: disabled,
      onOpen: fetchWards
    };
  }

  if (opt.includes('property type')) {
    let selectedZoneIds: string[] = [];
    let selectedWardIds: string[] = [];
    for (const key in selectionData) {
      if (key.toLowerCase().includes('zone') && selectionData[key]) {
        selectedZoneIds = [...selectedZoneIds, ...selectionData[key]];
      }
      if (key.toLowerCase().includes('ward') && selectionData[key]) {
        selectedWardIds = [...selectedWardIds, ...selectionData[key]];
      }
    }

    let disabled = false;
    if (hasZoneField && selectedZoneIds.length === 0) {
      disabled = true;
    }
    if (hasWardField && selectedWardIds.length === 0) {
      disabled = true;
    }

    return {
      label: t('dynamicFields.labels.propertyType'),
      placeholder: t('dynamicFields.placeholders.selectPropertyType'),
      required: true,
      inputType: 'multiselect',
      fallbackOptions: propertyTypeOptions,
      disabled: disabled,
      onOpen: fetchPropertyTypes
    };
  }

  if (opt.includes('property no') || opt.includes('building')) {
    let selectedZoneIds: string[] = [];
    let selectedWardIds: string[] = [];
    for (const key in selectionData) {
      if (key.toLowerCase().includes('zone') && selectionData[key]) {
        selectedZoneIds = [...selectedZoneIds, ...selectionData[key]];
      }
      if (key.toLowerCase().includes('ward') && selectionData[key]) {
        selectedWardIds = [...selectedWardIds, ...selectionData[key]];
      }
    }
    const disabled = (hasZoneField && selectedZoneIds.length === 0) || selectedWardIds.length === 0;

    if (selectedScope === 'building') {
      return {
        label: t('dynamicFields.labels.building'),
        placeholder: disabled ? t('dynamicFields.placeholders.noOptionsAvailable') : t('dynamicFields.placeholders.selectBuilding'),
        required: true,
        inputType: 'searchselectpaginated',
        fallbackOptions: disabled ? [] : fetchedBuildings,
        disabled: disabled,
        onOpen: () => fetchBuildings(selectedZoneIds.length > 0 ? selectedZoneIds : null, selectedWardIds),
        hasMore: disabled ? false : buildingPagination?.hasMore,
        onLoadMore: disabled ? undefined : buildingPagination?.onLoadMore,
        isLoadingMore: disabled ? false : buildingPagination?.isLoadingMore,
        isLoading: disabled ? false : buildingPagination?.isFetching,
        onSearchChange: disabled ? undefined : onBuildingSearch
      };
    }

    return {
      label: t('dynamicFields.labels.building'),
      placeholder: t('dynamicFields.placeholders.selectBuilding'),
      required: true,
      inputType: 'multiselect',
      fallbackOptions: disabled ? [] : fetchedBuildings,
      disabled: disabled,
      onOpen: () => fetchBuildings(selectedZoneIds.length > 0 ? selectedZoneIds : null, selectedWardIds)
    };
  }

  if (opt.includes('search') || opt.includes('specific')) return { label: t('dynamicFields.labels.searchProperty'), placeholder: t('dynamicFields.placeholders.searchByUPIC'), required: true, inputType: 'text', fallbackOptions: [] };
  if (opt.includes('from') || opt.includes('to')) {
    const isTo = opt.includes('to');
    let selectedWardIds: string[] = [];
    for (const key in selectionData) {
      if (key.toLowerCase().includes('ward') && selectionData[key]) {
        selectedWardIds = [...selectedWardIds, ...selectionData[key]];
      }
    }
    const disabled = selectedWardIds.length === 0;
    const optionsToUse = isTo && fetchedToBuildings && fetchedToBuildings.length > 0 ? fetchedToBuildings : fetchedBuildings;
    const paginationToUse = isTo && toBuildingPagination ? toBuildingPagination : buildingPagination;
    const onSearchChangeToUse = isTo ? onToBuildingSearch : onBuildingSearch;

    return {
      label: isTo ? t('dynamicFields.labels.toPropertyNo') : t('dynamicFields.labels.fromPropertyNo'),
      placeholder: disabled ? t('dynamicFields.placeholders.noOptionsAvailable') : t('dynamicFields.placeholders.selectPropertyNo'),
      required: true,
      inputType: 'searchselectpaginated',
      fallbackOptions: disabled ? [] : optionsToUse,
      disabled: disabled,
      onOpen: () => {
        if (isTo) {
          // Only fetch "to" buildings if "from" property is already selected
          const fromKey = Object.keys(selectionData).find(k => k.toLowerCase().includes('from'));
          const fromVal = fromKey ? selectionData[fromKey]?.[0] : undefined;
          if (fromVal && fetchToBuildings && selectedWardIds.length > 0) {
            const fromObj = fetchedBuildings.find(b => b.value === fromVal);
            const fromLabel = fromObj ? fromObj.label : fromVal;
            fetchToBuildings(selectedWardIds[0], fromLabel);
          }
        } else {
          // Fetch "from" buildings only if not already fetched
          if (fetchedBuildings.length === 0 && !buildingPagination?.isFetching && fetchBuildings) {
            fetchBuildings(null, selectedWardIds);
          }
        }
      },
      hasMore: disabled ? false : paginationToUse?.hasMore,
      onLoadMore: disabled ? undefined : paginationToUse?.onLoadMore,
      isLoadingMore: disabled ? false : paginationToUse?.isLoadingMore,
      isLoading: disabled ? false : paginationToUse?.isFetching,
      onSearchChange: disabled ? undefined : onSearchChangeToUse
    };
  }
  const fallbackLabelKey = `dynamicFields.labels.${opt}`;
  const fallbackPlaceholderKey = `dynamicFields.placeholders.select${opt.charAt(0).toUpperCase() + opt.slice(1)}`;
  return {
    label: t.has(fallbackLabelKey) ? t(fallbackLabelKey) : option,
    placeholder: t.has(fallbackPlaceholderKey) ? t(fallbackPlaceholderKey) : `Select ${option.toLowerCase()}`,
    required: false,
    inputType: 'text',
    fallbackOptions: []
  };
};

export const getHeaderTitle = (scope: Scope, displayName: string, options: string[], t: any) => {
  if (scope === 'property') return t('dynamicFields.headerTitle.property');
  if (scope === 'range') return t('dynamicFields.headerTitle.range');
  const localizedOptions = options.map(opt => {
    const cleanOpt = opt.toLowerCase();
    if (cleanOpt.includes('zone')) return t('dynamicFields.labels.zoneNode').toUpperCase();
    if (cleanOpt.includes('ward')) return t('dynamicFields.labels.wardSector').toUpperCase();
    if (cleanOpt.includes('property type')) return t('dynamicFields.labels.propertyType').toUpperCase();
    if (cleanOpt.includes('building') || cleanOpt.includes('property no')) return t('dynamicFields.labels.building').toUpperCase();
    if (cleanOpt.includes('assessment status')) return t('dynamicFields.labels.assessmentStatus').toUpperCase();
    return opt.toUpperCase();
  }).join(', ');

  const scopeKey = scope === 'all' ? 'allProperties' : scope === 'zone' ? 'zoneNode' : scope === 'ward' ? 'wardSector' : scope === 'building' ? 'buildingWise' : scope;
  const titleKey = `scopeSelection.scopes.${scopeKey}`;
  const scopeDisplayName = t.has(titleKey) ? t(titleKey) : displayName;
  const selectLabel = t.has('dynamicFields.headerTitle.select') ? t('dynamicFields.headerTitle.select').toUpperCase() : 'SELECT';
  return `${scopeDisplayName.toUpperCase()} — ${selectLabel} ${localizedOptions}`;
};
