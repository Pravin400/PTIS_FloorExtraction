import type {
  BuildingBasicInfoFormErrors,
} from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import type { ExtendedBuildingBasicInfoFormData } from "./validateBuildingBasicInfo.utils";

export function validateOwnershipFields(
  formData: ExtendedBuildingBasicInfoFormData,
  errors: BuildingBasicInfoFormErrors & Record<string, string | undefined>
) {
  if (!formData.owningDepartmentId && !formData.department) {
    errors.department = "Owning Department is required.";
  }
  if (!formData.ownershipType) {
    errors.ownershipType = "Ownership Type is required.";
  }
  if (!formData.assetName || String(formData.assetName).trim() === "") {
    errors.assetName = "Asset Name is required.";
  } else {
    const aName = String(formData.assetName).trim();
    if (aName.length > 150) {
      errors.assetName = "Asset Name cannot exceed 150 characters.";
    } else if (!/^[a-zA-Z\u0900-\u097F\s]+$/.test(aName)) {
      errors.assetName = "Asset Name can only contain letters and spaces (no numbers or special characters).";
    }
  }

  if (formData.assetNameRegional) {
    const aRegName = String(formData.assetNameRegional).trim();
    if (aRegName.length > 150) {
      errors.assetNameRegional = "Regional Asset Name cannot exceed 150 characters.";
    } else if (!/^[\u0900-\u0963\u0970-\u097Fa-zA-Z\s]+$/.test(aRegName)) {
      errors.assetNameRegional = "Regional Asset Name can only contain letters and spaces (no numbers or special characters).";
    }
  }

  // In-Charge Name strictly letters, spaces, periods, apostrophes, hyphens (English and Marathi)
  if (formData.inChargeName) {
    const name = String(formData.inChargeName).trim();
    if (name.length > 40) {
      errors.inChargeName = "In-Charge Name cannot exceed 40 characters.";
    } else if (/\d/.test(name)) {
      errors.inChargeName = "In-Charge Name cannot contain numbers or digits.";
    } else if (!/^[a-zA-Z\u0900-\u097F\s.'\-]+$/.test(name)) {
      errors.inChargeName = "In-Charge Name can only contain letters, spaces, and periods (no numbers or special characters).";
    }
  }

  // In-Charge Regional Name
  if (formData.inChargeRegionalName || formData.inChargeNameRegional) {
    const regName = String(formData.inChargeRegionalName || formData.inChargeNameRegional).trim();
    if (regName.length > 40) {
      errors.inChargeNameRegional = "In-Charge Regional Name cannot exceed 40 characters.";
      errors.inChargeRegionalName = "In-Charge Regional Name cannot exceed 40 characters.";
    } else if (/\d/.test(regName)) {
      errors.inChargeNameRegional = "In-Charge Regional Name cannot contain numbers or digits.";
      errors.inChargeRegionalName = "In-Charge Regional Name cannot contain numbers or digits.";
    } else if (!/^[\u0900-\u0963\u0970-\u097Fa-zA-Z\s.'\-]+$/.test(regName)) {
      errors.inChargeNameRegional = "In-Charge Regional Name can only contain regional letters, spaces, and periods (no numbers or special characters).";
      errors.inChargeRegionalName = "In-Charge Regional Name can only contain regional letters, spaces, and periods (no numbers or special characters).";
    }
  }

  // Contact Number (Indian 10-digit mobile)
  if (formData.contactNumber) {
    const contact = String(formData.contactNumber).replace(/\D/g, "");
    if (contact.length > 0 && contact.length !== 10) {
      errors.contactNumber = "Contact number must be exactly 10 digits.";
    } else if (contact.length === 10 && !/^[6-9]/.test(contact)) {
      errors.contactNumber = "Contact number must start with 6, 7, 8, or 9.";
    }
  }

  // Pin Code (Indian 6-digit postal code)
  if (!formData.pinCode || String(formData.pinCode).trim() === "") {
    errors.pinCode = "Pin Code is required.";
  } else {
    const pin = String(formData.pinCode).replace(/\D/g, "");
    if (pin.length !== 6) {
      errors.pinCode = "Pin Code must be exactly 6 digits.";
    } else if (pin.startsWith("0")) {
      errors.pinCode = "Pin Code cannot start with 0.";
    }
  }

  // Email validation (check both inChargeEmail and email)
  const emailRaw = formData.inChargeEmail || formData.email;
  if (emailRaw && String(emailRaw).trim() !== "") {
    const email = String(emailRaw).trim();
    if (email.length > 40) {
      if (formData.inChargeEmail) errors.inChargeEmail = "Email cannot exceed 40 characters.";
      if (formData.email) errors.email = "Email cannot exceed 40 characters.";
    } else if (email.includes(" ") || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      if (formData.inChargeEmail) errors.inChargeEmail = "Please enter a valid email address.";
      if (formData.email) errors.email = "Please enter a valid email address.";
    }
  }

  // Full Address
  if (!formData.fullAddress || String(formData.fullAddress).trim() === "") {
    errors.fullAddress = "Full Address is required.";
  } else {
    const addr = String(formData.fullAddress).trim();
    if (addr.length < 5) {
      errors.fullAddress = "Full Address must be at least 5 characters.";
    } else if (addr.length > 500) {
      errors.fullAddress = "Full Address cannot exceed 500 characters.";
    } else if (!/^[a-zA-Z0-9\u0900-\u097F\s,./#\-&()':;]+$/.test(addr)) {
      errors.fullAddress = "Full Address contains invalid special characters.";
    }
  }

  // Regional Address
  if (formData.fullAddressRegional || formData.regionalAddress) {
    const regAddr = String(formData.fullAddressRegional || formData.regionalAddress).trim();
    if (regAddr.length > 500) {
      errors.fullAddressRegional = "Regional Address cannot exceed 500 characters.";
    } else if (!/^[a-zA-Z0-9\u0900-\u097F\s,./#\-&()':;]+$/.test(regAddr)) {
      errors.fullAddressRegional = "Regional Address contains invalid special characters.";
    }
  }
}
