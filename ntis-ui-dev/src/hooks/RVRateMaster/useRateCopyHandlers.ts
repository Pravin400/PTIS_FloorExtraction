import { toast } from "sonner";
import type { ISelectOption, IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { getRateMasterByFilters } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  [key: string]: number | string | null | undefined;
};

interface RateCopyHandlersProps {
  id?: string | null;
  editData?: unknown;
  bulkEditData?: unknown;
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  existingRateFound: boolean;
  rateCategories: RateCategory[];
  useGroupOptions: ISelectOption[];
  assessmentYears: ISelectOption[];
  assessmentYearRanges?: Array<{ label: string; value: string }>;
  zoneDescriptions: IZoneDescription[];
  paginatedZoneDescriptions: IZoneDescription[];
  matrixStorageKey: string;
  locale: string;
  setMatrixData: (data: MatrixRow[]) => void;
  setShowMatrix: (show: boolean) => void;
  setCopySectionsExpanded: (expanded: boolean) => void;
  setShowMultipliersInline: (show: boolean) => void;
  setMultipliers: (multipliers: Record<string, number>) => void;
  tempMultipliers: Record<string, number>;
  sourceUseGroup: string;
  handleCopyRates: () => Promise<void>;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  isOpenPlot?: boolean;
}

export function useRateCopyHandlers(props: RateCopyHandlersProps) {
  const {
    id, editData, bulkEditData, selectedZone, selectedUseGroup, assessmentYear,
    existingRateFound, rateCategories, useGroupOptions,
    zoneDescriptions, paginatedZoneDescriptions, matrixStorageKey, locale, setMatrixData,
    setShowMatrix, setCopySectionsExpanded, setShowMultipliersInline, setMultipliers,
    tempMultipliers, sourceUseGroup, handleCopyRates, t,
    isOpenPlot = false,
  } = props;

  const { confirm } = useConfirm();
  const rateSectionLabel = useAliasLabel("Rate_Section", useAliasLabel("Rate Section", t("aliasFallback.rateSection")));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", useAliasLabel("Type of Use", t("aliasFallback.typeOfUse")));
  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.assessment"));
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));

  const handleGenerateMatrix = async () => {
    if (!selectedZone) {
      toast.error(t('messages.selectRateSection', { rateSection: rateSectionLabel }));
      return;
    }
    if (!isOpenPlot && !selectedUseGroup) {
      toast.error(t('messages.selectUseGroup', { typeOfUse: typeOfUseLabel }));
      return;
    }
    if (!assessmentYear) {
      toast.error(t('messages.validationSelectAssessmentYear', { assessment: assessmentLabel }));
      return;
    }
    const isEditMode = !!id || !!editData || !!bulkEditData;
    if (!isEditMode && existingRateFound) {
      toast.error(t('messages.validationRatesAlreadyExist'));
      return;
    }

    if (!isOpenPlot) {
      const params = new URLSearchParams({ zone: selectedZone, useGroup: selectedUseGroup });
      if (assessmentYear) params.append("assessmentYear", assessmentYear);
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/${locale}/property-tax/rate-master/rvratemaster/add`;
      const newUrl = `${currentPath}?${params.toString()}`;
      window.history.pushState({}, '', newUrl);
    }

    if (!isEditMode && assessmentYear) {
      const activeZones = paginatedZoneDescriptions.length > 0 ? paginatedZoneDescriptions : zoneDescriptions;
      const emptyMatrix = activeZones.map((z, idx) => ({
        id: idx + 1,
        zone: z.zoneNo,
        ...rateCategories.reduce((acc, cat) => ({ ...acc, [cat.constructionId]: 0 }), {} as Record<string, number>),
      }));
      setMatrixData(emptyMatrix);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(matrixStorageKey);
      }
    }
    setShowMatrix(true);
  };

  const handleToggleMultipliers = (currentShowMultipliers: boolean) => {
    const params = new URLSearchParams(window.location.search);
    if (currentShowMultipliers) {
      params.delete('showMultipliers');
    } else {
      params.set('showMultipliers', 'true');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    setShowMultipliersInline(!currentShowMultipliers);
  };

  const handleToggleCopyRates = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('zone', selectedZone);
    params.set('useGroup', selectedUseGroup);
    params.set('assessmentYear', assessmentYear);
    params.set('showCopyRates', 'true');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    setCopySectionsExpanded(true);
  };

  const handleCloseCopySection = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('showCopyRates');
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setCopySectionsExpanded(false);
  };

  const handleCloseMultipliersSection = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete('showMultipliers');
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setShowMultipliersInline(false);
  };

  const handleApplyMultipliers = async () => {
    const changedMultiplierEntries = Object.entries(tempMultipliers).filter(
      ([useGroupId, value]) => value > 0 && value !== 1.0 && useGroupId !== selectedUseGroup
    );

    if (changedMultiplierEntries.length === 0) {
      setMultipliers({ ...tempMultipliers });
      const changedMultipliers = Object.entries(tempMultipliers)
        .filter(([_, value]) => value > 0 && value !== 1.0)
        .map(([key]) => useGroupOptions.find(opt => opt.value === key)?.label || key);
      if (changedMultipliers.length > 0) {
        toast.success(t('messages.multiplierAdded', { groups: changedMultipliers.join(', ') }));
        handleCloseMultipliersSection();
      } else {
        toast.info(t('messages.noMultipliersChanged'));
      }
      return;
    }

    try {
      // Check which of the multiplier groups already have rates configured
      const checkPromises = changedMultiplierEntries.map(async ([useGroupId]) => {
        try {
          const existingRates = await getRateMasterByFilters(selectedZone, useGroupId, assessmentYear);
          const exists = isOpenPlot
            ? existingRates?.some(rate =>
              rateCategories?.some(cat => Number(cat.typeOfUseGroupId) === Number(rate.typeOfUseGroupId))
            )
            : existingRates && existingRates.length > 0;
          return { useGroupId, exists };
        } catch {
          return { useGroupId, exists: false };
        }
      });

      const checkResults = await Promise.all(checkPromises);
      const conflictingGroupIds = checkResults.filter(r => r.exists).map(r => r.useGroupId);

      if (conflictingGroupIds.length > 0) {
        const conflictingLabels = conflictingGroupIds.map(
          id => useGroupOptions.find(opt => opt.value === id)?.label || id
        );

        confirm({
          title: t('dialogs.confirmMultiplierUpdateTitle'),
          description: t('dialogs.confirmMultiplierUpdateDescription', { groups: conflictingLabels.join(', '), use: useLabel }),
          confirmText: t('dialogs.confirmYes'),
          cancelText: t('dialogs.confirmNo'),
          onConfirm: () => {
            // Yes: proceed with adding rates as present currently as it is (no change)
            setMultipliers({ ...tempMultipliers });
            const changedMultipliers = Object.entries(tempMultipliers)
              .filter(([_, value]) => value > 0 && value !== 1.0)
              .map(([key]) => useGroupOptions.find(opt => opt.value === key)?.label || key);
            toast.success(t('messages.multiplierAdded', { groups: changedMultipliers.join(', ') }));
            handleCloseMultipliersSection();
          },
          onCancel: () => {
            // No: Remove only conflicting groups' multipliers (set to 1.0) and keep the rest
            const updatedMultipliers = { ...tempMultipliers };
            conflictingGroupIds.forEach(id => {
              updatedMultipliers[id] = 1.0;
            });
            setMultipliers(updatedMultipliers);

            const remainingMultipliers = Object.entries(updatedMultipliers)
              .filter(([key, value]) => value > 0 && value !== 1.0 && key !== selectedUseGroup)
              .map(([key]) => useGroupOptions.find(opt => opt.value === key)?.label || key);

            if (remainingMultipliers.length > 0) {
              toast.info(t('messages.multiplierConflictRemovedSuccess', {
                removed: conflictingLabels.join(', '),
                groups: remainingMultipliers.join(', ')
              }) || `Conflicting multipliers for ${conflictingLabels.join(', ')} removed. Added multipliers for ${remainingMultipliers.join(', ')}.`);
            } else {
              toast.info(t('messages.multipliersCleared', { use: useLabel }));
            }
            handleCloseMultipliersSection();
          }
        });
      } else {
        // No conflicts, apply normally
        setMultipliers({ ...tempMultipliers });
        const changedMultipliers = Object.entries(tempMultipliers)
          .filter(([_, value]) => value > 0 && value !== 1.0)
          .map(([key]) => useGroupOptions.find(opt => opt.value === key)?.label || key);
        toast.success(t('messages.multiplierAdded', { groups: changedMultipliers.join(', ') }));
        handleCloseMultipliersSection();
      }
    } catch (_err) {
      // Fallback
      setMultipliers({ ...tempMultipliers });
      handleCloseMultipliersSection();
    }
  };

  const handleCopyRatesWithValidation = () => {
    if (!sourceUseGroup) {
      toast.error(t('messages.selectUseGroupCopy', { use: useLabel }));
      return;
    }
    if (!selectedZone) {
      toast.error(t('messages.selectRateSection', { rateSection: rateSectionLabel }));
      return;
    }
    if (!selectedUseGroup) {
      toast.error(t('messages.selectUseGroup', { typeOfUse: typeOfUseLabel }));
      return;
    }
    handleCopyRates();
  };

  return {
    handleGenerateMatrix,
    handleToggleMultipliers,
    handleToggleCopyRates,
    handleCloseCopySection,
    handleCloseMultipliersSection,
    handleApplyMultipliers,
    handleCopyRatesWithValidation,
  };
}
