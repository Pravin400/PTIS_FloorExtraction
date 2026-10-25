import type {
  BuildingBasicInfoFormErrors,
  ExtendedBuildingBasicInfoFormData,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { ExtendedBuildingBasicInfoFormData };

function isValidDecimal12_2(val: string | number | null | undefined): boolean {
  if (val == null) return false;
  const str = String(val).trim();
  if (!str) return false;
  if (/[eE]/.test(str)) return false;
  if (str.includes("-")) return false;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(str)) return false;
  const num = Number(str);
  return !isNaN(num) && num > 0;
}

export function validatePropertyFields(
  formData: ExtendedBuildingBasicInfoFormData,
  errors: BuildingBasicInfoFormErrors & Record<string, string | undefined>,
  isLand: boolean,
  isBuilding: boolean
) {
  if (formData.isMovableCategory) {
    delete errors.zone;
    delete errors.ward;
    delete errors.mouja;
    delete errors.subzone;
    delete errors.propertyNumber;
    delete errors.department;
    delete errors.fullAddress;
    delete errors.pinCode;
  } else {
    // Zone and Ward are optional — no required validation
    delete errors.zone;
    delete errors.ward;
  }

  if ((isLand || isBuilding) && (!formData.landArea || String(formData.landArea).trim() === "")) {
    errors.landArea = "Total Area is required.";
  } else if ((isLand || isBuilding) && formData.landArea) {
    const areaVal = Number(formData.landArea);
    if (isNaN(areaVal) || areaVal <= 0) {
      errors.landArea = "Total Area must be a valid positive number greater than 0.";
    }
  }

  if (isLand) {
    if (!formData.plotNumber || String(formData.plotNumber).trim() === "") errors.plotNumber = "Plot Number is required.";
  }

  if (formData.propertyNumber) {
    const propNo = String(formData.propertyNumber).trim();
    if (propNo.length > 12) errors.propertyNumber = "Property No cannot exceed 12 digits.";
    else if (!/^[a-zA-Z0-9/\-]+$/.test(propNo)) errors.propertyNumber = "Property No can only contain alphanumeric characters, '/', and '-'.";
  }

  if (formData.partitionNo) {
    const partNo = String(formData.partitionNo).trim();
    if (partNo.length > 10) errors.partitionNo = "Partition No. cannot exceed 10 characters.";
    else if (!/^[a-zA-Z0-9/\-]+$/.test(partNo)) errors.partitionNo = "Partition No. can only contain alphanumeric characters, '/', and '-'.";
  }

  if (formData.upicId) {
    const upic = String(formData.upicId).trim();
    if (upic.length > 15) errors.upicId = "UPIC ID cannot exceed 15 characters.";
    else if (!/^[a-zA-Z0-9/\-]+$/.test(upic)) errors.upicId = "UPIC ID can only contain alphanumeric characters, hyphens, and slashes.";
  }

  if (formData.surveyNumber) {
    const csn = String(formData.surveyNumber).trim();
    if (csn.length > 30) errors.surveyNumber = "CSN No. cannot exceed 30 characters.";
    else if (!/^[a-zA-Z0-9/\-]+$/.test(csn)) errors.surveyNumber = "CSN No. can only contain alphanumeric characters, '/', and '-'.";
  }

  if (formData.plotNumber) {
    const plotNo = String(formData.plotNumber).trim();
    if (plotNo.length > 12) errors.plotNumber = "Plot Number cannot exceed 12 characters.";
    else if (!/^[a-zA-Z0-9/\-]+$/.test(plotNo)) errors.plotNumber = "Plot Number can only contain alphanumeric characters, hyphens, and slashes.";
  }

  if (formData.pTaxId) {
    const ptax = String(formData.pTaxId).trim();
    if (ptax.length > 10) errors.pTaxId = "PTax ID cannot exceed 10 characters.";
    else if (!/^[a-zA-Z0-9/\-]+$/.test(ptax)) errors.pTaxId = "PTax ID can only contain alphanumeric characters, '/', and '-'.";
  }

  if (formData.mpmsNo) {
    const mpms = String(formData.mpmsNo).trim();
    if (mpms.length > 12) errors.mpmsNo = "MPMS No. cannot exceed 12 characters.";
    else if (!/^[a-zA-Z0-9/\-]+$/.test(mpms)) errors.mpmsNo = "MPMS No. can only contain alphanumeric characters, hyphens, and slashes.";
  }
}

export function validateMovableLeaseFields(
  formData: ExtendedBuildingBasicInfoFormData,
  errors: BuildingBasicInfoFormErrors & Record<string, string | undefined>
) {
  if (formData.isMovableCategory) {
    const movableType = formData.movableAssetType || "standalone";
    if (movableType === "child") {
      if (!formData.parentAssetId) {
        errors.parentAssetId = "Please search and select a parent asset";
      }
    }
    delete errors.leaseStartDate;
    delete errors.leaseEndDate;
    delete errors.leasePeriodYears;
    delete errors.monthlyRent;
    delete errors.depositAmount;
    delete errors.lessorName;
    delete errors.lesseeName;
  }

  const isLeased = formData.ownershipType?.toUpperCase() === "LEASED" || formData.ownershipType?.toUpperCase() === "RENTED";
  if (isLeased) {
    if (!formData.leaseStartDate) errors.leaseStartDate = "Lease start date is required";
    if (!formData.leaseEndDate) errors.leaseEndDate = "Lease end date is required";
    if (formData.leaseStartDate && formData.leaseEndDate) {
      const start = new Date(formData.leaseStartDate);
      const end = new Date(formData.leaseEndDate);
      if (end < start) {
        errors.leaseEndDate = "Lease end date must be after start date";
      }
    }
    if (!formData.monthlyRent || Number(formData.monthlyRent) <= 0) {
      errors.monthlyRent = "Monthly rent must be greater than 0";
    }
  } else {
    delete errors.leaseStartDate;
    delete errors.leaseEndDate;
    delete errors.leasePeriodYears;
    delete errors.monthlyRent;
    delete errors.depositAmount;
    delete errors.lessorName;
    delete errors.lesseeName;
  }
}

export function validateDimensionFields(
  formData: ExtendedBuildingBasicInfoFormData,
  errors: BuildingBasicInfoFormErrors & Record<string, string | undefined>,
  isLand: boolean,
  isBuilding: boolean
) {
  if (isLand || isBuilding) {
    if (!formData.length || String(formData.length).trim() === "") {
      errors.length = "Plot length is required.";
    } else if (String(formData.length).trim().length > 8) {
      errors.length = "Plot Length cannot exceed 8 characters.";
    } else if (!isValidDecimal12_2(formData.length)) {
      errors.length = "Enter a valid positive number with up to 2 decimal places.";
    }

    if (!formData.width || String(formData.width).trim() === "") {
      errors.width = "Plot width is required.";
    } else if (String(formData.width).trim().length > 8) {
      errors.width = "Plot Width cannot exceed 8 characters.";
    } else if (!isValidDecimal12_2(formData.width)) {
      errors.width = "Enter a valid positive number with up to 2 decimal places.";
    }
  }
}

export { validateOwnershipFields } from "./validateBuildingBasicInfoOwnership.utils";
