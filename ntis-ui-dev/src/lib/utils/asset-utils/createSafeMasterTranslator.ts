 
export type SafeTranslatorFn = {
  (key: string, values?: Record<string, string | number | Date>): string;
  has?: (key: string) => boolean;
};

export const getSafeMessage = (
  tFn?: unknown,
  key?: string,
  values?: Record<string, string | number | Date>
): string | null => {
  if (!tFn || typeof tFn !== "function" || !key) return null;
  const fn = tFn as SafeTranslatorFn;
  try {
    if (typeof fn.has === "function" && !fn.has(key)) {
      return null;
    }
    const res = fn(key, values);
    if (res && typeof res === "string" && !res.includes("MISSING_MESSAGE")) {
      return res;
    }
  } catch {
    // Ignore missing translation errors gracefully
  }
  return null;
};

export const createSafeMasterTranslator = (t: SafeTranslatorFn | unknown) => {
  return (key: string, values?: Record<string, string | number | Date>): string => {
    const cleanKey = key.replace(/^(labels\.|validation\.|errors\.|messages\.)/, "");
    const baseKey = cleanKey.replace(/Required$/, "");
    const prefixes = [
      key,
      cleanKey,
      baseKey,
      `validation.${cleanKey}`,
      `errors.${cleanKey}`,
      `labels.${cleanKey}`,
      `validation.${baseKey}`,
      `errors.${baseKey}`,
      `labels.${baseKey}`,
      `configuration.masterData.form.validation.${cleanKey}`,
      `configuration.masterData.form.errors.${cleanKey}`,
      `configuration.masterData.form.labels.${cleanKey}`,
      `configuration.masterData.form.validation.${baseKey}`,
      `configuration.masterData.form.errors.${baseKey}`,
      `configuration.masterData.form.labels.${baseKey}`,
    ];

    const kLower = key.toLowerCase();
    if (kLower.includes("code")) {
      prefixes.push(
        "configuration.masterData.form.errors.codeRequired",
        "configuration.masterData.form.errors.code",
        "codeRequired",
        "errors.codeRequired",
        "validation.codeRequired"
      );
    }
    if (kLower.includes("name") || kLower.includes("model")) {
      prefixes.push(
        "configuration.masterData.form.errors.nameRequired",
        "configuration.masterData.form.errors.name",
        "nameRequired",
        "errors.nameRequired",
        "validation.nameRequired"
      );
    }

    const fn = t as SafeTranslatorFn;
    for (const p of prefixes) {
      try {
        if (typeof fn?.has === "function" && fn.has(p)) {
          const res = fn(p, values);
          if (res && res !== p && !res.includes(p) && !res.includes("MISSING_MESSAGE")) {
            return res;
          }
        }
      } catch {}
    }

    const k = key.toLowerCase();

    if (k.includes("required")) {
      if (k.includes("code") || k.includes("subtypecode")) return "Code is required";
      if (k.includes("name") || k.includes("subtypename") || k.includes("conditionname") || k.includes("model")) return "Name is required";
      if (k.includes("valuationtype") || k.includes("valuation")) return "Valuation Type is required";
      if (k.includes("category")) return "Category selection is required";
      if (k.includes("type") || k.includes("conditiontype")) return "Type selection is required";
      if (k.includes("group") || k.includes("item")) return "Item selection is required";
      if (k.includes("registrationtype")) return "Registration Type is required";
      if (k.includes("factor")) return "Condition factor is required";
      if (k.includes("depreciationrate")) return "Depreciation rate is required";
      return "This field is required";
    }

    if (k.includes("allzeros") || k.includes("zeros")) {
      if (k.includes("code") || k.includes("subtypecode")) return "Code cannot be all zeros";
      if (k.includes("name") || k.includes("subtypename") || k.includes("conditionname") || k.includes("model")) return "Name cannot be all zeros";
      if (k.includes("description")) return "Description cannot be all zeros";
      return "Value cannot be all zeros";
    }

    if (k.includes("maxlength") || k.includes("max")) {
      const count = values?.count ?? values?.max ?? "";
      if (k.includes("code") || k.includes("subtypecode")) {
        return count ? `Code cannot exceed ${count} characters` : "Code exceeds maximum allowed length";
      }
      if (k.includes("name") || k.includes("subtypename") || k.includes("conditionname") || k.includes("model")) {
        return count ? `Name cannot exceed ${count} characters` : "Name exceeds maximum allowed length";
      }
      if (k.includes("description")) {
        return count ? `Description cannot exceed ${count} characters` : "Description exceeds maximum allowed length";
      }
      return count ? `Maximum length is ${count} characters` : "Exceeds maximum allowed length";
    }

    if (k.includes("format")) {
      if (k.includes("code") || k.includes("subtypecode")) {
        return "Only letters, numbers, hyphens, and underscores allowed";
      }
      return "Only letters (any language), numbers, spaces, and basic punctuation allowed (,./-()).";
    }

    if (k.includes("valuation") && (k.includes("format") || k.includes("invalid") || k.includes("chars"))) {
      return "Only alphanumeric, spaces, underscore and hyphen allowed";
    }

    if (k.includes("invalid") || k.includes("range")) {
      if (k.includes("factor")) return "Must be a valid positive number between 0 and 1";
      if (k.includes("depreciation")) return "Must be a valid rate between 0 and 1";
      return "Must be a valid positive number";
    }

    if (k.includes("mustbeactive") || k.includes("active")) return "Must be active on creation";
    if (k.includes("duplicate")) return "Record already exists";

    return "Invalid input";
  };
};
