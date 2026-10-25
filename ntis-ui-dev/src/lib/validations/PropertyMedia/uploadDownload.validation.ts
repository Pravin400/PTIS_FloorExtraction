import { UploadDownloadFormModel } from "@/types/PropertyMedia/PropertyMedia.types";

export interface ValidationTranslator {
  (key: string): string;
}

/**
 * Validates the upload/download form data based on the active tab.
 *
 * @param data The form model containing upload and download field values.
 * @param t Translation function (e.g. from useTranslations("propertyMedia")).
 * @returns Map of field keys to error messages.
 */
export function validateUploadDownloadForm(
  data: UploadDownloadFormModel,
  t: ValidationTranslator
): Record<string, string> {
  const newErrors: Record<string, string> = {};

  if (data.activeTab === "upload") {
    if (!data.upload.category) {
      newErrors["upload.category"] = t("uploadDownloadDrawer.validation.categoryRequired");
    }
    if (!data.upload.subCategory) {
      newErrors["upload.subCategory"] = t("uploadDownloadDrawer.validation.subCategoryRequired");
    }
  } else {
    if (!data.download.category) {
      newErrors["download.category"] = t("uploadDownloadDrawer.validation.categoryRequired");
    }
    if (!data.download.subCategory) {
      newErrors["download.subCategory"] = t("uploadDownloadDrawer.validation.subCategoryRequired");
    }
  }

  return newErrors;
}
