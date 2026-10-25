import type {
  BuildingBasicInfoFormData,
  ValidationRule,
  ValidationSchema,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { ValidationRule, ValidationSchema };

// ─── Regex patterns ────────────────────────────────────────────────────────────
export const PIN_CODE_RE = /^[1-9]\d{5}$/;
export const MOBILE_RE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const NAME_RE = /^[a-zA-Z\u0900-\u097F\s.'\-]+$/;
export const REGIONAL_NAME_RE = /^[\u0900-\u0963\u0970-\u097Fa-zA-Z\s.'\-]+$/;
export const PROPERTY_TAX_RE = /^[a-zA-Z0-9/\-]+$/;
export const UPIC_RE = /^[a-zA-Z0-9/\-]+$/;
export const CSN_RE = /^[a-zA-Z0-9/\-]+$/;
export const PLOT_NO_RE = /^[a-zA-Z0-9/\-]+$/;
export const MPMS_RE = /^[a-zA-Z0-9/\-]+$/;
export const ASSET_NAME_RE = /^[a-zA-Z0-9\u0900-\u097F\s._/&,\-()]+$/;
export const ADDRESS_RE = /^[a-zA-Z0-9\u0900-\u097F\s,./#\-&()':;]+$/;

export const buildingBasicInfoSchema: ValidationSchema<BuildingBasicInfoFormData> = {
  // Section A: Property Number Details
  propertyNumber: {
    pattern: PROPERTY_TAX_RE,
    patternMessage: "Property No can only contain alphanumeric characters, '/', and '-'.",
    maxLength: 12,
    maxLengthMessage: "Property No cannot exceed 12 digits.",
  },
  partitionNo: {
    pattern: PROPERTY_TAX_RE,
    patternMessage: "Partition No. can only contain alphanumeric characters, '/', and '-'.",
    maxLength: 10,
    maxLengthMessage: "Partition No. cannot exceed 10 characters.",
  },
  upicId: {
    pattern: UPIC_RE,
    patternMessage: "UPIC ID can only contain alphanumeric characters, hyphens, and slashes.",
    maxLength: 15,
    maxLengthMessage: "UPIC ID cannot exceed 15 characters.",
  },
  surveyNumber: {
    pattern: CSN_RE,
    patternMessage: "CSN No. can only contain alphanumeric characters, '/', and '-'.",
    maxLength: 30,
    maxLengthMessage: "CSN No. cannot exceed 30 characters.",
  },
  length: {
    maxLength: 8,
    maxLengthMessage: "Plot Length cannot exceed 8 characters.",
  },
  width: {
    maxLength: 8,
    maxLengthMessage: "Plot Width cannot exceed 8 characters.",
  },
  plotNumber: {
    pattern: PLOT_NO_RE,
    patternMessage: "Plot Number can only contain alphanumeric characters, hyphens, and slashes.",
    maxLength: 12,
    maxLengthMessage: "Plot Number cannot exceed 12 characters.",
  },
  pTaxId: {
    pattern: PROPERTY_TAX_RE,
    patternMessage: "PTax ID can only contain alphanumeric characters, '/', and '-'.",
    maxLength: 10,
    maxLengthMessage: "PTax ID cannot exceed 10 characters.",
  },
  mpmsNo: {
    pattern: MPMS_RE,
    patternMessage: "MPMS No. can only contain alphanumeric characters, '/', and '-'.",
    maxLength: 12,
    maxLengthMessage: "MPMS No. cannot exceed 12 characters.",
  },
  zone: {
    required: true,
    requiredMessage: "Zone is required.",
  },
  ward: {
    required: true,
    requiredMessage: "Ward is required.",
  },

  // Section B: Ownership & Address Details
  assetName: {
    required: true,
    requiredMessage: "Asset Name is required.",
    minLength: 3,
    minLengthMessage: "Asset Name must be at least 3 characters.",
    maxLength: 150,
    maxLengthMessage: "Asset Name cannot exceed 150 characters.",
    pattern: ASSET_NAME_RE,
    patternMessage: "Asset Name can only contain letters, numbers, spaces, and basic punctuation (-, _, /, &, ., ,, ()).",
    custom: (val: string | number | boolean | null | undefined) => {
      if (!val || typeof val !== "string") return undefined;
      const trimmed = val.trim();
      if (/^[.\s]+$/.test(trimmed)) {
        return "Asset Name cannot be only dots or periods. Periods are allowed only with text.";
      }
      if (!/[a-zA-Z0-9\u0900-\u097F]/.test(trimmed)) {
        return "Asset Name must contain text characters.";
      }
      return undefined;
    },
  },
  assetNameRegional: {
    maxLength: 150,
    maxLengthMessage: "Regional Name cannot exceed 150 characters.",
    pattern: ASSET_NAME_RE,
    patternMessage: "Asset Regional Name can only contain letters, numbers, spaces, and basic punctuation.",
  },
  department: {
    required: true,
    requiredMessage: "Owning Department is required.",
  },
  ownershipType: {
    required: true,
    requiredMessage: "Ownership Type is required.",
  },
  fullAddress: {
    required: true,
    requiredMessage: "Full Address is required.",
    minLength: 10,
    minLengthMessage: "Full Address must be at least 10 characters.",
    maxLength: 500,
    maxLengthMessage: "Full Address cannot exceed 500 characters.",
    pattern: ADDRESS_RE,
    patternMessage: "Full Address cannot contain invalid special characters (<, >, {, }, $, ^, ~, %, *, =).",
  },
  fullAddressRegional: {
    maxLength: 500,
    maxLengthMessage: "Regional Address cannot exceed 500 characters.",
    pattern: ADDRESS_RE,
    patternMessage: "Regional Address cannot contain invalid special characters (<, >, {, }, $, ^, ~, %, *, =).",
  },
  pinCode: {
    required: true,
    requiredMessage: "Pin Code is required.",
    pattern: PIN_CODE_RE,
    patternMessage: "Pin Code must be a valid 6-digit Indian PIN code not starting with 0.",
  },
  inChargeName: {
    maxLength: 40,
    maxLengthMessage: "In-Charge Name cannot exceed 40 characters.",
    pattern: NAME_RE,
    patternMessage: "In-Charge Name can only contain letters, spaces, '.', ''', and '-'.",
  },
  inChargeMobile: {
    pattern: MOBILE_RE,
    patternMessage: "Contact Number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
  },
  inChargeEmail: {
    maxLength: 40,
    maxLengthMessage: "Email cannot exceed 40 characters.",
    pattern: EMAIL_RE,
    patternMessage: "Please enter a valid email address.",
  },
};

