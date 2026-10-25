import React from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm, type SearchSelectOption } from '@/components/common';

import {
  fetchDataEntrySameAsAction,
  applyDataEntrySameAsAction,
  getPropertyBasicDetailsAction,
  clearDataEntrySameAsCache,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';
import { updatePropertyBasicDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Property/action';
import type { SelectableProperty } from '@/types/floor-details.types';
import { getWardListAction } from '@/app/[locale]/property-tax/ptis/actions';
import {
  DATA_ENTRY_SAME_AS_FILTER_TYPES,
  normalizePartitionNo,
  getDataEntrySameAsType,
} from '../components/sameAsUtils';

function comparePartitionNo(a: SelectableProperty, b: SelectableProperty): number {
  return String(a.partitionNo ?? '').localeCompare(String(b.partitionNo ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

interface UseDataEntrySameAsProps {
  isOpen: boolean;
  wardId?: string | number;
  propertyNo?: string;
  partitionNo?: string;
  initialPropertyID?: string | number;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  initialTab?: string;
  /** Category name from PropertyCategoryMaster (e.g. "Individual", "Apartment") — passed to API as CategoryName filter */
  categoryName?: string;
}

export function useDataEntrySameAs({
  isOpen,
  wardId,
  propertyNo,
  partitionNo,
  initialPropertyID,
  t,
  initialTab,
  categoryName,
}: UseDataEntrySameAsProps) {
  const routeParams = useParams();
  const locale = String(routeParams?.locale || 'en');
  const { confirm } = useConfirm();

  const currentPropertyId = React.useMemo(() => {
    return initialPropertyID ? Number(initialPropertyID) : undefined;
  }, [initialPropertyID]);

  const [dataEntrySameAsTab, setDataEntrySameAsTab] = React.useState(initialTab || 'type-wise');
  const [selectableProperties, setSelectableProperties] = React.useState<SelectableProperty[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = React.useState<Set<string | number>>(
    new Set()
  );
  const [isLoadingProperties, setIsLoadingProperties] = React.useState(false);
  const [isApplyingSameAs, setIsApplyingSameAs] = React.useState(false);
  const [isApplyingTypeSubmission, setIsApplyingTypeSubmission] = React.useState(false);
  const [searchWardId, setSearchWardId] = React.useState(wardId ? String(wardId) : '');
  const [searchPropertyNo, setSearchPropertyNo] = React.useState(propertyNo || '');
  const [wardOptions, setWardOptions] = React.useState<SearchSelectOption[]>([]);
  const [isFetchingWards, setIsFetchingWards] = React.useState(false);
  const [changeTypeInput, setChangeTypeInput] = React.useState<string>('');
  const initializedRequestRef = React.useRef<string | null>(null);
  const wardsLoadedRef = React.useRef(false);
  const wardsRequestRef = React.useRef<Promise<void> | null>(null);
  const preloadedPropertiesRef = React.useRef<{
    key: string;
    request: Promise<SelectableProperty[]>;
    data?: SelectableProperty[];
  } | null>(null);
  const consumedPreloadKeyRef = React.useRef<string | null>(null);
  const prevIsOpenRef = React.useRef(false);

  const activeRequestIdRef = React.useRef<number>(0);

  const currentPropertyType = React.useMemo(() => {
    const match = selectableProperties.find(
      (p) => normalizePartitionNo(p.partitionNo) === normalizePartitionNo(partitionNo)
    );
    return match ? String(match.type ?? '') : '';
  }, [selectableProperties, partitionNo]);

  const sanitizeWardNo = React.useCallback(
    (val: string) => val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10),
    []
  );
  const sanitizePropertyNo = React.useCallback(
    (val: string) => val.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 10),
    []
  );

  const preloadProperties = React.useCallback(() => {
    const numericWardId = Number(wardId);
    const normalizedPropertyNo = propertyNo?.trim() ?? '';

    if (!numericWardId || !normalizedPropertyNo) {
      return null;
    }

    const key = `${numericWardId}|${normalizedPropertyNo}|${(categoryName ?? '').trim().toLowerCase()}`;
    if (preloadedPropertiesRef.current?.key === key) {
      return preloadedPropertiesRef.current;
    }

    const request = fetchDataEntrySameAsAction(
      numericWardId,
      normalizedPropertyNo,
      categoryName
    ).catch(() => [] as SelectableProperty[]);
    const preload: {
      key: string;
      request: Promise<SelectableProperty[]>;
      data?: SelectableProperty[];
    } = { key, request };
    preloadedPropertiesRef.current = preload;
    void request.then((data) => {
      if (preloadedPropertiesRef.current === preload) {
        preload.data = data;
      }
    });
    return preload;
  }, [wardId, propertyNo, categoryName]);

  const loadWards = React.useCallback(async () => {
    if (wardsLoadedRef.current) {
      return;
    }
    if (wardsRequestRef.current) {
      return wardsRequestRef.current;
    }

    const request = (async () => {
      setIsFetchingWards(true);
      try {
        const res = await getWardListAction();
        if (res.success && res.data) {
          setWardOptions(res.data.map((w) => ({ label: w.wardNo || '', value: String(w.wardId) })));
          wardsLoadedRef.current = true;
        }
      } catch {
      } finally {
        setIsFetchingWards(false);
      }
    })();

    wardsRequestRef.current = request;
    try {
      await request;
    } finally {
      if (wardsRequestRef.current === request) {
        wardsRequestRef.current = null;
      }
    }
  }, []);

  React.useEffect(() => {
    const propertyPreload = preloadProperties();
    let isSubscribed = true;

    if (propertyPreload) {
      void propertyPreload.request.then((data) => {
        if (isSubscribed && preloadedPropertiesRef.current === propertyPreload) {
          setSelectableProperties(data);
        }
      });
    }
    void loadWards();

    return () => {
      isSubscribed = false;
    };
  }, [preloadProperties, loadWards]);

  const handleWardChange = React.useCallback((_name: string | undefined, value: string) => {
    setSearchWardId(value);
    setSearchPropertyNo('');
    setSelectableProperties([]);
    setSelectedPropertyIds(new Set());
  }, []);

  const handleSearchProperties = React.useCallback(async () => {
    if (!Number(searchWardId) || !searchPropertyNo.trim()) return;
    setIsLoadingProperties(true);
    setSelectableProperties([]);
    setSelectedPropertyIds(new Set());
    try {
      // Pass categoryName to API so results are filtered by category (e.g. "Individual", "Apartment")
      const results = await fetchDataEntrySameAsAction(
        Number(searchWardId),
        searchPropertyNo.trim(),
        categoryName
      );
      setSelectableProperties(results);
    } finally {
      setIsLoadingProperties(false);
    }
  }, [searchWardId, searchPropertyNo, categoryName]);

  React.useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      initializedRequestRef.current = null;
      consumedPreloadKeyRef.current = null;
      activeRequestIdRef.current++;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingProperties(false);
      return;
    }

    const fetchKey = `${wardId ?? ''}|${propertyNo ?? ''}`;
    const justOpened = !prevIsOpenRef.current;
    prevIsOpenRef.current = true;

    // Do not reset search inputs or re-fetch initial property if drawer is already open and initialized
    if (!justOpened && initializedRequestRef.current === fetchKey) {
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    const initData = async () => {
      setSearchWardId(wardId ? String(wardId) : '');
      setSearchPropertyNo(propertyNo || '');
      setChangeTypeInput('');

      // Fetch ward options asynchronously in background
      if (!wardsLoadedRef.current) {
        void loadWards();
      }

      if (!Number(wardId) || !propertyNo?.trim()) {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsLoadingProperties(false);
        }
        return;
      }

      const propertyPreload = preloadProperties();
      const canUsePreload =
        propertyPreload && consumedPreloadKeyRef.current !== propertyPreload.key;
      if (canUsePreload) {
        consumedPreloadKeyRef.current = propertyPreload.key;
      }

      if (canUsePreload && propertyPreload.data !== undefined) {
        if (currentRequestId === activeRequestIdRef.current) {
          initializedRequestRef.current = fetchKey;
          setSelectableProperties(propertyPreload.data);
          setIsLoadingProperties(false);
        }
        return;
      }

      if (currentRequestId === activeRequestIdRef.current) {
        setIsLoadingProperties(true);
      }

      try {
        const results = canUsePreload
          ? await propertyPreload.request
          : await fetchDataEntrySameAsAction(Number(wardId), propertyNo.trim(), categoryName);
        if (currentRequestId === activeRequestIdRef.current) {
          initializedRequestRef.current = fetchKey;
          setSelectableProperties(results);
        }
      } catch (_err) {
        if (currentRequestId === activeRequestIdRef.current) {
          setSelectableProperties([]);
        }
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsLoadingProperties(false);
        }
      }
    };

    void initData();
  }, [isOpen, wardId, propertyNo, categoryName, loadWards, preloadProperties]);

  const filterPropertiesForTable = React.useCallback(
    (properties: SelectableProperty[], includeCurrentPartition = false) => {
      const isIndividual = (categoryName ?? '').trim().toLowerCase() === 'individual';

      const mapped = properties
        .filter((p) => {
          if (isIndividual) {
            const propCat = (p.categoryName ?? '').trim().toLowerCase();
            if (propCat !== 'individual') {
              return false;
            }
          }
          return (
            includeCurrentPartition ||
            (p.partitionNo &&
              p.partitionNo !== '-' &&
              normalizePartitionNo(p.partitionNo) !== normalizePartitionNo(partitionNo))
          );
        })
        .map((p) => {
          const wardOpt = wardOptions.find((o) => o.value === String(p.wardId));
          return { ...p, wardNo: wardOpt ? wardOpt.label : '-' };
        });

      const sorted = [...mapped].sort(comparePartitionNo);

      if (currentPropertyId) {
        const sourceIndex = sorted.findIndex(
          (p) =>
            (p.propertyId && Number(p.propertyId) === currentPropertyId) ||
            Number(String(p.id).split('-')[0]) === currentPropertyId
        );
        if (sourceIndex > -1) {
          const [sourceProp] = sorted.splice(sourceIndex, 1);
          sorted.unshift(sourceProp);
        }
      }

      return sorted;
    },
    [partitionNo, wardOptions, currentPropertyId, categoryName]
  );

  const sourcePropertyIds = React.useMemo(() => {
    const matches = selectableProperties.filter(
      (p) =>
        (p.propertyId && Number(p.propertyId) === currentPropertyId) ||
        Number(String(p.id).split('-')[0]) === currentPropertyId
    );
    return new Set<string | number>(matches.map((m) => m.id));
  }, [currentPropertyId, selectableProperties]);

  const typeWiseLockedPropertyIds = React.useMemo(() => {
    return new Set<string | number>(sourcePropertyIds);
  }, [sourcePropertyIds]);

  const activeLockedPropertyIds =
    dataEntrySameAsTab === 'type-wise' ? typeWiseLockedPropertyIds : sourcePropertyIds;

  const effectiveSelectedPropertyIds = selectedPropertyIds;

  const handleDataEntrySameAsTabChange = React.useCallback(
    (tab: string) => {
      setDataEntrySameAsTab(tab);
      setSelectedPropertyIds(new Set());
      setChangeTypeInput(''); // Reset on tab change
    },
    []
  );

  const handleTogglePropertySelection = React.useCallback((id: string | number) => {
    setSelectedPropertyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleMultipleProperties = React.useCallback(
    (ids: Array<string | number>, select: boolean) => {
      setSelectedPropertyIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (select) {
            next.add(id);
          } else {
            next.delete(id);
          }
        });
        return next;
      });
    },
    []
  );

  const handleClearPropertySelection = React.useCallback(
    () => setSelectedPropertyIds(new Set()),
    []
  );

  const handleApplySameAsDetails = React.useCallback(async () => {
    const sourcePropertyId = currentPropertyId;
    if (!sourcePropertyId) {
      toast.error(
        t('floor.selectProperties.sourcePropertyNotFound', { partitionNo: partitionNo || '-' })
      );
      return;
    }

    // Check if any source property row is selected (checked) by the user
    const isSourceSelected = Array.from(sourcePropertyIds).some((id) =>
      effectiveSelectedPropertyIds.has(id)
    );

    // Calculate destination property IDs (excluding sourcePropertyId)
    const destinationPropertyIds = Array.from(
      new Set(
        Array.from(effectiveSelectedPropertyIds)
          .map((id) => Number(String(id).split('-')[0]))
          .filter((propId) => Number.isFinite(propId) && propId > 0 && propId !== sourcePropertyId)
      )
    );

    // If neither source property nor any destination property is selected, show error
    if (destinationPropertyIds.length === 0 && !isSourceSelected) {
      toast.error(t('floor.selectProperties.selectDestinationProperty'));
      return;
    }

    // For TYPEWISE tab, validate that a valid type is entered in CHANGE TYPE input box
    if (dataEntrySameAsTab === 'type-wise' && !changeTypeInput?.trim()) {
      toast.error(t('floor.selectProperties.enterTypeFirst'));
      return;
    }

    setIsApplyingSameAs(true);
    try {
      const parsedType = getDataEntrySameAsType(changeTypeInput || currentPropertyType);
      const newType =
        parsedType && Number.isFinite(parsedType) && parsedType > 0
          ? parsedType
          : 1;

      const promises: Promise<{ success: boolean; error?: string }>[] = [];

      // For TYPEWISE, use applyDataEntrySameAsAction with sourcePropertyId = first selected property ID
      // This ensures backend sets the type natively without modifying any unselected properties
      if (dataEntrySameAsTab === 'type-wise') {
        const allSelectedPropertyIds = Array.from(
          new Set(
            Array.from(effectiveSelectedPropertyIds)
              .map((id) => Number(String(id).split('-')[0]))
              .filter((propId) => Number.isFinite(propId) && propId > 0)
          )
        );

        if (allSelectedPropertyIds.length === 0) {
          toast.error(t('floor.selectProperties.selectDestinationProperty'));
          setIsApplyingSameAs(false);
          return;
        }

        const updateType = changeTypeInput || currentPropertyType;
        if (!updateType) {
          toast.error(t('floor.selectProperties.selectType') || 'Please select or enter Type');
          setIsApplyingSameAs(false);
          return;
        }

        const [targetSourceId] = allSelectedPropertyIds;

        const payload = {
          sourcePropertyId: targetSourceId,
          destinationPropertyIds: allSelectedPropertyIds,
          filterType: 'TYPEWISE',
          type: updateType,
        };

        const res = await applyDataEntrySameAsAction(payload, locale);

        if (res.success) {
          toast.success(t('floor.selectProperties.applySuccess'));
          // Change Type and Apply Submission share the same selection state.
          // Clear it after a successful type change so the changed properties
          // are not automatically checked in the Apply Submission table.
          setSelectedPropertyIds(new Set());
          await clearDataEntrySameAsCache();
          preloadedPropertiesRef.current = null;
          consumedPreloadKeyRef.current = null;
          setIsLoadingProperties(true);
          try {
            const fetchWard = Number(searchWardId) || Number(wardId);
            const fetchPropNo = searchPropertyNo.trim() || (propertyNo ? String(propertyNo).trim() : '');
            if (fetchWard && fetchPropNo) {
              const updatedResults = await fetchDataEntrySameAsAction(
                fetchWard,
                fetchPropNo,
                categoryName
              );
              setSelectableProperties(updatedResults);
              initializedRequestRef.current = `${fetchWard}|${fetchPropNo}`;
              const preloadKey = `${fetchWard}|${fetchPropNo}|${(categoryName ?? '').trim().toLowerCase()}`;
              preloadedPropertiesRef.current = {
                key: preloadKey,
                request: Promise.resolve(updatedResults),
                data: updatedResults,
              };
            }
          } finally {
            setIsLoadingProperties(false);
          }
        } else {
          toast.error(res.error || t('floor.selectProperties.unknownError'));
        }
        return;
      } else {
        // For non-TYPEWISE tabs, use original logic
        // 1. If source property is selected, update its type via basic details API
        if (isSourceSelected && dataEntrySameAsTab !== 'parking') {
          promises.push(
            (async () => {
              // Fetch current basic details of source property
              const basicDetails = await getPropertyBasicDetailsAction(sourcePropertyId);
              if (!basicDetails) {
                return {
                  success: false,
                  error: t('floor.selectProperties.sourcePropertyNotFound', {
                    partitionNo: partitionNo || '-',
                  }),
                };
              }

              // Map only the fields required by UpdatePropertyBasicDetailsDto
              const updatedPayload = {
                wardId: basicDetails.wardId,
                taxZoneId: basicDetails.taxZoneId,
                categoryId: basicDetails.categoryId,
                propertyTypeId: basicDetails.propertyTypeId ?? newType,
                partitionNo: basicDetails.partitionNo,
                flatOrShopNo: basicDetails.flatOrShopNo,
                plotNo: basicDetails.plotNo,
                surveyNo: basicDetails.surveyNo,
                upicId: basicDetails.upicId,
                subZoneNo: basicDetails.subZoneNo,
                moujaId: basicDetails.moujaId,
                moujaName: basicDetails.moujaName,
                noOfResidentialToilets: basicDetails.noOfResidentialToilets,
                noOfCommercialToilets: basicDetails.noOfCommercialToilets,
                totalBuiltupAreaSqFeet: basicDetails.totalBuiltupAreaSqFeet,
                totalCarpetAreaSqFeet: basicDetails.totalCarpetAreaSqFeet,
                totalBuiltupAreaSqMeter: basicDetails.totalBuiltupAreaSqMeter,
                totalCarpetAreaSqMeter: basicDetails.totalCarpetAreaSqMeter,
                plotArea: basicDetails.plotArea ?? null,
                plotAreaFtLength: basicDetails.plotAreaFtLength,
                plotAreaFtWidth: basicDetails.plotAreaFtWidth,
                plotAreaMtrLength: basicDetails.plotAreaMtrLength,
                plotAreaMtrWidth: basicDetails.plotAreaMtrWidth,
                rateSectionDescription: basicDetails.rateSectionDescription,
              };

              // Call the action to save it
              return await updatePropertyBasicDetailsAction(
                locale,
                sourcePropertyId,
                updatedPayload,
                false
              );
            })()
          );
        }

        // 2. If there are destination properties selected, update their types via SameAs API
        if (destinationPropertyIds.length > 0) {
          const payload = {
            sourcePropertyId,
            destinationPropertyIds,
            filterType:
              DATA_ENTRY_SAME_AS_FILTER_TYPES[dataEntrySameAsTab] ??
              dataEntrySameAsTab.toUpperCase(),
            ...(dataEntrySameAsTab === 'parking' ? {} : { type: newType }),
          };
          promises.push(applyDataEntrySameAsAction(payload, locale));
        }
      }

      // Check if any API call will be made
      if (promises.length === 0) {
        toast.error(t('floor.selectProperties.selectDestinationProperty'));
        setIsApplyingSameAs(false);
        return;
      }

      const originalProperties = [...selectableProperties];

      // Optimistic UI update based on user requirement to see changes immediately
      if (dataEntrySameAsTab === 'type-wise') {
        const allSelectedIds = new Set(
          Array.from(effectiveSelectedPropertyIds).map((id) => Number(String(id).split('-')[0]))
        );
        setSelectableProperties((prev) =>
          prev.map((p) => {
            const propId = Number(String(p.id).split('-')[0]);
            if (allSelectedIds.has(propId)) {
              return {
                ...p,
                type: changeTypeInput || currentPropertyType,
                typeLabel: changeTypeInput || currentPropertyType,
              };
            }
            return p;
          })
        );
      } else setSelectedPropertyIds(new Set(sourcePropertyIds));

      const results = await Promise.all(promises);
      const failedResult = results.find((r) => !r.success);

      if (!failedResult) {
        toast.success(t('floor.selectProperties.applySuccess'));
        await clearDataEntrySameAsCache();
        preloadedPropertiesRef.current = null;
        consumedPreloadKeyRef.current = null;
        setIsLoadingProperties(true);
        try {
          // Re-fetch the properties to get updated data from server (with same categoryName filter)
          const fetchWard = Number(searchWardId) || Number(wardId);
          const fetchPropNo = searchPropertyNo.trim() || (propertyNo ? String(propertyNo).trim() : '');
          if (fetchWard && fetchPropNo) {
            const updatedResults = await fetchDataEntrySameAsAction(
              fetchWard,
              fetchPropNo,
              categoryName
            );
            setSelectableProperties(updatedResults);
            initializedRequestRef.current = `${fetchWard}|${fetchPropNo}`;
            const preloadKey = `${fetchWard}|${fetchPropNo}|${(categoryName ?? '').trim().toLowerCase()}`;
            preloadedPropertiesRef.current = {
              key: preloadKey,
              request: Promise.resolve(updatedResults),
              data: updatedResults,
            };
          }
        } finally {
          setIsLoadingProperties(false);
        }
      } else {
        if (dataEntrySameAsTab === 'type-wise') {
          setSelectableProperties(originalProperties);
        }
        toast.error(failedResult.error || t('floor.selectProperties.unknownError'));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('floor.selectProperties.unknownError')
      );
    } finally {
      setIsApplyingSameAs(false);
    }
  }, [
    partitionNo,
    selectableProperties,
    effectiveSelectedPropertyIds,
    dataEntrySameAsTab,
    t,
    changeTypeInput,
    currentPropertyType,
    currentPropertyId,
    sourcePropertyIds,
    locale,
    searchWardId,
    searchPropertyNo,
    wardId,
    propertyNo,
    categoryName,
  ]);

  const handleApplyTypeSubmission = React.useCallback(async () => {
    const sourcePropertyId = currentPropertyId;
    if (!sourcePropertyId) {
      toast.error(
        t('floor.selectProperties.sourcePropertyNotFound', { partitionNo: partitionNo || '-' })
      );
      return;
    }

    const destinationPropertyIds = Array.from(
      new Set(
        Array.from(effectiveSelectedPropertyIds)
          .map((id) => Number(String(id).split('-')[0]))
          .filter(
            (propId) =>
              Number.isFinite(propId) && propId > 0 && propId !== sourcePropertyId
          )
      )
    );

    if (destinationPropertyIds.length === 0) {
      toast.error(t('floor.selectProperties.selectDestinationProperty'));
      return;
    }

    const targetType = changeTypeInput?.trim() || currentPropertyType;
    if (!targetType) {
      toast.error(t('floor.selectProperties.selectType'));
      return;
    }

    const isSourceSelected = Array.from(sourcePropertyIds).some((id) =>
      effectiveSelectedPropertyIds.has(id)
    );

    const executeSubmission = async () => {
      setIsApplyingTypeSubmission(true);
      try {
        const payload = {
          sourcePropertyId,
          destinationPropertyIds,
          // Apply Submission copies only the source property's submitted
          // property/floor details. Parking has its own Apply Parking action.
          filterType: 'PROPERTYWISE',
          type: targetType,
        };

        const res = await applyDataEntrySameAsAction(payload, locale);

        if (res.success) {
          toast.success(t('floor.selectProperties.applySuccess'));
          setSelectedPropertyIds(new Set());
          await clearDataEntrySameAsCache();
          preloadedPropertiesRef.current = null;
          consumedPreloadKeyRef.current = null;
          setIsLoadingProperties(true);
          try {
            const fetchWard = Number(searchWardId) || Number(wardId);
            const fetchPropNo = searchPropertyNo.trim() || (propertyNo ? String(propertyNo).trim() : '');
            if (fetchWard && fetchPropNo) {
              const updatedResults = await fetchDataEntrySameAsAction(
                fetchWard,
                fetchPropNo,
                categoryName
              );
              setSelectableProperties(updatedResults);
              initializedRequestRef.current = `${fetchWard}|${fetchPropNo}`;
              const preloadKey = `${fetchWard}|${fetchPropNo}|${(categoryName ?? '').trim().toLowerCase()}`;
              preloadedPropertiesRef.current = {
                key: preloadKey,
                request: Promise.resolve(updatedResults),
                data: updatedResults,
              };
            }
          } finally {
            setIsLoadingProperties(false);
          }
        } else {
          toast.error(res.error || t('floor.selectProperties.unknownError'));
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('floor.selectProperties.unknownError')
        );
      } finally {
        setIsApplyingTypeSubmission(false);
      }
    };

    if (isSourceSelected) {
      confirm({
        variant: 'warning',
        title: t('floor.selectProperties.warningTitle') || 'Warning',
        description: t('floor.selectProperties.sourcePropertySubmissionWarning', {
          partitionNo: partitionNo || '-',
        }),
        onConfirm: async () => {
          await executeSubmission();
        },
      });
    } else {
      await executeSubmission();
    }
  }, [
    effectiveSelectedPropertyIds,
    currentPropertyId,
    changeTypeInput,
    currentPropertyType,
    sourcePropertyIds,
    confirm,
    t,
    partitionNo,
    locale,
    searchWardId,
    searchPropertyNo,
    wardId,
    propertyNo,
    categoryName,
  ]);

  return {
    dataEntrySameAsTab,
    setDataEntrySameAsTab: handleDataEntrySameAsTabChange,
    selectableProperties,
    selectedPropertyIds: effectiveSelectedPropertyIds,
    isLoadingProperties,
    currentPropertyType,
    searchWardId,
    searchPropertyNo,
    setSearchPropertyNo,
    wardOptions,
    isFetchingWards,
    sanitizeWardNo,
    sanitizePropertyNo,
    handleWardChange,
    handleSearchProperties,
    isApplyingSameAs,
    handleApplySameAsDetails,
    filterPropertiesForTable,
    sourcePropertyIds,
    typeWiseLockedPropertyIds,
    activeLockedPropertyIds,
    handleTogglePropertySelection,
    handleToggleMultipleProperties,
    handleClearPropertySelection,
    changeTypeInput,
    setChangeTypeInput,
    isApplyingTypeSubmission,
    handleApplyTypeSubmission,
  };
}
