import type { UseAssetFormHandlersProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import { sanitizeBasicInfoField } from "@/lib/validation/asset/new-add-new-asset";
import { logger } from "@/lib/utils/logger";

export function useAssetFormHandlers({ setFormData }: UseAssetFormHandlersProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    const sanitizedValue = sanitizeBasicInfoField(name, value);
    const isTitleCased = name === "assetName" || name === "inChargeName" || name === "inChargeDesignation";

    setFormData((prev) => {
      const newData = { ...prev, [name]: sanitizedValue };

      if (name === "category") {
        newData.assetType = "";
      }

      if (name === "zoneId") {
        newData.wardId = "";
      }

      return newData;
    });

    if (start !== null && end !== null && isTitleCased) {
      requestAnimationFrame(() => {
        try {
          target.setSelectionRange(start, end);
        } catch (err) {
          logger.debug("Selection range not supported on element", { name, error: err instanceof Error ? err : undefined });
        }
      });
    }
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAttributeChange = (name: string, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [name]: value,
      },
    }));
  };

  return { handleInputChange, handleToggleChange, handleAttributeChange };
}
