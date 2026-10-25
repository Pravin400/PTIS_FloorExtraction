 
/**
 * Sanitizes input text for dynamic field values based on field name, label, and type.
 */
export function sanitizeDynamicFieldValue(
  rawVal: string,
  lowerName: string,
  lowerLabel: string,
  typeLower?: string
): string | number {
  let val = rawVal.replace(/^\s+/, "");

  if (
    lowerName.includes("mobile") ||
    lowerName.includes("pincode") ||
    lowerName.includes("phone") ||
    lowerName.includes("contact") ||
    lowerLabel.includes("mobile") ||
    lowerLabel.includes("pincode") ||
    lowerLabel.includes("phone") ||
    lowerLabel.includes("contact")
  ) {
    val = val.replace(/\D/g, "");
  }

  const isNameField = lowerName.includes("name") || lowerLabel.includes("name") || lowerName.includes("by") || lowerLabel.includes("by");
  const isDesignationField = lowerName.includes("designation") || lowerLabel.includes("designation");
  const isAddressField = lowerName.includes("address") || lowerLabel.includes("address");
  const isLocalityField = lowerName.includes("locality") || lowerLabel.includes("locality") || lowerName.includes("landmark") || lowerLabel.includes("landmark");

  if (isNameField) {
    val = val.replace(/[^a-zA-Z\s.]/g, "");
  } else if (isDesignationField) {
    val = val.replace(/[^a-zA-Z\s-]/g, "");
  } else if (isAddressField) {
    val = val.replace(/[^a-zA-Z0-9\s,./#\-()]/g, "");
  } else if (isLocalityField) {
    val = val.replace(/[^a-zA-Z0-9\s,./-]/g, "");
  }

  const isCodeField = lowerName.includes("code") || lowerLabel.includes("code") || lowerName.includes("no") || lowerLabel.includes("no");
  const isTaxField = lowerName.includes("tax") || lowerLabel.includes("tax");
  const isEmailField = lowerName.includes("email") || lowerLabel.includes("email");
  const isCoordinateField = lowerName.includes("latitude") || lowerLabel.includes("latitude") || lowerName.includes("longitude") || lowerLabel.includes("longitude");
  const isValuationField = lowerName.includes("value") || lowerLabel.includes("value") || lowerName.includes("rate") || lowerLabel.includes("rate") || lowerName.includes("cost") || lowerLabel.includes("cost") || lowerName.includes("price") || lowerLabel.includes("price") || lowerName.includes("valuation") || lowerLabel.includes("valuation");

  if (isCodeField) {
    val = val.replace(/[^a-zA-Z0-9\-_/]/g, "");
  } else if (isTaxField) {
    val = val.replace(/[^a-zA-Z0-9\-/]/g, "");
  } else if (isEmailField) {
    val = val.replace(/\s/g, "");
  } else if (isCoordinateField) {
    val = val.replace(/[^0-9.\-]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    if (val.includes("-")) {
      val = (val.startsWith("-") ? "-" : "") + val.replace(/-/g, "");
    }
  } else if (isValuationField) {
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
  }

  if (typeLower === "number") {
    const numVal = Number(val);
    if (numVal < 0) return 0;
  }

  return val;
}
