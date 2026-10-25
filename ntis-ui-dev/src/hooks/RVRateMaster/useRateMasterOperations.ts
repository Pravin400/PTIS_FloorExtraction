import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getRateMasterByFilters, deleteRateMasterAction } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import type { IBackendRateMaster, RateCategory } from "@/types/RVRateMaster";
import { buildRateSubmissions, fetchBackendRatesForSubmission,  processRateSubmissions, NO_RATES_TO_UPDATE_ERROR} from "./helpers/rateBulkOperations";
import { validateMatrixHasRates, parseMatrixData, formatUseGroupLabels, getOperationResult } from "./helpers/rateOperationValidation";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
interface UseRateMasterOperationsProps {
  mode: "add" | "edit" | "delete";
  id?: string;
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  rateFrequency: "Monthly" | "Yearly";
  rateUnit: "SqMeter" | "SqFeet";
  multipliers: Record<string, number>;
  rateCategories: RateCategory[];
  useGroupOptions: Array<{ label: string; value: string }>;
  isOpenPlot?: boolean;
}

export function useRateMasterOperations({
  mode,
  id,
  selectedZone,
  selectedUseGroup,
  assessmentYear,
  rateFrequency,
  rateUnit,
  multipliers,
  rateCategories,
  useGroupOptions,
  isOpenPlot = false,
}: UseRateMasterOperationsProps) {
  const t = useTranslations("ptis_RVRateMaster");
  const rateSection = useAliasLabel("Rate_Section", useAliasLabel("Rate Section", t("aliasFallback.rateSection")));
  const assessment = useAliasLabel("Assessment", t("aliasFallback.assessment"));
  const use = useAliasLabel("Use", t("aliasFallback.use"));

  const getUseGroupLabel = useCallback((useGroup: string) => {
    if (!useGroup) return "";
    return useGroup
      .split(",")
      .map(id => useGroupOptions.find(u => String(u.value) === String(id.trim()))?.label || id.trim())
      .join(", ");
  }, [useGroupOptions]);

  // Bulk create handler
  const handleBulkCreate = useCallback(async (completeMatrixData: Array<Record<string, unknown>>) => {
    if (!assessmentYear) {
      toast.error(t('messages.validationSelectAssessmentYear', { assessment }));
      return { success: false };
    }

    if (!validateMatrixHasRates(completeMatrixData, rateCategories)) {
      toast.error(t('messages.validationEnterRateValue'));
      return { success: false };
    }

    // Check for existing rates in add mode
    if (mode === "add" && !id) {
      try {
        const existingForSelection = await getRateMasterByFilters(selectedZone, selectedUseGroup, assessmentYear);
        const hasExisting = isOpenPlot
          ? existingForSelection?.some(rate => 
              rateCategories.some(cat => Number(cat.typeOfUseGroupId) === Number(rate.typeOfUseGroupId))
            )
          : existingForSelection?.length > 0;

        if (hasExisting) {
          toast.error(t('messages.validationRatesAlreadyExist'));
          return { success: false };
        }
      } catch (_err) {
        // Continue even if check fails
      }
    }

    const config = { selectedZone, selectedUseGroup, assessmentYear, rateFrequency, rateUnit, rateCategories, isOpenPlot };
    const allRateSubmissions = buildRateSubmissions(completeMatrixData, selectedUseGroup, multipliers, rateCategories);

    // Fetch backend rates for each submission
    for (const submission of allRateSubmissions) {
      submission.backendRates = await fetchBackendRatesForSubmission(selectedZone, submission.useGroup, assessmentYear);
    }

    // Process all submissions and show results
    const { successCount, errorMessages } = await processRateSubmissions(allRateSubmissions, config, getUseGroupLabel);
    const result = getOperationResult(successCount, allRateSubmissions.length);
    const useGroupLabels = formatUseGroupLabels(allRateSubmissions, getUseGroupLabel);

    if (result.allSuccess) {
      toast.success(t('messages.ratesAddedSuccess', { groups: useGroupLabels }));
      return { success: true };
    } else if (result.partialSuccess) {
      toast.warning(t('messages.ratesAddedPartial', { count: successCount, errors: errorMessages.join('; '), use }));
      return { success: true };
    } else {
      toast.error(t('messages.ratesAddedFailed', { errors: errorMessages.join('; ') }));
      return { success: false };
    }
  }, [assessmentYear, selectedZone, selectedUseGroup, multipliers, rateCategories, mode, id, t, rateFrequency, rateUnit, getUseGroupLabel, isOpenPlot, assessment, use]);

  // Bulk update handler
  const handleBulkUpdate = useCallback(async (completeMatrixData: Array<Record<string, unknown>>) => {
    if (!assessmentYear) {
      toast.error(t('messages.validationSelectAssessmentYear', { assessment }));
      return { success: false };
    }

    const config = { selectedZone, selectedUseGroup, assessmentYear, rateFrequency, rateUnit, rateCategories, isOpenPlot };
    const parsedMatrixData = parseMatrixData(completeMatrixData, rateCategories);
    const allRateSubmissions = buildRateSubmissions(parsedMatrixData, selectedUseGroup, multipliers, rateCategories);

    // Fetch backend rates for primary submission
    const primaryBackendRates = await fetchBackendRatesForSubmission(selectedZone, selectedUseGroup, assessmentYear);
    if (primaryBackendRates.length === 0) {
      toast.error(t('messages.validationFetchUpdateFailed', { rateSection, use }));
      return { success: false };
    }
    allRateSubmissions[0].backendRates = primaryBackendRates;

    // Fetch backend rates for other submissions
    for (let i = 1; i < allRateSubmissions.length; i++) {
      allRateSubmissions[i].backendRates = await fetchBackendRatesForSubmission(
        selectedZone,
        allRateSubmissions[i].useGroup,
        assessmentYear
      );
    }

    // Process all submissions and show results
    const { successCount, errorMessages } = await processRateSubmissions(allRateSubmissions, config, getUseGroupLabel);
    const result = getOperationResult(successCount, allRateSubmissions.length);
    const useGroupLabels = formatUseGroupLabels(allRateSubmissions, getUseGroupLabel);

    const nonUpdateErrors = errorMessages.filter(msg => msg !== NO_RATES_TO_UPDATE_ERROR);
    
    if (successCount === 0 && errorMessages.length > 0 && nonUpdateErrors.length === 0) {
      toast.error(t('messages.noRatesToUpdate'));
      return { success: false };
    }

    if (result.allSuccess) {
      toast.success(t('messages.ratesUpdatedSuccess', { groups: useGroupLabels }));
      return { success: true };
    } else if (result.partialSuccess) {
      toast.warning(t('messages.ratesUpdatedPartial', { count: successCount, errors: nonUpdateErrors.join('; '), use }));
      return { success: true };
    } else {
      toast.error(t('messages.ratesUpdatedFailed', { errors: nonUpdateErrors.join('; ') }));
      return { success: false };
    }
  }, [assessmentYear, selectedZone, selectedUseGroup, multipliers, rateCategories, t, rateFrequency, rateUnit, getUseGroupLabel, isOpenPlot, assessment, use, rateSection]);

  // Delete handler
  const handleDelete = useCallback(async (latestBackendRates: IBackendRateMaster[]) => {
    if (!latestBackendRates?.length) {
      toast.error(t('messages.noRatesToDelete'));
      return { success: false };
    }

    const configuredRatesCount = latestBackendRates.reduce(
      (count, rate) => count + (Number(rate.rateSquareMeter) > 0 ? 1 : 0),
      0
    );

    const result = await deleteRateMasterAction(latestBackendRates);
    if (result.success) {
      const deletedCount = 'count' in result && typeof result.count === 'number' ? result.count : configuredRatesCount;
      toast.success(t('messages.ratesDeletedSuccess', { count: deletedCount }));
      return { success: true };
    } else {
      toast.error(result.message || t('messages.ratesDeleteFailed'));
      return { success: false };
    }
  }, [t]);

  return {
    handleBulkCreate,
    handleBulkUpdate,
    handleDelete,
  };
}
