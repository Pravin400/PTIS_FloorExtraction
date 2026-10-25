import { toast } from "sonner";
import type { IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import {
  generateCsvTemplate,
  downloadFile,
  parseExcelOrCsvContent,
  applyImportedEditsToMatrix,
  validateFileType,
} from "./index";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  taxZoneId?: number;
  [key: string]: number | string | null | undefined;
};

interface TemplateDownloadParams {
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  allZones: IZoneDescription[];
  rateCategories: RateCategory[];
  rateUnit: "SqMeter" | "SqFeet";
  t: ReturnType<typeof import("next-intl").useTranslations>;
  aliasLabels?: Record<string, string>;
}

export function handleTemplateDownload(params: TemplateDownloadParams) {
  const { selectedZone, selectedUseGroup, assessmentYear, allZones, rateCategories, rateUnit, t, aliasLabels } = params;

  if (!assessmentYear) {
    toast.error(t('messages.selectAssessmentYearRange', aliasLabels));
    return;
  }
  if (!selectedZone) {
    toast.error(t('messages.selectRateSection', aliasLabels));
    return;
  }
  if (!selectedUseGroup) {
    toast.error(t('messages.selectUseGroup', aliasLabels));
    return;
  }
  if (!allZones || !Array.isArray(allZones)) {
    toast.error(t('messages.noRatesAvailable'));
    return;
  }

  try {
    const csvContent = generateCsvTemplate(allZones, rateCategories, rateUnit);
    const filename = `rate-master-template-${selectedZone}-${selectedUseGroup}.csv`;
    downloadFile(csvContent, filename);
    toast.success(t('messages.templateDownloadedSuccess'));
  } catch (_error) {
    toast.error(t('messages.validationDownloadTemplateFailed'));
  }
}

interface FileUploadParams {
  allZones: IZoneDescription[];
  rateCategories: RateCategory[];
  matrixData: MatrixRow[];
  allZoneEdits: Record<string, Record<string, number>>;
  showMatrix: boolean;
  setMatrixData: (data: MatrixRow[]) => void;
  setAllZoneEdits: (edits: Record<string, Record<string, number>>) => void;
  setShowMatrix: (show: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  rateUnit: "SqMeter" | "SqFeet";
}

export function handleFileUpload(
  event: React.ChangeEvent<HTMLInputElement>,
  params: FileUploadParams
) {
  const { allZones, rateCategories, matrixData, allZoneEdits, showMatrix, setMatrixData, setAllZoneEdits, setShowMatrix, fileInputRef, t, rateUnit } = params;

  const file = event.target.files?.[0];
  if (!file) return;

  if (!validateFileType(file)) {
    toast.error(t('messages.validationUploadValidFile'));
    return;
  }

  const fileExt = file.name.toLowerCase().split('.').pop() || '';

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const result = e.target?.result;
      if (!result) {
        throw new Error(t('messages.validationReadFileFailed'));
      }
      const { zoneEdits, importedRateCount } = parseExcelOrCsvContent(
        result,
        fileExt,
        allZones,
        rateCategories,
        rateUnit,
        t
      );

      const newEdits: Record<string, Record<string, number>> = { ...allZoneEdits, ...zoneEdits };
      setAllZoneEdits(newEdits);

      const updatedMatrix = applyImportedEditsToMatrix(matrixData, zoneEdits);
      setMatrixData(updatedMatrix);

      toast.success(t('messages.importedRecordsSuccess', { count: importedRateCount }));

      if (!showMatrix) {
        setShowMatrix(true);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('messages.validationParseFailed'));
      }
    }
  };

  reader.onerror = () => {
    toast.error(t('messages.validationReadFileFailed'));
  };

  if (fileExt === 'csv') {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }

  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
}
