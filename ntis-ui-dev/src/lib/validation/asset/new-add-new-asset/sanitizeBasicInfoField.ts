export function sanitizeBasicInfoField(name: string, value: string): string {
  // Sanitize: 1. No leading spaces.
  let sanitizedValue = value.replace(/^\s+/, "");
  const lowerName = name.toLowerCase();

  // 2. Digits only fields (Contact / Mobile / PinCode)
  if (
    lowerName.includes("mobile") ||
    lowerName.includes("pincode") ||
    lowerName.includes("phone") ||
    lowerName.includes("contact")
  ) {
    sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
    if (lowerName.includes("pincode")) {
      sanitizedValue = sanitizedValue.slice(0, 6);
    }
  }

  // 3. Name fields: allow letters, spaces, periods, apostrophes, hyphens (English & Marathi) with Title Case and max 40 chars
  if (name === "inChargeName" || name === "surveyedBy") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z\u0900-\u097F\s.'\-]/g, "").slice(0, 40);
    sanitizedValue = sanitizedValue.replace(/(^|\s)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  } else if (name === "inChargeNameRegional" || name === "inChargeRegionalName") {
    sanitizedValue = sanitizedValue.replace(/[^\u0900-\u0963\u0970-\u097Fa-zA-Z\s.'\-]/g, "").slice(0, 40);
    sanitizedValue = sanitizedValue.replace(/(^|\s)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  }

  // 4. Asset Name fields: Unicode letters and spaces (English and Marathi) with Title Case and max 150 chars
  if (name === "assetName") {
    sanitizedValue = sanitizedValue.replace(/[^\u0900-\u0963\u0970-\u097Fa-zA-Z\s]/g, "").slice(0, 150);
    sanitizedValue = sanitizedValue.replace(/(^|\s)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  } else if (name === "assetNameRegional") {
    sanitizedValue = sanitizedValue.replace(/[^\u0900-\u0963\u0970-\u097Fa-zA-Z\s]/g, "").slice(0, 150);
  }

  // 5. Code & Identifier fields: Alphanumeric and allowed separators
  if (name === "propertyNumber") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9/\-]/g, "").slice(0, 12);
  } else if (name === "partitionNo") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9/\-]/g, "").slice(0, 10);
  } else if (name === "upicId") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9/\-]/g, "").toUpperCase().slice(0, 15);
  } else if (name === "surveyNumber" || name === "csnNo") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9/\-]/g, "").slice(0, 30);
  } else if (name === "plotNumber") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9/\-]/g, "").slice(0, 12);
  } else if (name === "pTaxId") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9/\-]/g, "").slice(0, 10);
  } else if (name === "mpmsNo") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9/\-]/g, "").slice(0, 12);
  } else if (name === "assetCode" || name === "assetNo") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9/\-]/g, "");
  }

  // 6. Address fields: Allow standard address punctuation, Title Case, max 500 chars
  if (name === "fullAddress" || name === "fullAddressRegional") {
    sanitizedValue = sanitizedValue.replace(/[<>{}[\]$^%*+=~!"\\]/g, "").slice(0, 500);
    sanitizedValue = sanitizedValue.replace(/(^|\s)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  } else if (name === "locality" || name === "landmark") {
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9\u0900-\u097F\s,./#\-()]/g, "");
  }

  // 7. Email: No spaces, max 40 chars
  if (lowerName.includes("email")) {
    sanitizedValue = sanitizedValue.replace(/\s/g, "").slice(0, 40);
  }

  // 8. Coordinates: numbers, single minus at start, single decimal
  if (name === "latitude" || name === "longitude") {
    sanitizedValue = sanitizedValue.replace(/[^0-9.\-]/g, "");
    const parts = sanitizedValue.split(".");
    if (parts.length > 2) {
      sanitizedValue = parts[0] + "." + parts.slice(1).join("");
    }
  }

  // 9. Dimension fields (length, width, area): positive decimals only, decimal(12,2), max 8 chars
  if (name === "length" || name === "width") {
    sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, "");
    const parts = sanitizedValue.split(".");
    if (parts.length > 2) {
      sanitizedValue = parts[0] + "." + parts.slice(1).join("");
    }
    sanitizedValue = sanitizedValue.slice(0, 8);
    const dotIndex = sanitizedValue.indexOf(".");
    if (dotIndex !== -1) {
      const integerPart = sanitizedValue.slice(0, dotIndex).slice(0, 5);
      const decimalPart = sanitizedValue.slice(dotIndex + 1).slice(0, 2);
      sanitizedValue = integerPart + "." + decimalPart;
    } else {
      sanitizedValue = sanitizedValue.slice(0, 8);
    }
  } else if (name === "landArea" || name === "totalPlotArea") {
    sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, "");
    const parts = sanitizedValue.split(".");
    if (parts.length > 2) {
      sanitizedValue = parts[0] + "." + parts.slice(1).join("");
    }
  }

  return sanitizedValue;
}
