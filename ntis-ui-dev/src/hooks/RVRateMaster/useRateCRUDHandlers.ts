import { toast } from "sonner";
import { getRateMasterByFilters } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import type { IBackendRateMaster, ISelectOption, IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import type { ConfirmOptions } from "@/components/common/ConfirmProvider";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  [key: string]: number | string | null | undefined;
};

interface RateCRUDHandlersProps {
  mode: "edit" | "delete" | "add";
  id?: string | null;
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  existingRateFound: boolean;
  rateCategories: RateCategory[];
  useGroupOptions: ISelectOption[];
  zoneOptions: ISelectOption[];
  zoneDescriptions: IZoneDescription[];
  assessmentYears: ISelectOption[];
  assessmentYearRanges?: Array<{ label: string; value: string }>;
  confirm: (options: ConfirmOptions) => void;
  buildCompleteMatrixForSubmission: () => MatrixRow[];
  handleBulkCreate: (data: MatrixRow[]) => Promise<{ success: boolean } | undefined>;
  handleBulkUpdate: (data: MatrixRow[]) => Promise<{ success: boolean } | undefined>;
  handleDelete: (data: IBackendRateMaster[]) => Promise<{ success: boolean } | undefined>;
  handleClose: (isSuccessfulSave?: boolean) => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  isOpenPlot?: boolean;
  router: { refresh: () => void; replace?: (url: string) => void; };
}

export function useRateCRUDHandlers(props: RateCRUDHandlersProps) {
  const {
    selectedZone, selectedUseGroup, assessmentYear, existingRateFound, rateCategories,
    useGroupOptions, zoneOptions, zoneDescriptions, assessmentYears, assessmentYearRanges,
    confirm, buildCompleteMatrixForSubmission, handleBulkCreate, handleBulkUpdate, handleDelete,
    handleClose, t, isOpenPlot, router
  } = props;
  const rateSection = useAliasLabel("Rate_Section", useAliasLabel("Rate Section", t("aliasFallback.rateSection")));
  const use = useAliasLabel("Use", t("aliasFallback.use"));
  const assessment = useAliasLabel("Assessment", t("aliasFallback.assessment"));

  const handleAddRates = async () => {
    if (existingRateFound) {
      toast.error(t('messages.validationRatesAlreadyExist'));
      return;
    }
    const completeMatrixData = buildCompleteMatrixForSubmission();
    const totalCells = completeMatrixData.length * rateCategories.length;
    const filledCells = completeMatrixData.reduce((count, row) => {
      return count + rateCategories.filter(cat => {
        const key = cat.constructionCode || cat.constructionId;
        const value = row[key];
        return value !== undefined && value !== null && value !== "";
      }).length;
    }, 0);
    const completionPct = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
    if (completionPct < 100) {
      toast.error(t('messages.validationIncompleteMatrix', { percentage: completionPct }));
      return;
    }
    const result = await handleBulkCreate(completeMatrixData);
    if (result?.success) {
      router.refresh();
      handleClose(true);
    }
  };

  const handleUpdateRates = async () => {
    const completeMatrixData = buildCompleteMatrixForSubmission();
    const result = await handleBulkUpdate(completeMatrixData);
    if (result?.success) {
      router.refresh();
      handleClose(true);
    }
  };

  const handleDeleteRates = async () => {
    let latestBackendRates: IBackendRateMaster[] = [];
    try {
      latestBackendRates = await getRateMasterByFilters(selectedZone, selectedUseGroup, assessmentYear);
    } catch (_err) {
      toast.error(t('messages.fetchRatesForDeleteFailed'));
      return;
    }

    if (isOpenPlot) {
      const openPlotGroupIds = new Set(
        rateCategories
          .map(cat => Number(cat.typeOfUseGroupId))
          .filter(id => !isNaN(id) && id > 0)
      );
      latestBackendRates = latestBackendRates.filter(rate => openPlotGroupIds.has(Number(rate.typeOfUseGroupId)));
    }

    if (!latestBackendRates || latestBackendRates.length === 0) {
      toast.error(t('messages.noRatesToDelete'));
      return;
    }

    const configuredRatesCount = latestBackendRates.filter(rate => Number(rate.rateSquareMeter) > 0).length;
    let zoneName = selectedZone;
    if (zoneOptions?.length) {
      const found = zoneOptions.find(z => z.value === selectedZone);
      if (found?.label) zoneName = found.label;
    } else if (zoneDescriptions?.length) {
      const found = zoneDescriptions.find(z => String(z.zoneNo) === String(selectedZone));
      if (found?.description) zoneName = found.description;
    }
    const useGroupLabel = selectedUseGroup
      ? selectedUseGroup
          .split(",")
          .map(opt => useGroupOptions.find(o => String(o.value) === String(opt.trim()))?.label || opt.trim())
          .join(", ")
      : "";
    const assessmentYearLabel = assessmentYearRanges?.find(ay => String(ay.value) === String(assessmentYear))?.label
      || assessmentYears?.find(ay => String(ay.value) === String(assessmentYear))?.label
      || assessmentYear;

    confirm({
      variant: "delete",
      title: t('dialogs.deleteRatesTitle'),
      description: t('dialogs.deleteRatesDescription', {
        count: configuredRatesCount,
        zoneName,
        useGroup: useGroupLabel,
        assessmentYear: assessmentYearLabel,
        rateSection,
        use,
        assessment,
      }),
      confirmText: t('dialogs.confirmDelete'),
      cancelText: t('dialogs.cancel'),
      onConfirm: async () => {
        const result = await handleDelete(latestBackendRates);
        if (result?.success) {
          router.refresh();
          handleClose();
        }
      },
    });
  };

  return {
    handleAddRates,
    handleUpdateRates,
    handleDeleteRates
  };
}
