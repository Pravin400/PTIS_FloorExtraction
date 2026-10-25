/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssetFormData } from "@/types/asset-types/basic-info/asset-wizard.types";

interface UseAssetFormHandlersProps {
  setFormData: React.Dispatch<React.SetStateAction<AssetFormData>>;
}

export function useAssetFormHandlers({ setFormData }: UseAssetFormHandlersProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    let sanitizedValue = value.replace(/^\s+/, "");
    const lowerName = name.toLowerCase();
    
    if (
      lowerName.includes("mobile") ||
      lowerName.includes("pincode") ||
      lowerName.includes("phone") ||
      lowerName.includes("contact")
    ) {
      sanitizedValue = sanitizedValue.replace(/\D/g, "");
    }

    if (name === "inChargeName" || name === "surveyedBy") {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z\s.]/g, "");
    } else if (name === "inChargeDesignation") {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z\s-]/g, "");
    } else if (name === "assetName") {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9\s-_]/g, "");
    } else if (name === "locality" || name === "landmark") {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9\s,./-]/g, "");
    } else if (name === "fullAddress") {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9\s,./#\-()]/g, "");
    }

    if (name === "assetCode" || name === "assetNo") {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9\-_/]/g, "");
    } else if (name === "propertyNumber") {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9\-/]/g, "");
    } else if (lowerName.includes("email")) {
      sanitizedValue = sanitizedValue.replace(/\s/g, "");
    } else if (name === "latitude" || name === "longitude") {
      sanitizedValue = sanitizedValue.replace(/[^0-9.\-]/g, "");
      const parts = sanitizedValue.split(".");
      if (parts.length > 2) {
        sanitizedValue = parts[0] + "." + parts.slice(1).join("");
      }
      if (sanitizedValue.includes("-")) {
        sanitizedValue = (sanitizedValue.startsWith("-") ? "-" : "") + sanitizedValue.replace(/-/g, "");
      }
    } else if (
      lowerName.includes("value") ||
      lowerName.includes("rate") ||
      lowerName.includes("cost") ||
      lowerName.includes("price") ||
      lowerName.includes("valuation")
    ) {
      sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, "");
      const parts = sanitizedValue.split(".");
      if (parts.length > 2) {
        sanitizedValue = parts[0] + "." + parts.slice(1).join("");
      }
    }

    const isTitleCased = name === "assetName" || name === "inChargeName" || name === "inChargeDesignation";
    if (isTitleCased) {
      sanitizedValue = sanitizedValue.replace(/\b\w/g, (char) => char.toUpperCase());
    }

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
        } catch { }
      });
    }
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: checked };

      if (name === "inheritLocation" && checked && prev.parentAssetId) {
        newData.fullAddress = "Main Municipal Building, Administrative Block, Zone 4";
        newData.locality = "Civil Lines";
        newData.landmark = "Opposite District Court";
        newData.pinCode = "400001";
        newData.latitude = "19.0760";
        newData.longitude = "72.8777";
      }

      return newData;
    });
  };

  const handleAttributeChange = (name: string, value: any) => {
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
