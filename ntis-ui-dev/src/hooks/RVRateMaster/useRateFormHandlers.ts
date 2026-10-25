import { useRateCRUDHandlers } from "./useRateCRUDHandlers";
import { useRateCopyHandlers } from "./useRateCopyHandlers";
import type { IBackendRateMaster, ISelectOption, IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import type { ConfirmOptions } from "@/components/common/ConfirmProvider";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  [key: string]: number | string | null | undefined;
};

interface RateFormHandlersProps {
  mode: "edit" | "delete" | "add";
  id?: string | null;
  editData?: unknown;
  bulkEditData?: unknown;
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  existingRateFound: boolean;
  rateCategories: RateCategory[];
  useGroupOptions: ISelectOption[];
  zoneOptions: ISelectOption[];
  assessmentYears: ISelectOption[];
  assessmentYearRanges?: Array<{ label: string; value: string }>;
  zoneDescriptions: IZoneDescription[];
  paginatedZoneDescriptions: IZoneDescription[];
  matrixStorageKey: string;
  locale: string;
  onClose?: (isSuccessfulSave?: boolean) => void;
  router: { replace: (url: string) => void; refresh: () => void; };
  confirm: (options: ConfirmOptions) => void;
  buildCompleteMatrixForSubmission: () => MatrixRow[];
  handleBulkCreate: (data: MatrixRow[]) => Promise<{ success: boolean } | undefined>;
  handleBulkUpdate: (data: MatrixRow[]) => Promise<{ success: boolean } | undefined>;
  handleDelete: (data: IBackendRateMaster[]) => Promise<{ success: boolean } | undefined>;
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

export function useRateFormHandlers(props: RateFormHandlersProps) {
  const {
    mode, id, editData, bulkEditData, selectedZone, selectedUseGroup, assessmentYear,
    existingRateFound, rateCategories, useGroupOptions, zoneOptions, assessmentYears,
    assessmentYearRanges, zoneDescriptions, paginatedZoneDescriptions, matrixStorageKey,
    locale, onClose, router, confirm, buildCompleteMatrixForSubmission,
    handleBulkCreate, handleBulkUpdate, handleDelete, setMatrixData, setShowMatrix,
    setCopySectionsExpanded, setShowMultipliersInline, setMultipliers,
    tempMultipliers, sourceUseGroup, handleCopyRates, t, isOpenPlot
  } = props;

  const handleClose = (isSuccessfulSave?: boolean) => {
    if (onClose) {
      onClose(isSuccessfulSave);
    } else {
      const routePrefix = isOpenPlot ? 'openplot' : 'rvratemaster';
      router.replace(`/${locale}/property-tax/rate-master/${routePrefix}`);
    }
  };

  const crudHandlers = useRateCRUDHandlers({
    mode, id, selectedZone, selectedUseGroup, assessmentYear, existingRateFound,
    rateCategories, useGroupOptions, zoneOptions, zoneDescriptions, assessmentYears,
    assessmentYearRanges, confirm, buildCompleteMatrixForSubmission, handleBulkCreate,
    handleBulkUpdate, handleDelete, handleClose, t, isOpenPlot, router
  });

  const copyHandlers = useRateCopyHandlers({
    id, editData, bulkEditData, selectedZone, selectedUseGroup, assessmentYear,
    existingRateFound, rateCategories, useGroupOptions, assessmentYears,
    assessmentYearRanges, zoneDescriptions, paginatedZoneDescriptions, matrixStorageKey,
    locale, setMatrixData, setShowMatrix, setCopySectionsExpanded, setShowMultipliersInline,
    setMultipliers, tempMultipliers, sourceUseGroup, handleCopyRates, t, isOpenPlot
  });

  return {
    handleClose,
    ...crudHandlers,
    ...copyHandlers
  };
}
