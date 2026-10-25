 
import type { AssetFieldValueRequest } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import type { AssetFieldDefinition } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-field-definition.service";
import type { BuildingBasicInfoFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";

/**
 * Dynamic organization tenant ID resolver.
 * Prioritizes the authenticated server session tenant ID over client-provided payload values to prevent tenant spoofing.
 */
export const getDynamicOrganizationId = (
  formData?: { organizationId?: number; attributes?: Record<string, string | number | boolean> },
  sessionOrgId?: number | null
): number => {
  const sessionValidId = sessionOrgId && !isNaN(Number(sessionOrgId)) && Number(sessionOrgId) > 0 ? Number(sessionOrgId) : null;
  if (sessionValidId) return sessionValidId;
  const orgId = Number(formData?.organizationId ?? formData?.attributes?.organizationId);
  return !isNaN(orgId) && orgId > 0 ? orgId : 1;
};

/**
 * Dynamic system audit user ID resolver.
 * Prioritizes the authenticated server session user ID over client-provided payload values to prevent audit forgery.
 */
export const getDynamicUserId = (
  formData?: { createdBy?: number; userId?: number; attributes?: Record<string, string | number | boolean> },
  sessionUserId?: number | null
): number => {
  const sessionValidId = sessionUserId && !isNaN(Number(sessionUserId)) && Number(sessionUserId) > 0 ? Number(sessionUserId) : null;
  if (sessionValidId) return sessionValidId;
  const rawId = formData?.createdBy ?? formData?.userId ?? formData?.attributes?.createdBy ?? formData?.attributes?.userId;
  const userId = Number(rawId);
  return !isNaN(userId) && userId > 0 ? userId : 1;
};

export const normalize = (str?: string) => (str || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

export function buildFieldValuesFromAttributes(
  formData: BuildingBasicInfoFormData,
  fieldDefs: AssetFieldDefinition[]
): AssetFieldValueRequest[] {
  const attributes = (formData.attributes || {}) as Record<string, unknown>;
  const mergedPool: Record<string, unknown> = {
    ...attributes,
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
  };

  const results: AssetFieldValueRequest[] = [];
  const seenDefIds = new Set<number>();

  // 1. Iterate through each known FieldDefinition and resolve its value with exact priority
  for (const def of fieldDefs) {
    const defId = Number(def.id ?? def.fieldDefinitionId);
    if (isNaN(defId) || defId <= 0 || seenDefIds.has(defId)) continue;

    const fn = def.fieldName;
    const fc = def.fieldCode;
    const lbl = def.fieldLabel || def.label || def.displayName;

    // Direct key candidates in order of precision: fieldName -> lower(fieldName) -> fieldCode -> lower(fieldCode) -> fieldLabel -> lower(fieldLabel) -> field_<id> -> <id>
    const candidates = [
      fn,
      fn?.toLowerCase(),
      fc,
      fc?.toLowerCase(),
      lbl,
      lbl?.toLowerCase(),
      `field_${defId}`,
      String(defId),
    ].filter((k): k is string => Boolean(k));

    let resolvedVal: unknown = undefined;
    for (const key of candidates) {
      if (mergedPool[key] !== undefined && mergedPool[key] !== null && mergedPool[key] !== "") {
        resolvedVal = mergedPool[key];
        break;
      }
    }

    // Secondary exact normalized match (handles minor spacing/casing differences without partial substring matches)
    if (resolvedVal === undefined || resolvedVal === null || resolvedVal === "") {
      const fnNorm = normalize(fn);
      const fcNorm = normalize(fc);
      const lblNorm = normalize(lbl);

      for (const [poolKey, poolVal] of Object.entries(mergedPool)) {
        if (poolVal === undefined || poolVal === null || poolVal === "") continue;
        const pkNorm = normalize(poolKey);
        if (pkNorm && (pkNorm === fnNorm || pkNorm === fcNorm || pkNorm === lblNorm)) {
          resolvedVal = poolVal;
          break;
        }
      }
    }

    if (resolvedVal !== undefined && resolvedVal !== null && resolvedVal !== "") {
      seenDefIds.add(defId);

      const fieldType = (def.fieldType || def.type || "").toLowerCase();
      let fieldValue: string | null = null;

      if (fieldType === "boolean" || typeof resolvedVal === "boolean") {
        const boolVal = typeof resolvedVal === "boolean" ? resolvedVal : (resolvedVal === "true" || resolvedVal === "1" || String(resolvedVal).toLowerCase() === "yes");
        fieldValue = boolVal ? "true" : "false";
      } else if (fieldType === "date") {
        const d = new Date(String(resolvedVal));
        if (!isNaN(d.getTime())) {
          fieldValue = d.toISOString();
        } else {
          // If not a standard parsable date, keep the user-entered string instead of saving null
          fieldValue = String(resolvedVal);
        }
      } else {
        fieldValue = String(resolvedVal);
      }

      results.push({
        fieldDefinitionId: defId,
        fieldName: def.fieldName || def.fieldLabel || `field_${defId}`,
        fieldValue,
        isActive: true,
      });
    }
  }

  return results;
}
