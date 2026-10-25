/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Maps the submitted dynamic attributes (plus a handful of always-present
 * legacy top-level fields) into the AMS.AssetFieldValue EAV rows, resolving
 * each key against the field definitions fetched for this category/type.
 * Keys with no matching definition are silently dropped — sending an
 * unmapped field would otherwise throw a unique-constraint error.
 */
const normalize = (str?: string) => (str || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

export function buildFieldValuesFromAttributes(formData: any, fieldDefs: any[]) {
  const attributeEntries = Object.entries({
    ...(formData.attributes || {}),
    plotNumber: formData.plotNumber,
    surveyNumber: formData.surveyNumber,
    offset: formData.offset,
    offsetOp: formData.offsetOp,
    partitionNo: formData.partitionNo,
    upicId: formData.upicId,
    isRented: formData.isRented,
    leaseStartDate: formData.leaseStartDate,
    leaseEndDate: formData.leaseEndDate,
    leaseAmount: formData.leaseAmount,
    securityDeposit: formData.securityDeposit,
    paymentFrequency: formData.paymentFrequency,
    lessorName: formData.lessorName,
    lessorMobile: formData.lessorMobile,
    lessorEmail: formData.lessorEmail,
    lessorAddress: formData.lessorAddress,
  }).filter(([_, value]) => value !== undefined && value !== null && value !== "");

  const seenDefIds = new Set<number>();
  const results: any[] = [];

  for (const [key, value] of attributeEntries) {
    const kNorm = normalize(key);

    const definition = fieldDefs.find((d: any) => {
      const defId = String(d.id ?? d.fieldDefinitionId ?? "");
      if (defId && (key === defId || key === `field_${defId}`)) return true;

      const fnNorm = normalize(d.fieldName);
      const fcNorm = normalize(d.fieldCode);
      const lblNorm = normalize(d.fieldLabel || d.label || d.displayName);

      if (kNorm && (kNorm === fnNorm || kNorm === fcNorm || kNorm === lblNorm)) return true;

      // Common alias mappings between form keys and database field definition labels
      if (key === "OldMarathiSocietyName" && (lblNorm.includes("oldsocietyname") || lblNorm.includes("societyname") || fnNorm.includes("societyname"))) return true;
      if (key === "Category" && (lblNorm.includes("legacycategory") || fnNorm.includes("legacycategory"))) return true;
      if (key === "PartType" && (lblNorm.includes("legacyparttype") || fnNorm.includes("legacyparttype"))) return true;
      if (key === "BlockNo" && (lblNorm.includes("blocknumber") || fnNorm.includes("blockno"))) return true;
      if (key === "BuilderName" && (lblNorm.includes("buildername") || fnNorm.includes("buildername"))) return true;
      if (key === "OpenPlotType" && (lblNorm.includes("openplottype") || fnNorm.includes("openplottype"))) return true;

      return false;
    });

    // DO NOT send fields that do not have a matching field definition
    if (!definition) continue;

    const fieldDefinitionId = Number(definition.id ?? definition.fieldDefinitionId);
    if (isNaN(fieldDefinitionId) || fieldDefinitionId <= 0 || seenDefIds.has(fieldDefinitionId)) continue;

    seenDefIds.add(fieldDefinitionId);

    // Use direct label from field definition column
    const directFieldLabel = definition.fieldLabel || definition.fieldName || key;

    let fieldValue: string | null = null;
    const fieldType = definition?.fieldType?.toLowerCase() || definition?.type?.toLowerCase() || "";

    if (fieldType === "boolean" || typeof value === "boolean") {
      const boolVal = typeof value === "boolean" ? value : (value === "true" || value === "1" || value === 1 || String(value).toLowerCase() === "yes");
      fieldValue = boolVal ? "true" : "false";
    } else if (fieldType === "date") {
      if (value) {
        try {
          fieldValue = new Date(String(value)).toISOString();
        } catch {
          fieldValue = null;
        }
      }
    } else {
      fieldValue = value !== null && value !== undefined ? String(value) : null;
    }

    results.push({
      fieldDefinitionId,
      fieldName: directFieldLabel,
      fieldValue,
      isActive: true
    });
  }

  return results;
}
